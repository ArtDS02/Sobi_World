// `npm run anim:capture -- --suite pilot|skills|ultimates|statuses|reactions|variants|all [--only id,prefix] [--scope full|affected] [--grid ms]`
// Plays each case of the Battle Lab on a controlled clock, takes frames at the step's own beats plus an even grid, joins them into a
// contact sheet and writes docs/animation-review/capture/runs/<runId>/ with manifest.json + CAPTURE_MANIFEST.md (templates/MANIFEST_SPEC.md).
// Read-only: no content is saved, no save file is opened. Rules against stale evidence: docs/animation-review/ANTI_CACHE.md.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCases, SUITES, type Suite } from './lib/cases';
import { canary, determinism } from './lib/gates';
import { flagsOf, measure, type CaseMetrics } from './lib/metrics';
import { decode, diff } from './lib/png';
import { startServer } from './lib/server';
import { frameAt, openBrowser, openLab, prepare, type LabCase, type LabInfo } from './lib/session';
import { contactSheet, type Cell } from './lib/sheet';
import { makeStamp, ROOT, sourceTable, type SourceRow } from './lib/stamp';

const arg = (n: string, d = '') => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? (process.argv[i + 1] ?? d) : d;
};
const suite = arg('suite', 'pilot') as Suite;
if (!SUITES.includes(suite)) throw new Error(`--suite must be one of ${SUITES.join(', ')}`);
const only = arg('only').split(',').filter(Boolean);
const scope = arg('scope', 'full');
const grid = Number(arg('grid', suite === 'ultimates' ? '100' : '150'));
const CAPTURE = join(ROOT, 'docs/animation-review/capture');
const rel = (p: string) => p.slice(ROOT.length + 1).split('\\').join('/');

interface Manifest {
  schema: 1;
  runId: string;
  repoRoot: string;
  round: number;
  stamp: { head: string; dirty8: string; branch: string };
  complete: boolean;
  scope: string;
  suite: string;
  flags: string[];
  gates: { determinism: unknown; canary: unknown; distNewerThanSources: null };
  env: Record<string, unknown>;
  sources: SourceRow[];
  cases: Record<string, unknown>[];
  absent: { caseId: string; group: string; reason: string }[];
  suitesNotBuilt: string[];
  notes: string[];
  overview: Record<string, string>;
  command: string;
}

const readJson = <T>(p: string): T | null => (existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : null);

/** Times to photograph: the step's beats (named) plus an even grid, sorted, with near-duplicates merged. */
function plan(info: LabInfo): { t: number; label: string }[] {
  const named: { t: number; label: string }[] = [];
  info.beats.forEach((b, i) => {
    const p = i === 0 ? '' : `b${i + 1} `;
    const add = (t: number, label: string) => named.push({ t: Math.max(0, Math.round(t)), label: p + label });
    add(b.start, 'start');
    if (b.cast > b.start) add(b.cast, 'cast');
    add(b.release - 50, 'release-50');
    add(b.release, 'release');
    add(b.impact - 16, 'impact-1f');
    add(b.impact, 'impact');
    add(b.impact + 80, 'impact+80');
    add(b.impact + 200, 'impact+200');
    add(b.end, 'end');
  });
  const out: { t: number; label: string }[] = [];
  for (const n of named.sort((a, b) => a.t - b.t)) if (!out.some((o) => Math.abs(o.t - n.t) < 8 && o.label.split(' ').pop() === n.label.split(' ').pop())) out.push(n);
  for (let t = 0; t <= info.total + 200; t += grid) if (!out.some((o) => Math.abs(o.t - t) < grid / 3)) out.push({ t, label: 'grid' });
  return out.sort((a, b) => a.t - b.t);
}

/** Up to 12 sheet cells: every named beat of the first turn first, then the rest by even spread. */
function pick(frames: { t: number; label: string; png: Buffer }[], max = 12) {
  const named = frames.filter((f) => f.label !== 'grid');
  const first = named.slice(0, max);
  const rest = frames.filter((f) => f.label === 'grid');
  const room = max - first.length;
  const extra = room > 0 ? rest.filter((_, i) => i % Math.max(1, Math.ceil(rest.length / room)) === 0).slice(0, room) : [];
  return [...first, ...extra].sort((a, b) => a.t - b.t);
}

async function main() {
  const stamp = makeStamp();
  const state = readJson<{ round: number; fix?: { changedFiles?: string[] } }>(join(ROOT, 'docs/animation-review/STATE.json'));
  const prevRun = readJson<{ runId: string }>(join(CAPTURE, 'LATEST.json'));
  const prev = prevRun ? readJson<Manifest>(join(CAPTURE, 'runs', prevRun.runId, 'manifest.json')) : null;
  const sources = sourceTable(prev?.sources);
  const runDir = join(CAPTURE, 'runs', stamp.runId);
  const finalDir = runDir;
  if (existsSync(finalDir)) throw new Error(`run ${stamp.runId} already exists (runs are immutable)`);
  mkdirSync(join(runDir, 'sheets'), { recursive: true });
  // Written last-removed: a folder that still holds INCOMPLETE is an unfinished run and never becomes LATEST.
  writeFileSync(join(runDir, 'INCOMPLETE'), 'run in progress\n');
  mkdirSync(join(runDir, 'frames'), { recursive: true });

  const manifest: Manifest = {
    schema: 1,
    runId: stamp.runId,
    repoRoot: ROOT.split('\\').join('/'),
    round: (state?.round ?? 0) + 1,
    stamp: { head: stamp.head, dirty8: stamp.dirty8, branch: stamp.branch },
    complete: false,
    scope,
    suite,
    flags: [],
    gates: { determinism: null, canary: null, distNewerThanSources: null },
    env: {},
    sources,
    cases: [],
    absent: [],
    suitesNotBuilt: ['map-walk (Electron, phase 2)', 'targeting / turn indicator / HUD (DOM overlay is not part of the lab stage)', 'video (--video not implemented; frames and sheets are the evidence)'],
    overview: {},
    notes: ['ULT_SKIPPABLE: the lab has no skip control, so whether an Ultimate can be skipped is not measured (check in the game)', 'status cases: the status is put on by the plain attack alone; `loop` shows it lasting, `expire` plays its end (an empty step after it)', 'overview sheets show the frame that differs most from the first, not the impact frame'],
    command: `npm run anim:capture -- ${process.argv.slice(2).join(' ')}`,
  };
  const wanted = (state?.fix?.changedFiles ?? []).length > 0;
  if (prev && wanted && !sources.some((s) => s.changedSincePrevRun)) manifest.flags.push('NO_CHANGE_DETECTED');
  if (prev && prev.stamp.head === stamp.head && prev.stamp.dirty8 === stamp.dirty8 && wanted) manifest.flags.push('NO_CHANGE_DETECTED');

  let outcome = false;
  const srv = await startServer(stamp.runId);
  const { browser, gpu } = await openBrowser();
  manifest.env = { viewport: [1600, 900], clock: 'page.clock (paused at 600000 ms for the measured play)', seed: 1234, gpu, server: { base: srv.base, force: true, cacheDir: srv.cacheDir }, grid };
  try {
    manifest.gates.canary = await canary(browser, srv.base, stamp.runId, sources);
    console.log(`canary: ${(manifest.gates.canary as { result: string }).result}`);
    manifest.gates.determinism = await determinism(browser, srv.base, stamp.runId);
    console.log(`determinism: ${(manifest.gates.determinism as { result: string }).result}`);
    const gatesOk = (manifest.gates.canary as { result: string }).result === 'pass' && (manifest.gates.determinism as { result: string }).result === 'pass';
    if (!gatesOk) {
      manifest.flags.push('CACHE_SUSPECT');
      outcome = false;
      return;
    }

    const lister = await openLab(browser, srv.base, stamp.runId);
    const set = await buildCases(lister.page, suite, only);
    await lister.context.close();
    manifest.absent = set.absent;
    console.log(`${set.cases.length} cases (${set.absent.length} absent)`);

    const impactCells: Record<string, Cell[]> = {};
    for (const c of set.cases) {
      const t0 = Date.now();
      try {
        manifest.cases.push(await runCase(browser, srv.base, stamp.runId, c, runDir));
        const row = manifest.cases[manifest.cases.length - 1] as { sheet: string; impactCell?: Cell };
        if (row.impactCell) (impactCells[c.group] ??= []).push(row.impactCell);
        delete row.impactCell;
        console.log(`  ok ${c.caseId} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      } catch (e) {
        manifest.cases.push({ caseId: c.caseId, group: c.group, status: 'error', error: (e as Error).stack ?? String(e), flags: ['CASE_ERROR'] });
        console.log(`  ERROR ${c.caseId}: ${(e as Error).message}`);
      }
    }
    // Overview sheets: one frame at impact per case of a group, for judging consistency across the group.
    for (const [group, cells] of Object.entries(impactCells)) {
      for (let i = 0; i < cells.length; i += 24) {
        const part = cells.slice(i, i + 24);
        const name = `_overview.${group}${cells.length > 24 ? `.${i / 24 + 1}` : ''}.png`;
        writeFileSync(join(runDir, 'sheets', name), contactSheet(`${group} overview - impact frame - ${stamp.runId}`, part, 6, 400));
        manifest.overview[`${group}${cells.length > 24 ? `.${i / 24 + 1}` : ''}`] = rel(join(finalDir, 'sheets', name));
      }
    }
    // DUPLICATE_SCRIPT: same cue structure under different ids inside one group of ultimates / statuses.
    const bySig = new Map<string, string[]>();
    for (const c of manifest.cases as { caseId: string; group: string; metrics?: CaseMetrics }[]) {
      if (!c.metrics || c.group !== 'ultimate') continue;
      const k = `${c.group}:${c.metrics.scriptSig}`;
      bySig.set(k, [...(bySig.get(k) ?? []), c.caseId]);
    }
    for (const c of manifest.cases as { caseId: string; group: string; metrics?: CaseMetrics; flags?: string[]; duplicates?: string[] }[]) {
      const same = c.metrics ? (bySig.get(`${c.group}:${c.metrics.scriptSig}`) ?? []).filter((x) => x !== c.caseId) : [];
      if (same.length > 0 && c.flags) {
        c.flags.push('DUPLICATE_SCRIPT');
        c.duplicates = same;
      }
    }
    // A status is a twin of another when their apply scripts use the same acts and pictures (a colour change is not a new look): content-based,
    // never from the played cues (the cues of a loop or expire case are empty).
    for (const c of manifest.cases as { caseId: string; flags?: string[]; duplicates?: string[] }[]) {
      const twins = set.statusTwins[c.caseId] ?? [];
      if (twins.length > 0 && c.flags) {
        c.flags.push('DUPLICATE_SCRIPT');
        c.duplicates = twins;
      }
    }
    const errors = (manifest.cases as { status: string }[]).filter((c) => c.status === 'error').length;
    outcome = errors < manifest.cases.length || manifest.cases.length === 0;
  } finally {
    await browser.close();
    await srv.close();
    // After the server is down: its file watcher must not hold the run folder (Windows refuses the rename otherwise).
    finish(manifest, runDir, finalDir, outcome);
  }
}

async function runCase(browser: Awaited<ReturnType<typeof openBrowser>>['browser'], base: string, runId: string, c: LabCase, runDir: string) {
  const lab = await openLab(browser, base, runId);
  try {
    const info = await prepare(lab, c);
    const times = plan(info);
    const cur = { t: 0 };
    const frames: { t: number; label: string; png: Buffer }[] = [];
    for (const p of times) frames.push({ ...p, png: await frameAt(lab, info, p.t, cur) });
    const dir = join(runDir, 'frames', c.caseId);
    mkdirSync(dir, { recursive: true });
    frames.forEach((f, i) => writeFileSync(join(dir, `f${String(i).padStart(3, '0')}_${f.t}ms_${f.label.replace(/[^a-z0-9+-]/gi, '_')}.png`), f.png));
    // Pixel measures: how much each frame differs from the one before, and the largest difference from the first frame.
    const first = decode(frames[0]!.png);
    let changedFrames = 0;
    let maxChange = 0;
    let maxAt = 0;
    let prevImg = first;
    const afterRelease = info.beats[0]?.release ?? 0;
    for (const f of frames.slice(1)) {
      const img = decode(f.png);
      const step = diff(prevImg, img);
      if (f.t >= afterRelease && step.fraction > 0.002) changedFrames += 1;
      const fromFirst = diff(first, img).fraction;
      if (fromFirst > maxChange) {
        maxChange = fromFirst;
        maxAt = frames.indexOf(f);
      }
      prevImg = img;
    }
    const metrics = measure(info, c.group, { changedFrames, frameCount: frames.length, maxChangeVsStart: Number(maxChange.toFixed(4)) }, lab.errors.filter((e) => !/status of 404/.test(e) || lab.missing.length > 0), lab.missing);
    const picked = pick(frames);
    const dims = decode(picked[0]!.png);
    const cells: Cell[] = picked.map((f) => ({ png: f.png, width: dims.width, height: dims.height, label: `t=${f.t} ms - ${f.label}` }));
    const sheetFile = join(runDir, 'sheets', `${c.caseId}.png`);
    writeFileSync(sheetFile, contactSheet(`${c.caseId} - ${runId}`, cells, 4, 600));
    // The overview shows the frame that differs most from the first one (the `impact` frame is often a hit stop or still empty).
    const impact = frames[maxAt] ?? frames[Math.floor(frames.length / 2)]!;
    const finalDir = runDir;
    return {
      caseId: c.caseId,
      group: c.group,
      status: 'ok',
      config: c.config,
      sheet: rel(join(finalDir, 'sheets', `${c.caseId}.png`)),
      frames: rel(join(finalDir, 'frames', c.caseId)) + '/',
      cells: picked.map((f) => ({ t: f.t, beat: f.label })),
      metrics,
      flags: flagsOf(metrics, c.group, []),
      impactCell: { png: impact.png, width: dims.width, height: dims.height, label: `${c.caseId.replace(/^battle\./, '')} @${impact.t}` },
    };
  } finally {
    await lab.context.close();
  }
}

function finish(m: Manifest, runDir: string, finalDir: string, ok: boolean): void {
  m.complete = ok && m.flags.every((f) => f !== 'CACHE_SUSPECT');
  writeFileSync(join(runDir, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
  writeFileSync(join(runDir, 'CAPTURE_MANIFEST.md'), manifestMd(m));
  rmSync(join(finalDir, 'INCOMPLETE'), { force: true });
  if (m.complete) {
    writeFileSync(join(CAPTURE, 'LATEST.json'), JSON.stringify({ runId: m.runId, manifest: rel(join(finalDir, 'manifest.json')) }, null, 2) + '\n');
    copyFileSync(join(finalDir, 'CAPTURE_MANIFEST.md'), join(CAPTURE, 'CAPTURE_MANIFEST.md'));
  }
  console.log(`${m.complete ? 'COMPLETE' : 'INCOMPLETE'} run ${m.runId} -> ${rel(finalDir)}`);
  process.exitCode = m.complete ? 0 : 1;
}

function manifestMd(m: Manifest): string {
  const g = m.gates as { determinism: { result: string; case: string; maxPixelDiff: number; frames: number } | null; canary: { result: string; checked: { file: string; disk: string; served: string }[] } | null };
  const cases = m.cases as { caseId: string; group: string; status: string; sheet?: string; flags?: string[]; duplicates?: string[]; metrics?: CaseMetrics; error?: string }[];
  const changed = m.sources.filter((s) => s.changedSincePrevRun);
  const L: string[] = [];
  L.push(`# CAPTURE MANIFEST`, '');
  L.push(`- runId: \`${m.runId}\``, `- stamp: head \`${m.stamp.head}\` · dirty8 \`${m.stamp.dirty8}\` · branch \`${m.stamp.branch}\``, `- round (review sắp tới): ${m.round}`, `- complete: **${m.complete}**`, `- suite: ${m.suite} · scope: ${m.scope}`, `- flags: ${m.flags.length > 0 ? m.flags.join(', ') : '(none)'}`, `- repoRoot: \`${m.repoRoot}\``, `- lệnh: \`${m.command}\``, '');
  L.push(`## Cổng`, '', '| cổng | kết quả | bằng chứng |', '|---|---|---|');
  L.push(`| determinism | ${g.determinism?.result ?? 'n/a'} | case \`${g.determinism?.case}\`, ${g.determinism?.frames} khung, lệch tối đa ${g.determinism?.maxPixelDiff} px |`);
  L.push(`| canary (phục vụ == đĩa) | ${g.canary?.result ?? 'n/a'} | ${g.canary?.checked.length ?? 0} file, lệch ${g.canary?.checked.filter((c) => c.disk !== c.served).length ?? 0} |`, '');
  L.push(`## Thay đổi nguồn so với run trước`, '', changed.length > 0 ? changed.map((s) => `- \`${s.file}\``).join('\n') : '(không có / chưa có run trước)', '');
  const bad = cases.filter((c) => c.status !== 'ok' || (c.flags?.length ?? 0) > 0);
  L.push(`## Case có cờ (${bad.length}/${cases.length})`, '', '| case | cờ [Auto] | ghi chú |', '|---|---|---|');
  for (const c of bad) L.push(`| \`${c.caseId}\` | ${(c.flags ?? []).join(', ')} | ${c.status === 'error' ? 'ERROR' : c.duplicates ? `trùng cấu trúc với ${c.duplicates.join(', ')}` : ''} |`);
  L.push('', `## Mọi case`, '', '| case | status | sheet | thời lượng | hit-stop | lấy đà | lớp VFX | khung đổi |', '|---|---|---|---|---|---|---|---|');
  for (const c of cases) {
    const x = c.metrics;
    L.push(`| \`${c.caseId}\` | ${c.status} | ${c.sheet ? `\`${c.sheet}\`` : '-'} | ${x?.durationMs ?? '-'} | ${x?.hitStopMs ?? '-'} | ${x?.anticipationMs ?? '-'} | ${x?.layerClasses.length ?? '-'} | ${x ? `${x.changedFrames}/${x.frameCount}` : '-'} |`);
  }
  L.push('', `## Không chụp được (absent)`, '', m.absent.length > 0 ? m.absent.map((a) => `- \`${a.caseId}\`: ${a.reason}`).join('\n') : '(không)', '');
  L.push(`## Sheet tổng`, '', Object.keys(m.overview).length > 0 ? Object.entries(m.overview).map(([k, v]) => `- ${k}: \`${v}\``).join('\n') : '(không)', '');
  L.push(`## Ghi chú phương pháp`, '', m.notes.map((n) => `- ${n}`).join('\n'), '');
  L.push(`## Chưa có trong harness`, '', m.suitesNotBuilt.map((s) => `- ${s}`).join('\n'), '');
  return L.join('\n');
}

await main();
