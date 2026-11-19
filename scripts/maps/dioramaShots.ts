// Review shots of the diorama map (Admin "Diorama map", tools/admin/diorama/): the stage at 1600 × 900 on each review point of a map's
// contract, for each time of day, plus the frame rate after a few seconds on the spot. Tooling only (Playwright, the admin dev server).
// Usage: npx tsx scripts/maps/dioramaShots.ts --base http://localhost:5175 --out art_inbox/diorama_shots/g0 [--gpu] [--times day,night]
//        [--map <mapId>|all  (default map_forest_edge; `all` writes to <out>/<mapId>/)] [--quality full|light]
//        [--spots x,y;x,y…  (tiles; instead of the map's review points, e.g. from denseSpots.ts; one map only)]
//        [--lit  (element devices lit: a water wheel turns)]
//        [--gates closed|open  (default closed: exits with a lock and gates shut, as in a fresh save)]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTRACT_IDS } from '../../src/areas/adventure/scene/diorama/contracts';
import { openBrowser } from '../anim-review/lib/session';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1]! : fallback;
};
const base = arg('base', 'http://localhost:5175');
const out = arg('out', 'art_inbox/diorama_shots/g0');
const times = arg('times', 'day,golden,night').split(',');
const quality = arg('quality', 'full');
const which = arg('map', 'map_forest_edge');
const gates = arg('gates', 'closed');
const lit = process.argv.includes('--lit');
const maps = which === 'all' ? CONTRACT_IDS : [which];
const custom = arg('spots', '')
  .split(';')
  .filter(Boolean)
  .map((p) => p.split(',').map(Number) as [number, number]);

type Win = { diorama?: { ready: boolean; fps: number; mapId: string; goto: (x: number, y: number) => void } };
const { browser, gpu } = await openBrowser(process.argv.includes('--gpu'));
const page = await browser.newPage({ viewport: { width: 1900, height: 1200 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}/admin.html#/diorama-lab`);
const built = (id: string) => page.waitForFunction((m) => (window as unknown as Win).diorama?.ready === true && (window as unknown as Win).diorama?.mapId === m, id, { timeout: 120_000 });
// A fixed 1600 × 900 stage, whatever the admin layout around it.
await page.addStyleTag({ content: '.dio__stage{width:1600px!important;height:900px!important;aspect-ratio:auto!important;flex:none}' });
await page.waitForSelector('[data-map]');
const report: string[] = [`gpu: ${gpu}`, `quality: ${quality}`, `gates: ${gates}`];
for (const mapId of maps) {
  const dir = maps.length > 1 ? join(out, mapId) : out;
  mkdirSync(dir, { recursive: true });
  await page.selectOption('[data-map]', mapId);
  await built(mapId);
  // The lab keeps its switch across maps: set it to what was asked.
  const shut = await page.evaluate(() => document.querySelector('[data-gates]')?.classList.contains('is-on') !== true);
  if (shut !== (gates === 'closed')) {
    await page.click('[data-gates]');
    await built(mapId);
  }
  if ((await page.evaluate(() => document.querySelector('[data-lit]')?.classList.contains('is-on') === true)) !== lit) {
    await page.click('[data-lit]');
    await built(mapId);
  }
  if (quality === 'light') {
    await page.click('[data-quality="light"]');
    await built(mapId);
  }
  await page.waitForTimeout(800);
  const spots = custom.length && maps.length === 1 ? custom.map(([x, y]) => `ô ${x},${y}`) : await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-spot]')].map((b) => b.textContent ?? ''));
  report.push(`map: ${mapId}`);
  for (const time of times) {
    await page.click(`[data-time="${time}"]`);
    for (let i = 0; i < spots.length; i += 1) {
      if (custom.length && maps.length === 1) await page.evaluate(([x, y]) => (window as unknown as Win).diorama!.goto(x!, y!), custom[i]!);
      else await page.click(`[data-spot="${i}"]`);
      await page.waitForTimeout(2500);
      const fps = await page.evaluate(() => (window as unknown as Win).diorama!.fps);
      const png = await page.locator('[data-stage]').screenshot();
      const file = join(dir, `${time}_${i + 1}.png`);
      writeFileSync(file, png);
      report.push(`${time} · ${spots[i]} · ${Math.round(fps)} fps · ${file}`);
    }
  }
  if (maps.length > 1) writeFileSync(join(dir, 'report.txt'), `${report.join('\n')}\n`);
}
if (errors.length) report.push(`page errors: ${errors.join(' | ')}`);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'report.txt'), `${report.join('\n')}\n`);
console.log(report.join('\n'));
await browser.close();
