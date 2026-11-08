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
import { extname, join } from 'node:path';
import type { IpcChannel, SaveCandidateSource } from '../src/platform/desktop/bridge';
import { adoptLegacySaves, DATA_DIR_NAME, devUserDataDir, LEGACY_DATA_DIR_NAME } from './dataDir';
import { resolveAppPath } from './appPath';
import { writeBinaryFile } from './importExport';
import { createErrorLog, type ErrorLog } from './errorLog';
import { createReloadLimiter } from './reloadLimiter';
import { createSaveFiles, type SaveFiles } from './saveFiles';
import { createSettingsFile, type SettingsFile } from './settingsFile';
import { readWindowState, WINDOW_MIN, writeWindowState } from './windowState';

const FLUSH_TIMEOUT_MS = 3000;
/** A hung renderer is given this long to recover before the window is reloaded. */
const UNRESPONSIVE_RELOAD_MS = 15_000;
const RELOAD_MAX = 3;
const RELOAD_WINDOW_MS = 5 * 60_000;
const SCHEME = 'app';
const ORIGIN = `${SCHEME}://game`;
const DEV_URL = app.isPackaged ? null : process.env.UNIN_DEV_URL || null; // empty = unset
// SOBIWORLD_APPDATA replaces %APPDATA% (installer check, tests): the packed exe can then run on a
// throw-away folder instead of the player's own saves. Unset for players.
const APP_DATA = process.env.SOBIWORLD_APPDATA || app.getPath('appData');
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

// Saves live in %APPDATA%\SobiWorld\ whatever the product name is (§9.1, ARCHITECTURE §9); Sobi Farm's
// folder is copied over on the first run. An unpackaged run (dev:desktop) uses the dev folder — the
// same farm `npm run dev` plays (AM-1) — so it never touches the player's farm. The e2e smoke test
// (§14.8) points it at a temp folder.
app.setPath(
  'userData',
  app.isPackaged
    ? join(APP_DATA, DATA_DIR_NAME.installed)
    : devUserDataDir(APP_DATA, process.env.UNIN_USER_DATA),
);
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
  let errorLog: ErrorLog | null = null;
  // A write started by pagehide may still be running: let it finish (≤ 3 s) before exiting.
  app.on('window-all-closed', () => {
    const pending = saves?.idle() ?? Promise.resolve();
    void Promise.race([pending, new Promise((r) => setTimeout(r, FLUSH_TIMEOUT_MS))]).then(() =>
      app.quit(),
    );
  });

  void app.whenReady().then(async () => {
    // A temp folder (UNIN_USER_DATA, e2e) never adopts a farm.
    if (app.isPackaged || !process.env.UNIN_USER_DATA) {
      const legacy = app.isPackaged ? LEGACY_DATA_DIR_NAME.installed : LEGACY_DATA_DIR_NAME.dev;
      await adoptLegacySaves(join(APP_DATA, legacy), app.getPath('userData')).catch(
        (e: unknown) => console.error('could not copy the Sobi Farm save', e),
      );
    }
    errorLog = createErrorLog({ dir: join(app.getPath('userData'), 'logs'), now: Date.now });
    ipcMain.on('unin:log:error' satisfies IpcChannel, (_event, where: unknown, message: unknown) => {
      void errorLog?.log(String(where).slice(0, 40), String(message));
    });
    process.on('uncaughtException', (e) => void errorLog?.log('main.uncaughtException', String(e?.stack ?? e)));
    process.on('unhandledRejection', (e) => void errorLog?.log('main.unhandledRejection', String((e as Error)?.stack ?? e)));
    saves = createSaveFiles({
      dir: join(app.getPath('userData'), 'saves'),
      now: Date.now,
      onError: (where, e) => void errorLog?.log(where, String((e as Error)?.stack ?? e)),
    });
    registerProtocol();
    lockDownSession();
    registerSaveIpc(saves, () => win);
    registerSettingsIpc(createSettingsFile(join(app.getPath('userData'), 'settings.json')));
    if (app.isPackaged) Menu.setApplicationMenu(null);
    win = await createWindow(errorLog);
    // AM-1: save.json replaced by another program (admin dashboard) → the renderer reloads it.
    const changed: IpcChannel = 'unin:save:changed';
    await saves.watch(() => {
      if (win && !win.webContents.isDestroyed()) win.webContents.send(changed);
    });
  });
}

/** Serves dist/ from inside the package; nothing outside it is reachable. */
function registerProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);
    const file = resolveAppPath(DIST_DIR, url.pathname);
    if (url.host !== 'game' || file === null) {
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
  handle('unin:save:backupBeforeReset', () => saves.backupBeforeReset());
  handle('unin:save:backupBeforeMigration', (fromVersion: number) =>
    saves.backupBeforeMigration(fromVersion),
  );
  handle('unin:save:backupBeforeSliceRepair', () => saves.backupBeforeSliceRepair());
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
  handle('unin:save:savePhoto', async (png: Uint8Array, suggestedName: string) => {
    // D9: the player picks where the photo goes; main only checks it is a PNG and writes it atomically.
    const sig = [0x89, 0x50, 0x4e, 0x47];
    if (!(png instanceof Uint8Array) || png.length < 8 || !sig.every((b, i) => png[i] === b)) throw new Error('not a PNG');
    const win = getWin();
    const options = { defaultPath: join(app.getPath('pictures'), suggestedName), filters: [{ name: 'PNG', extensions: ['png'] }] };
    const r = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (r.canceled || !r.filePath) return false;
    await writeBinaryFile(r.filePath, png);
    return true;
  });
  handle('unin:save:openFolder', async () => {
    const dir = join(app.getPath('userData'), 'saves');
    await fsp.mkdir(dir, { recursive: true });
    await shell.openPath(dir);
  });
}

function registerSettingsIpc(settings: SettingsFile) {
  handle('unin:settings:load', () => settings.read());
  handle('unin:settings:write', (json: string) => settings.write(json));
}

async function createWindow(errorLog: ErrorLog): Promise<BrowserWindow> {
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

  guardRenderer(win, errorLog);
  await win.loadURL(DEV_URL ?? `${ORIGIN}/index.html`);
  return win;
}

/**
 * A2: a crashed, failed or hung renderer is logged and the window reloaded, at most RELOAD_MAX times per
 * RELOAD_WINDOW_MS. A hung (but alive) renderer is first asked to flush the save.
 */
function guardRenderer(win: BrowserWindow, errorLog: ErrorLog) {
  const limiter = createReloadLimiter(RELOAD_MAX, RELOAD_WINDOW_MS, Date.now);
  const wc = win.webContents;
  const reload = (why: string) => {
    if (wc.isDestroyed()) return;
    if (!limiter.allow()) {
      void errorLog.log('window', `${why}: reload limit reached, leaving the window as it is`);
      return;
    }
    void errorLog.log('window', `${why}: reloading`);
    wc.reload();
  };
  wc.on('render-process-gone', (_e, details) => reload(`render-process-gone (${details.reason})`));
  wc.on('did-fail-load', (_e, code, description, _url, isMainFrame) => {
    // -3 = aborted (a navigation replaced the load): not a failure.
    if (isMainFrame && code !== -3) reload(`did-fail-load ${code} ${description}`);
  });
  let hang: ReturnType<typeof setTimeout> | null = null;
  win.on('unresponsive', () => {
    void errorLog.log('window', 'unresponsive');
    void requestFlush(win); // the save is written first if the renderer still answers
    hang = setTimeout(() => reload('still unresponsive'), UNRESPONSIVE_RELOAD_MS);
  });
  win.on('responsive', () => {
    if (hang) clearTimeout(hang);
    hang = null;
    void errorLog.log('window', 'responsive again');
  });
  win.on('closed', () => {
    if (hang) clearTimeout(hang);
  });
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
