// `npm run anim:game [-- --only <text>]`: pictures of the REAL battle screen (targeting, turn indicator, HUD, status panel, cut-in) and of
// the walking map, which the Battle Lab does not have (it draws only the Phaser stage). It runs the existing tour
// `scripts/capture/adventureShots.ts` (Electron on a throw-away copy of a prepared save, never the player's own) against a PRIVATE dev server
// (own port and cache folder, forced optimisation: docs/animation-review/ANTI_CACHE.md A1/A2) and files the pictures under
// docs/animation-review/capture/game/<runId>/ with a manifest that carries the same stamp as a Lab run.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from './lib/server';
import { makeStamp, ROOT, sourceTable } from './lib/stamp';

/** Runs a child without blocking this process: the private dev server lives here and must keep answering while the child (Electron) loads from it. */
const run = (args: string[], timeoutMs: number) =>
  new Promise<number>((resolve) => {
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code ?? -1);
    });
  });
const PORT = Number(process.env.ANIM_GAME_PORT ?? 5196);
const rel = (p: string) => p.slice(ROOT.length + 1).split('\\').join('/');

const stamp = makeStamp();
const out = join(ROOT, 'docs/animation-review/capture/game', stamp.runId);
if (existsSync(out)) throw new Error(`game run ${stamp.runId} already exists (runs are immutable)`);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'INCOMPLETE'), 'run in progress\n');

// The Electron shell (main process) is the only thing loaded from a build; the screens come from the fresh dev server below.
execFileSync(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'vite.electron.config.ts', '--logLevel', 'warn'], { cwd: ROOT, stdio: 'inherit' });

// A save that is ready for a fight: the late-game bot save of `dev:rich-save`, with the three zones cleared so the Rift is open (the prepared
// fixture of the old tour has sick pigs and a locked Rift). Built fresh every run, in a throw-away folder.
const saveDir = mkdtempSync(join(tmpdir(), 'sobiworld-anim-review-'));
execFileSync(process.execPath, [join(ROOT, 'node_modules/tsx/dist/cli.mjs'), 'scripts/dev/richSave.ts', saveDir, '45', '7'], { cwd: ROOT, stdio: 'inherit' });
const saveFile = join(saveDir, 'saves', 'save.json');
const save = JSON.parse(readFileSync(saveFile, 'utf8')) as { areas: { sobi_adventure: { cleared: Record<string, number> } } };
save.areas.sobi_adventure.cleared = { zone_forest: 38, zone_mountain: 30, zone_ruins: 34 };
writeFileSync(saveFile, JSON.stringify(save));

// The dev server answers the game's own save calls from this folder (as `dev:sandbox` does), never from the dev farm in %APPDATA%.
process.env.UNIN_USER_DATA = saveDir;
const srv = await startServer(`game-${stamp.runId}`, PORT, 'vite.config.ts', true);
// Warm the server: the first request of a forced, cold dependency optimisation can take long, and the shell would wait for its window.
const warm = Date.now();
await fetch(srv.base + '/').then((r) => r.text()).catch(() => undefined);
await fetch(srv.base + '/src/main.ts').then((r) => r.text()).catch(() => undefined);
console.log(`server warm in ${Date.now() - warm} ms`);
const tsx = join(ROOT, 'node_modules/tsx/dist/cli.mjs');
let status: number;
try {
  status = await run([tsx, 'scripts/anim-review/battleUi.ts', '--url', srv.base, '--out', join(out, 'battle_ui'), '--save', saveFile], 10 * 60_000);
  if (process.argv.includes('--map')) {
    // The old tour, only for the walking map (its battle part is stale: see battleUi.ts).
    const tour = await run([tsx, 'scripts/capture/adventureShots.ts', '--url', srv.base, '--out', join(out, 'tour'), '--tag', 'review', '--save', saveFile], 20 * 60_000);
    if (tour !== 0) console.log('tour of the map did not finish cleanly (battle parts are expected to be blocked)');
  }
} finally {
  await srv.close();
  rmSync(saveDir, { recursive: true, force: true });
}

const pictures: { file: string; bytes: number }[] = [];
const walk = (dir: string) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.png$/i.test(e.name)) pictures.push({ file: rel(p), bytes: statSync(p).size });
  }
};
walk(out);
const csv = join(out, 'tour', '00_index', 'screenshot_manifest_review.csv');
const manifest = {
  schema: 1,
  kind: 'game',
  runId: stamp.runId,
  stamp: { head: stamp.head, dirty8: stamp.dirty8, branch: stamp.branch },
  complete: status === 0 && pictures.length > 0,
  exitCode: status,
  server: { base: srv.base, force: true },
  note: 'Real battle screen and map through the Electron tour; the clock of the animated shots is held by the tour itself (adventureShots.ts frozen()). The Electron main bundle is rebuilt first; the screens come from the private dev server.',
  index: existsSync(csv) ? rel(csv) : null,
  battleUi: existsSync(join(out, 'battle_ui', 'battle_ui.json')) ? rel(join(out, 'battle_ui', 'battle_ui.json')) : null,
  pictures,
  sources: sourceTable().filter((s) => s.file.startsWith('src/areas/adventure/ui') || s.file.startsWith('src/areas/adventure/scene')),
};
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
rmSync(join(out, 'INCOMPLETE'), { force: true });
if (manifest.complete) writeFileSync(join(ROOT, 'docs/animation-review/capture/GAME_LATEST.json'), JSON.stringify({ runId: stamp.runId, manifest: rel(join(out, 'manifest.json')) }, null, 2) + '\n');
console.log(`${manifest.complete ? 'COMPLETE' : 'INCOMPLETE'} game run ${stamp.runId}: ${pictures.length} pictures -> ${rel(out)}`);
process.exitCode = manifest.complete ? 0 : 1;
