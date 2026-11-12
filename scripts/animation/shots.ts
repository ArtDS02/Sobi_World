// Photographs skills in the Battle Lab on a frozen clock and writes the frames plus a contact sheet (the evidence for a VFX review).
//   npx tsx scripts/animation/shots.ts <skillId[,skillId…]> [--out dir] [--at -500,-250,0,150,400,900] [--cols 6] [--port 5196]
// `--at` are ms **relative to the skill's impact** (default below), so a frame is always about the same moment of the blow whatever the
// skill's windup; pass `--abs 900,1300,…` for absolute step times instead. The side is read from the skill (type `enemy` is cast by an enemy).
// Needs Chrome or Edge (Playwright), like `npm run anim:capture`; it starts its own Vite server and never touches a running one.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { contactSheet, type Cell } from '../anim-review/lib/sheet';
import { startServer } from '../anim-review/lib/server';
import { frameAt, openBrowser, openLab, prepare } from '../anim-review/lib/session';

const arg = (n: string, d = ''): string => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? (process.argv[i + 1] ?? d) : d;
};
const ids = (process.argv[2] ?? '').split(',').filter(Boolean);
if (ids.length === 0 || ids[0]!.startsWith('--')) throw new Error('usage: tsx scripts/animation/shots.ts <skillId[,skillId…]> [--out dir] [--at ms,ms] [--abs ms,ms] [--cols 6]');
const out = arg('out', 'art_inbox/vfx3d_shots');
const rel = arg('at', '-500,-250,-100,0,150,400,900,1400').split(',').map(Number);
const abs = arg('abs');
const cols = Number(arg('cols', '4'));
const skills = new Map((JSON.parse(readFileSync('content/adventure/skills.json', 'utf8')) as { skills: { id: string; type: string; target: string }[] }).skills.map((s) => [s.id, s]));

mkdirSync(out, { recursive: true });
const srv = await startServer('shots', Number(arg('port', '5196')));
const { browser } = await openBrowser();
try {
  for (const id of ids) {
    const sk = skills.get(id);
    if (!sk) throw new Error(`unknown skill ${id}`);
    const enemy = sk.type === 'enemy';
    // Same shape as scripts/anim-review/lib/cases.ts: enough units on each side for single, row and ally targets.
    const config = {
      skill: id, allies: 3, foes: enemy ? 2 : 3, crit: false, ko: false, fast: false, reduce: false, reaction: '', phase: false, win: false, corruption: 0, fromEnemy: enemy,
      ...(enemy ? { attacker: 'enemy_forest_wolf', target: 'pig_knight' } : { attacker: 'pig_knight', target: 'enemy_forest_wolf' }),
    };
    const lab = await openLab(browser, srv.base, `shots-${id}`);
    try {
      const info = await prepare(lab, { caseId: id, group: 'skill', config } as never);
      const b = info.beats[0]!;
      const times = (abs ? abs.split(',').map(Number) : rel.map((r) => b.impact + r)).map((t) => Math.max(0, Math.round(t))).sort((x, y) => x - y);
      const cur = { t: 0 };
      const cells: Cell[] = [];
      for (const t of times) {
        const png = await frameAt(lab, info, t, cur);
        writeFileSync(join(out, `${id}_${String(t).padStart(5, '0')}.png`), png);
        cells.push({ png, width: 1600 / 2, height: 900 / 2, label: `${t} ms (${t - b.impact >= 0 ? '+' : ''}${t - b.impact} from impact)` });
      }
      const sheet = contactSheet(`${id}  impact=${b.impact} end=${b.end}`, cells, cols, 560);
      writeFileSync(join(out, `${id}_sheet.png`), sheet);
      console.log(`${id}: ${times.length} frames -> ${join(out, `${id}_sheet.png`)}${lab.errors.length ? `  console errors: ${lab.errors.slice(0, 3).join(' | ')}` : ''}`);
    } finally {
      await lab.context.close();
    }
  }
} finally {
  await browser.close();
  await srv.close();
}
