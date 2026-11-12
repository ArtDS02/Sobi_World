// Measures the frame rate of skills in the Battle Lab on the machine's own GPU, on the real clock (no fake time):
//   npx tsx scripts/animation/fps.ts <skillId[,skillId…]> [--mode off|light|full] [--port 5197] [--software]
// The stage is blown up to 1600 × 900 like the game's. For each skill it plays the step three times and counts animation frames
// while it plays; it prints the average rate, the slowest frame and the GPU the browser reports. A headless browser is capped by the
// display's refresh rate (60 here), so "60" means "at least 60". Needs Chrome or Edge (Playwright).
import { readFileSync } from 'node:fs';
import { startServer } from '../anim-review/lib/server';
import { evalIn, openBrowser } from '../anim-review/lib/session';

const arg = (n: string, d = ''): string => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? (process.argv[i + 1] ?? d) : d;
};
const ids = (process.argv[2] ?? '').split(',').filter(Boolean);
if (ids.length === 0 || ids[0]!.startsWith('--')) throw new Error('usage: tsx scripts/animation/fps.ts <skillId[,skillId…]> [--mode off|light|full]');
const mode = arg('mode');
const skills = new Map((JSON.parse(readFileSync('content/adventure/skills.json', 'utf8')) as { skills: { id: string; type: string }[] }).skills.map((s) => [s.id, s]));
const srv = await startServer('fps', Number(arg('port', '5197')));
const { browser } = await openBrowser(!process.argv.includes('--software'));
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(`${srv.base}/admin.html?run=fps${mode ? `&vfx3d=${mode}` : ''}#/battle-lab`, { waitUntil: 'load' });
  await page.waitForFunction('window.__animLab && window.__animLab.ready()', undefined, { timeout: 30_000 });
  await page.addStyleTag({ content: '[data-stage]{position:fixed!important;left:0!important;top:0!important;width:1600px!important;height:900px!important;max-width:none!important;max-height:none!important;z-index:99999!important;aspect-ratio:auto!important}' });
  const gpu = await evalIn<string>(page, `(() => { const g = document.createElement('canvas').getContext('webgl'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return g && e ? String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)) : 'unknown'; })()`);
  console.log(`GPU: ${gpu}${mode ? `  mode: ${mode}` : ''}`);
  for (const id of ids) {
    const sk = skills.get(id);
    if (!sk) throw new Error(`unknown skill ${id}`);
    const enemy = sk.type === 'enemy';
    const config = { skill: id, allies: 3, foes: enemy ? 2 : 3, crit: false, ko: false, fast: false, reduce: false, reaction: '', phase: false, win: false, corruption: 0, fromEnemy: enemy, ...(enemy ? { attacker: 'enemy_forest_wolf', target: 'pig_knight' } : { attacker: 'pig_knight', target: 'enemy_forest_wolf' }) };
    await evalIn(page, `window.__animLab.configure(${JSON.stringify(config)})`);
    await page.waitForFunction('window.__animLab.ready()', undefined, { timeout: 30_000 });
    const runs: { fps: number; worst: number }[] = [];
    for (let r = 0; r < 4; r++) {
      await evalIn(page, 'window.__animLab.play(false)');
      const total = await evalIn<number>(page, 'window.__animLab.info().total');
      const got = await evalIn<{ fps: number; worst: number }>(page, `new Promise((done) => { const t0 = performance.now(); let last = t0, n = 0, worst = 0; const tick = (t) => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < ${total}) requestAnimationFrame(tick); else done({ fps: (n * 1000) / (t - t0), worst }); }; requestAnimationFrame(tick); })`);
      await page.waitForTimeout(700);
      // The first run loads pictures and compiles shaders: it is a warm-up, not a measure.
      if (r > 0) runs.push(got);
    }
    const avg = runs.reduce((s, x) => s + x.fps, 0) / runs.length;
    console.log(`${id}: ${avg.toFixed(1)} fps average over ${runs.length} plays, slowest frame ${Math.max(...runs.map((x) => x.worst)).toFixed(1)} ms`);
  }
  await context.close();
} finally {
  await browser.close();
  await srv.close();
}
