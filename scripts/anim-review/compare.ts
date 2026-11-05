// `npm run anim:compare -- --from <runId> --to <runId> [--only caseId,prefix] [--round NN]`
// BEFORE | AFTER | DIFF sheets between two runs, at the same named beats, plus per-case measure changes. Writes
// docs/animation-review/rounds/round-NN/compare/ (NN = the `to` run's round) and prints a summary. Both runs must be complete and have the same env.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decode, diff, encode } from './lib/png';
import { contactSheet, type Cell } from './lib/sheet';
import { ROOT } from './lib/stamp';

const arg = (n: string, d = '') => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? (process.argv[i + 1] ?? d) : d;
};
const CAPTURE = join(ROOT, 'docs/animation-review/capture');
const from = arg('from');
const to = arg('to');
const only = arg('only').split(',').filter(Boolean);
if (!from || !to) throw new Error('usage: anim:compare -- --from <runId> --to <runId>');

interface Row {
  caseId: string;
  status: string;
  frames?: string;
  cells?: { t: number; beat: string }[];
  metrics?: Record<string, unknown>;
}
interface M {
  runId: string;
  round: number;
  complete: boolean;
  env: Record<string, unknown>;
  cases: Row[];
}
const load = (id: string) => JSON.parse(readFileSync(join(CAPTURE, 'runs', id, 'manifest.json'), 'utf8')) as M;
const a = load(from);
const b = load(to);
if (!a.complete || !b.complete) throw new Error('both runs must be complete');
const sameEnv = JSON.stringify([a.env.viewport, a.env.seed, a.env.gpu]) === JSON.stringify([b.env.viewport, b.env.seed, b.env.gpu]);
if (!sameEnv) console.warn('WARNING: env differs (viewport/seed/gpu): the comparison is not valid, capture again');

const round = Number(arg('round', String(b.round)));
const outDir = join(ROOT, 'docs/animation-review/rounds', `round-${String(round).padStart(2, '0')}`, 'compare');
mkdirSync(outDir, { recursive: true });

/** The frame file of a named beat in a run's case folder. */
function frameOf(run: string, row: Row, beat: string): Buffer | null {
  const dir = join(CAPTURE, 'runs', run, 'frames', row.caseId);
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).find((n) => n.endsWith(`_${beat.replace(/[^a-z0-9+-]/gi, '_')}.png`));
  return f ? readFileSync(join(dir, f)) : null;
}

const BEATS = ['start', 'cast', 'release', 'impact-1f', 'impact', 'impact+80', 'impact+200', 'end'];
const summary: { caseId: string; changed: number; maxFraction: number; sheet: string | null }[] = [];
const afterById = new Map(b.cases.map((c) => [c.caseId, c]));
for (const before of a.cases) {
  if (only.length > 0 && !only.some((o) => before.caseId === o || before.caseId.startsWith(o))) continue;
  const after = afterById.get(before.caseId);
  if (!after || before.status !== 'ok' || after.status !== 'ok') continue;
  const cells: Cell[] = [];
  let changed = 0;
  let max = 0;
  for (const beat of BEATS) {
    const x = frameOf(from, before, beat);
    const y = frameOf(to, after, beat);
    if (!x || !y) continue;
    const ix = decode(x);
    const iy = decode(y);
    if (ix.width !== iy.width || ix.height !== iy.height) continue;
    const d = diff(ix, iy);
    max = Math.max(max, d.fraction);
    if (d.fraction > 0.005) changed += 1;
    const tag = `${beat} (${(d.fraction * 100).toFixed(1)}% differs)`;
    cells.push({ png: x, width: ix.width, height: ix.height, label: `BEFORE ${beat}` }, { png: y, width: iy.width, height: iy.height, label: `AFTER ${tag}` }, { png: encode(d.image), width: ix.width, height: ix.height, label: `DIFF ${beat}` });
  }
  let sheet: string | null = null;
  if (cells.length > 0) {
    const file = `${before.caseId}.compare.png`;
    writeFileSync(join(outDir, file), contactSheet(`${before.caseId} - ${from} -> ${to}`, cells, 3, 520));
    sheet = `docs/animation-review/rounds/round-${String(round).padStart(2, '0')}/compare/${file}`;
  }
  summary.push({ caseId: before.caseId, changed, maxFraction: Number(max.toFixed(4)), sheet });
}

const md = [`# Compare ${from} -> ${to}`, '', `env valid: ${sameEnv}`, '', '| case | beats that differ | max diff | sheet |', '|---|---|---|---|', ...summary.map((s) => `| \`${s.caseId}\` | ${s.changed} | ${(s.maxFraction * 100).toFixed(1)}% | ${s.sheet ? `\`${s.sheet}\`` : '-'} |`), ''].join('\n');
writeFileSync(join(outDir, 'COMPARE_SUMMARY.md'), md);
console.log(md);
