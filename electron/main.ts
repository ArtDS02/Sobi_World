// Main process (spec §13.1, §13.2, §9.1–9.4, §10.4): window, app:// protocol, single instance,
// save IPC, native dialogs, flush before quit. The only place with a dev URL is `npm run dev:desktop`.
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  screen,
  session,
  shell,
} from 'electron';
import * as fsp from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import type { IpcChannel, SaveCandidateSource } from '../src/platform/desktop/bridge';
import { createSaveFiles, type SaveFiles } from './saveFiles';
import { readWindowState, WINDOW_MIN, writeWindowState } from './windowState';

const FLUSH_TIMEOUT_MS = 3000;
const SCHEME = 'app';
const ORIGIN = `${SCHEME}://game`;
const DEV_URL = app.isPackaged ? null : (process.env.UNIN_DEV_URL ?? null);
const DIST_DIR = join(__dirname, '..', 'dist');
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
};

// Saves live in %APPDATA%\Un In Homemade\ whatever the (Vietnamese) product name is (§9.1).
// An unpackaged run (dev:desktop) uses its own folder so it never touches the player's farm.
const DATA_DIR = app.isPackaged ? 'Un In Homemade' : 'Un In Homemade Dev';
app.setPath('userData', join(app.getPath('appData'), DATA_DIR));
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win: BrowserWindow | null = null;

  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });

  let saves: SaveFiles | null = null;
  // A write started by pagehide may still be running: let it finish (≤ 3 s) before exiting.
  app.on('window-all-closed', () => {
    const pending = saves?.idle() ?? Promise.resolve();
    void Promise.race([pending, new Promise((r) => setTimeout(r, FLUSH_TIMEOUT_MS))]).then(() =>
      app.quit(),
    );
  });

  void app.whenReady().then(async () => {
    saves = createSaveFiles({ dir: join(app.getPath('userData'), 'saves'), now: Date.now });
    registerProtocol();
    lockDownSession();
    registerSaveIpc(saves, () => win);
    if (app.isPackaged) Menu.setApplicationMenu(null);
    win = await createWindow();
  });
}

/** Serves dist/ from inside the package; nothing outside it is reachable. */
function registerProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);
    const file = normalize(join(DIST_DIR, decodeURIComponent(url.pathname)));
    if (url.host !== 'game' || !file.startsWith(DIST_DIR + sep)) {
      return new Response('Not found', { status: 404 });
    }
    try {
      const body = await fsp.readFile(file);
      const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
      return new Response(body, {
        headers: { 'Content-Type': type, 'Content-Security-Policy': CSP },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

/** §13.2: zero network, no permissions. Only the dev server is let through in dev:desktop. */
function lockDownSession() {
  const s = session.defaultSession;
  s.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    callback({ cancel: !(DEV_URL && details.url.startsWith(DEV_URL)) });
  });
  s.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  s.setPermissionCheckHandler(() => false);
}

function handle(channel: IpcChannel, fn: (...args: never[]) => unknown) {
  ipcMain.handle(channel, (_event, ...args: unknown[]) => fn(...(args as never[])));
}

function registerSaveIpc(saves: SaveFiles, getWin: () => BrowserWindow | null) {
  const version: IpcChannel = 'unin:app:version';
  ipcMain.on(version, (event) => {
    event.returnValue = app.getVersion();
  });
  handle('unin:save:load', () => saves.readCandidates());
  handle('unin:save:write', (json: string) => saves.write(json));
  handle('unin:save:markCorrupt', (source: SaveCandidateSource) => saves.markCorrupt(source));
  handle('unin:save:listBackups', () => saves.listBackups());
  handle('unin:save:restoreBackup', (name: string) => saves.restoreBackup(name));
  handle('unin:save:exportTo', async (json: string, suggestedName: string) => {
    const win = getWin();
    const options = {
      defaultPath: join(app.getPath('documents'), suggestedName),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    };
    const r = win
      ? await dialog.showSaveDialog(win, options)
      : await dialog.showSaveDialog(options);
    if (r.canceled || !r.filePath) return false;
    await saves.exportTo(r.filePath, json);
    return true;
  });
  handle('unin:save:importFrom', async () => {
    const win = getWin();
    const options = {
      properties: ['openFile' as const],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    };
    const r = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options);
    const path = r.filePaths[0];
    if (r.canceled || !path) return null;
    const text = await saves.readExternal(path);
    await saves.backupNow(); // §9.3: the current save becomes a backup before an import
    return text;
  });
  handle('unin:save:openFolder', async () => {
    const dir = join(app.getPath('userData'), 'saves');
    await fsp.mkdir(dir, { recursive: true });
    await shell.openPath(dir);
  });
}

async function createWindow(): Promise<BrowserWindow> {
  const statePath = join(app.getPath('userData'), 'window-state.json');
  const state = await readWindowState(
    statePath,
    screen.getAllDisplays().map((d) => d.workArea),
  );
  const win = new BrowserWindow({
    ...state,
    minWidth: WINDOW_MIN.width,
    minHeight: WINDOW_MIN.height,
    show: false,
    backgroundColor: '#fff7f0',
    autoHideMenuBar: app.isPackaged,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  if (state.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());

  const allowed = (url: string) =>
    url.startsWith(`${ORIGIN}/`) || (DEV_URL !== null && url.startsWith(DEV_URL));
  win.webContents.on('will-navigate', (e, url) => {
    if (!allowed(url)) e.preventDefault();
  });
  win.webContents.on('will-redirect', (e, url) => {
    if (!allowed(url)) e.preventDefault();
  });
  win.webContents.on('will-attach-webview', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      e.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    }
  });

  // Before the window goes away: remember its bounds and let the renderer flush the save (≤ 3 s).
  let flushed = false;
  win.on('close', (e) => {
    if (flushed) return;
    e.preventDefault();
    const bounds = win.getNormalBounds();
    void Promise.all([
      writeWindowState(statePath, { ...bounds, maximized: win.isMaximized() }),
      requestFlush(win),
    ]).then(() => {
      flushed = true;
      win.close();
    });
  });

  await win.loadURL(DEV_URL ?? `${ORIGIN}/index.html`);
  return win;
}

function requestFlush(win: BrowserWindow): Promise<void> {
  const done: IpcChannel = 'unin:app:flushDone';
  const request: IpcChannel = 'unin:app:flushRequest';
  return new Promise((resolve) => {
    const timer = setTimeout(finish, FLUSH_TIMEOUT_MS);
    function finish() {
      clearTimeout(timer);
      ipcMain.removeListener(done, finish);
      resolve();
    }
    ipcMain.on(done, finish);
    if (win.webContents.isDestroyed()) finish();
    else win.webContents.send(request);
  });
}
