// npm run verify:installer — checks the packed app in release/win-unpacked (what the installer
// installs): (1) app.asar holds only the player build, no Admin; (2) the exe starts, opens the
// game window, writes its save under the user data folder and makes no network request.
// The run uses a throw-away app-data folder (SOBIWORLD_APPDATA), so the real %APPDATA%\SobiWorld is never touched.
import { _electron as electron } from '@playwright/test';
import { listPackage, extractFile } from '@electron/asar';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPackage, isTextPath } from './build/checks';

const UNPACKED = 'release/win-unpacked';
const exe = join(UNPACKED, 'SobiWorld.exe');
const asar = join(UNPACKED, 'resources', 'app.asar');
if (!existsSync(exe) || !existsSync(asar)) {
  console.error('verify:installer — release/win-unpacked is missing; run `npm run dist:win` first');
  process.exit(1);
}

const fail = (lines: string[]): never => {
  for (const l of lines) console.error(`  ${l}`);
  console.error('\nverify:installer failed');
  process.exit(1);
};

// 1. What is inside app.asar.
// listPackage returns OS-style paths ("\dist\index.html" on Windows); extractFile wants them without the root.
const norm = (p: string) => p.replaceAll('\\', '/').replace(/^\//, '');
const files = listPackage(asar, { isPack: false })
  .filter((p) => /\.[A-Za-z0-9]+$/.test(p))
  .map((p) => ({
    path: norm(p),
    text: isTextPath(p) ? extractFile(asar, p.replace(/^[\\/]/, '')).toString('utf8') : null,
  }));
const packageProblems = checkPackage(files);
if (packageProblems.length > 0) fail(packageProblems);
console.log(`app.asar OK — ${files.length} files, no Admin, no dev tooling, no external URL`);

// 2. Run it with a clean APPDATA.
const appData = mkdtempSync(join(tmpdir(), 'sobiworld-installer-'));
const network: string[] = [];
try {
  const env = { ...process.env, SOBIWORLD_APPDATA: appData } as Record<string, string>;
  delete env.UNIN_DEV_URL;
  delete env.UNIN_USER_DATA;
  const app = await electron.launch({ executablePath: exe, env });
  app.context().on('request', (r) => {
    if (/^(https?|wss?):/.test(r.url())) network.push(r.url());
  });
  const page = await app.firstWindow();
  const title = await page.title();
  await page.waitForSelector('.plazabar, .topbar__nav', { timeout: 30_000 });
  // The game saves on its own after a moment; closing the window flushes it as well.
  await app.close();

  const saveFile = join(appData, 'SobiWorld', 'saves', 'save.json');
  const problems: string[] = [];
  if (title !== 'Sobi World') problems.push(`window title is "${title}", expected "Sobi World"`);
  if (!existsSync(saveFile)) problems.push(`no save written to ${saveFile}`);
  else if (JSON.parse(readFileSync(saveFile, 'utf8')) === null) problems.push('save.json is empty');
  if (network.length > 0) problems.push(`network requests: ${network.join(', ')}`);
  if (problems.length > 0) fail(problems);
  console.log(`exe OK — window "${title}", save at %APPDATA%\\SobiWorld\\saves\\save.json, no network request`);
} finally {
  rmSync(appData, { recursive: true, force: true });
}
