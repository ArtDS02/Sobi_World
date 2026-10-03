// Desktop build status for the admin "🎮 Desktop Game" page (DECISIONS AM-1). Everything is read from
// the real project: package.json scripts + electron-builder config, the release/ folder, and the
// save folders of electron/dataDir.ts — so the guide never shows a made-up command or path.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { DATA_DIR_NAME } from '../../electron/dataDir';

type Result = { status: number; body: unknown };

interface Pkg {
  version: string;
  scripts: Record<string, string>;
  build: {
    productName: string;
    executableName: string;
    directories: { output: string };
    win: { target: string; icon: string };
    nsis: { artifactName: string; shortcutName: string; createDesktopShortcut: boolean; createStartMenuShortcut: boolean; deleteAppDataOnUninstall: boolean; perMachine: boolean };
  };
}

const pkg = () => JSON.parse(readFileSync('package.json', 'utf8')) as Pkg;
const appData = () => process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
const fileInfo = (path: string) => {
  if (!existsSync(path)) return { path: resolve(path), exists: false, bytes: 0, modifiedAt: null };
  const st = statSync(path);
  return { path: resolve(path), exists: true, bytes: st.size, modifiedAt: st.mtimeMs };
};

/** The scripts the guide shows, in order; only those package.json really has. */
const GUIDE_SCRIPTS = ['dev', 'dev:desktop', 'admin', 'build', 'dist:win', 'check', 'test:e2e'];

export function buildInfo(): Result {
  const p = pkg();
  const out = p.build.directories.output;
  const installer = p.build.nsis.artifactName.replace('${version}', p.version).replace('${ext}', 'exe');
  const saves = (name: string) => join(appData(), name, 'saves');
  return {
    status: 200,
    body: {
      version: p.version,
      productName: p.build.productName,
      platform: `Windows x64 · ${p.build.win.target.toUpperCase()}`,
      icon: p.build.win.icon,
      scripts: GUIDE_SCRIPTS.filter((s) => p.scripts[s]).map((s) => ({ name: s, command: `npm run ${s}`, runs: p.scripts[s] })),
      output: resolve(out),
      installer: fileInfo(join(out, installer)),
      unpacked: fileInfo(join(out, 'win-unpacked', `${p.build.executableName}.exe`)),
      lastBuild: fileInfo(join('dist-electron', 'main.cjs')),
      nsis: p.build.nsis,
      // Per-user NSIS default (verified by installing): %LOCALAPPDATA%/Programs/<executableName>.
      installDir: join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'Programs', p.build.executableName),
      data: {
        installed: { ...fileInfo(join(saves(DATA_DIR_NAME.installed), 'save.json')), dir: saves(DATA_DIR_NAME.installed) },
        dev: { ...fileInfo(join(saves(DATA_DIR_NAME.dev), 'save.json')), dir: saves(DATA_DIR_NAME.dev) },
      },
    },
  };
}

/** Opens a folder the page shows (release output or a save folder) in Explorer. */
export function openFolder(which: string): Result {
  const info = buildInfo().body as { output: string; data: Record<string, { dir: string }> };
  const dir = which === 'output' ? info.output : info.data[which]?.dir;
  if (!dir || !existsSync(dir)) return { status: 404, body: { error: `Chưa có thư mục ${dir ?? which}` } };
  spawn('explorer.exe', [dir], { detached: true, stdio: 'ignore' }).unref();
  return { status: 200, body: { ok: true, dir } };
}
