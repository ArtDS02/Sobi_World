// Review shots of the diorama map prototype (Admin "Diorama map (G0)", tools/admin/diorama/): the stage at 1600 × 900 on each review
// spot, for each time of day, plus the frame rate after a few seconds on the spot. Tooling only (Playwright, the admin dev server).
// Usage: npx tsx scripts/maps/dioramaShots.ts --base http://localhost:5175 --out art_inbox/diorama_shots/g0 [--gpu] [--times day,night]
//        [--quality full|light] [--spots x,y;x,y…  (tiles; instead of the page's four review spots, e.g. from denseSpots.ts)]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openBrowser } from '../anim-review/lib/session';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1]! : fallback;
};
const base = arg('base', 'http://localhost:5175');
const out = arg('out', 'art_inbox/diorama_shots/g0');
const times = arg('times', 'day,golden,night').split(',');
const quality = arg('quality', 'full');
const custom = arg('spots', '')
  .split(';')
  .filter(Boolean)
  .map((p) => p.split(',').map(Number) as [number, number]);
mkdirSync(out, { recursive: true });

const { browser, gpu } = await openBrowser(process.argv.includes('--gpu'));
const page = await browser.newPage({ viewport: { width: 1900, height: 1200 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}/admin.html#/diorama-lab`);
await page.waitForFunction(() => (window as unknown as { diorama?: { ready: boolean } }).diorama?.ready === true, null, { timeout: 120_000 });
// A fixed 1600 × 900 stage, whatever the admin layout around it.
await page.addStyleTag({ content: '.dio__stage{width:1600px!important;height:900px!important;aspect-ratio:auto!important;flex:none}' });
if (quality === 'light') {
  await page.click('[data-quality="light"]');
  await page.waitForFunction(() => (window as unknown as { diorama?: { ready: boolean } }).diorama?.ready === true, null, { timeout: 120_000 });
}
await page.waitForTimeout(800);
const spots = custom.length ? custom.map(([x, y]) => `ô ${x},${y}`) : await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-spot]')].map((b) => b.textContent ?? ''));
const report: string[] = [`gpu: ${gpu}`, `quality: ${quality}`];
for (const time of times) {
  await page.click(`[data-time="${time}"]`);
  for (let i = 0; i < spots.length; i += 1) {
    if (custom.length) await page.evaluate(([x, y]) => (window as unknown as { diorama: { goto: (x: number, y: number) => void } }).diorama.goto(x, y), custom[i]!);
    else await page.click(`[data-spot="${i}"]`);
    await page.waitForTimeout(2500);
    const fps = await page.evaluate(() => (window as unknown as { diorama: { fps: number } }).diorama.fps);
    const png = await page.locator('[data-stage]').screenshot();
    const file = join(out, `${time}_${i + 1}.png`);
    writeFileSync(file, png);
    report.push(`${time} · ${spots[i]} · ${Math.round(fps)} fps · ${file}`);
  }
}
if (errors.length) report.push(`page errors: ${errors.join(' | ')}`);
writeFileSync(join(out, 'report.txt'), `${report.join('\n')}\n`);
console.log(report.join('\n'));
await browser.close();
