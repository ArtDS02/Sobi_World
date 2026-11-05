// `npm run anim:verify`: the harness's own gates, run before a capture (private server, canary, determinism), or the check of a
// finished manifest with `--manifest latest|<runId>` (what the Technical Director's entry gate reads).
// Exit code 1 when a gate fails.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canary, determinism } from './lib/gates';
import { startServer } from './lib/server';
import { openBrowser } from './lib/session';
import { makeStamp, ROOT, sourceTable } from './lib/stamp';

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? (process.argv[i + 1] ?? '') : undefined;
};
const CAPTURE = join(ROOT, 'docs/animation-review/capture');
interface Manifest {
  runId: string;
  complete?: boolean;
  flags?: string[];
  gates?: { determinism?: { result?: string }; canary?: { result?: string } };
  cases?: { status: string; sheet: string }[];
}

function checkManifest(which: string): number {
  const latest = which === 'latest' ? (JSON.parse(readFileSync(join(CAPTURE, 'LATEST.json'), 'utf8')) as { runId: string }).runId : which;
  const file = join(CAPTURE, 'runs', latest, 'manifest.json');
  if (!existsSync(file)) return fail(`no manifest for run ${latest}`);
  const m = JSON.parse(readFileSync(file, 'utf8')) as Manifest;
  const state = JSON.parse(readFileSync(join(ROOT, 'docs/animation-review/STATE.json'), 'utf8')) as { lastCapture?: { runId?: string | null } };
  const problems: string[] = [];
  if (m.complete !== true) problems.push('complete != true');
  if (m.gates?.determinism?.result !== 'pass') problems.push('determinism gate not passed');
  if (m.gates?.canary?.result !== 'pass') problems.push('canary gate not passed');
  if ((m.flags ?? []).length > 0) problems.push(`flags: ${(m.flags as string[]).join(', ')}`);
  if (state.lastCapture?.runId && state.lastCapture.runId !== m.runId) problems.push(`STATE.lastCapture.runId (${state.lastCapture.runId}) != manifest ${m.runId}`);
  for (const c of m.cases ?? []) if (c.status === 'ok' && !existsSync(join(ROOT, c.sheet))) problems.push(`missing sheet ${c.sheet}`);
  if (problems.length > 0) return fail(problems.join('; '));
  console.log(`manifest ${m.runId}: OK (${(m.cases ?? []).length} cases)`);
  return 0;
}
function fail(msg: string): number {
  console.error(`anim:verify FAILED: ${msg}`);
  return 1;
}

async function gates(): Promise<number> {
  const stamp = makeStamp();
  const srv = await startServer(`verify-${stamp.runId}`);
  const { browser, gpu } = await openBrowser();
  try {
    const sources = sourceTable();
    const c = await canary(browser, srv.base, stamp.runId, sources);
    console.log(`canary: ${c.result} (${c.checked.length} files, gpu ${gpu})`);
    for (const f of c.checked.filter((x) => x.disk !== x.served)) console.log(`  MISMATCH ${f.file}: disk ${f.disk.slice(0, 8)} served ${f.served.slice(0, 8)}`);
    const d = await determinism(browser, srv.base, stamp.runId);
    console.log(`determinism: ${d.result} (${d.case}, ${d.frames} frames, max differing pixels ${d.maxPixelDiff})`);
    return c.result === 'pass' && d.result === 'pass' ? 0 : fail('a gate failed');
  } finally {
    await browser.close();
    await srv.close();
  }
}

const which = arg('manifest');
process.exit(which !== undefined ? checkManifest(which || 'latest') : await gates());
