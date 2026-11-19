// Draw-call / triangle / FPS profile of the diorama on each review spot of a map (Admin "Diorama map"). Tooling only.
// Usage: npx tsx scripts/maps/dioramaProfile.ts --base http://localhost:5193 [--map map_forest_edge] [--quality full|light] [--stage <px wide, default 1600>] [--gpu]
import { openBrowser } from '../anim-review/lib/session';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1]! : fallback;
};
type Win = { diorama?: { ready: boolean; fps: number; mapId: string; stats: () => unknown } };
const { browser, gpu } = await openBrowser(process.argv.includes('--gpu'));
const page = await browser.newPage({
  viewport: { width: 1900, height: 1200 },
  deviceScaleFactor: 1,
});
await page.goto(`${arg('base', 'http://localhost:5175')}/admin.html#/diorama-lab`);
const sw = Number(arg('stage', '1600'));
await page.addStyleTag({
  content: `.dio__stage{width:${sw}px!important;height:${Math.round((sw * 9) / 16)}px!important;aspect-ratio:auto!important;flex:none}`,
});
await page.waitForSelector('[data-map]');
// The adapter the page really draws with (discrete, integrated or software).
const adapter = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  return gl && ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
});
console.log(`adapter: ${adapter}`);
const map = arg('map', 'map_forest_edge');
await page.selectOption('[data-map]', map);
const built = () => page.waitForFunction((m) => (window as unknown as Win).diorama?.ready === true && (window as unknown as Win).diorama?.mapId === m, map, { timeout: 120_000 });
await built();
if (arg('quality', 'full') === 'light') {
  await page.click('[data-quality="light"]');
  await built();
}
const n = await page.evaluate(() => document.querySelectorAll('[data-spot]').length);
console.log(`gpu: ${gpu}`);
for (let i = 0; i < n; i += 1) {
  await page.click(`[data-spot="${i}"]`);
  await page.waitForTimeout(500);
  await built();
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => ({
    fps: (window as unknown as Win).diorama!.fps,
    s: (window as unknown as Win).diorama!.stats(),
  }));
  console.log(`spot ${i + 1}: ${Math.round(r.fps)} fps ${JSON.stringify(r.s)}`);
}
await browser.close();
