// A walking video of the diorama map (Admin "Diorama map"): the stage full frame at 1600 × 900, the party walking a fixed route with the
// keys by day, then the light turning to evening and night. Tooling only: frames are grabbed while it walks (`<out>/walk/NNNN.jpg`,
// about 10 a second; no video encoder needed) and stitched afterwards (e.g. an animated WebP with Pillow). The day part ends with the
// party standing still for a few seconds (the frames printed as "still frames"), to see the wind and the water move frame to frame.
// Usage: npx tsx scripts/maps/dioramaWalk.ts --base http://localhost:5175 --out art_inbox/diorama_shots/g0 [--gpu] [--from x,y]
//        [--map <mapId>|all  (default map_forest_edge: the fixed route from its spawn; any other map starts on its second review
//        point and wanders; `all` writes to <out>/<mapId>/walk)]
//        (--from: start on that tile and wander around it in the woods instead of the fixed route)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTRACT_IDS, reviewSpots } from '../../src/areas/adventure/scene/diorama/contracts';
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { openBrowser } from '../anim-review/lib/session';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1]! : fallback;
};
const base = arg('base', 'http://localhost:5175');
const out = arg('out', 'art_inbox/diorama_shots/g0');
const from = arg('from', '');
const which = arg('map', 'map_forest_edge');
const maps = which === 'all' ? CONTRACT_IDS : [which];

type Win = {
  diorama?: { ready: boolean; mapId: string; setOpts: (o: object) => void; goto: (x: number, y: number) => void };
};
const { browser } = await openBrowser(process.argv.includes('--gpu'));
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.goto(`${base}/admin.html#/diorama-lab`);
await page.waitForSelector('[data-map]');
await page.addStyleTag({
  content:
    '.dio__stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;aspect-ratio:auto!important;z-index:99999;border-radius:0!important}',
});
const hold = async (key: string, ms: number) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
};
const set = (time: string) =>
  page.evaluate(
    (t) => (window as unknown as Win).diorama!.setOpts({ time: t, quality: 'full', wind: true }),
    time,
  );

for (const mapId of maps) {
  const dir = join(maps.length > 1 ? join(out, mapId) : out, 'walk');
  mkdirSync(dir, { recursive: true });
  // The select sits under the full-screen stage: change it from the page itself.
  await page.evaluate((id) => {
    const el = document.querySelector<HTMLSelectElement>('[data-map]')!;
    el.value = id;
    el.dispatchEvent(new Event('change'));
  }, mapId);
  await page.waitForFunction(
    (m) => (window as unknown as Win).diorama?.ready === true && (window as unknown as Win).diorama?.mapId === m,
    mapId,
    { timeout: 120_000 },
  );
  await set('day');
  await page.waitForTimeout(1200);
  let grabbing = true;
  let n = 0;
  const grabber = (async () => {
    while (grabbing) {
      const jpg = await page.screenshot({ type: 'jpeg', quality: 82 });
      writeFileSync(join(dir, `${String(n).padStart(4, '0')}.jpg`), jpg);
      n += 1;
      await page.waitForTimeout(60);
    }
  })();
  const start = from
    ? (from.split(',').map(Number) as [number, number])
    : mapId === 'map_forest_edge'
      ? null
      : (() => {
          const s = reviewSpots(MAPS[mapId]!)[1];
          return s ? ([s.x, s.y] as [number, number]) : null;
        })();
  if (start) {
    await page.evaluate(([tx, ty]) => (window as unknown as Win).diorama!.goto(tx!, ty!), start);
    await page.waitForTimeout(800);
    for (const [k, ms] of [
      ['d', 1400],
      ['w', 900],
      ['a', 1600],
      ['s', 1200],
      ['d', 900],
      ['s', 900],
      ['a', 1300],
    ] as const)
      await hold(k, ms);
  } else {
    // Spawn → along the path → over the bridge → down past the pond → back west under the trees.
    await hold('d', 2500);
    await hold('w', 450);
    await hold('d', 3000);
    await hold('s', 1300);
    await hold('a', 1200);
    await hold('s', 900);
    await hold('a', 1600);
  }
  // The still segment: the party stands and the camera settles (its look-ahead eases back in ~0.7 s), then more than 3 s of frames
  // with nothing moving but the scene itself (wind, water, life), to judge its motion frame to frame.
  await page.waitForTimeout(1200);
  const still0 = n;
  await page.waitForTimeout(3600);
  console.log(`${mapId}: still frames ${String(still0).padStart(4, '0')}–${String(n - 1).padStart(4, '0')}`);
  await set('golden');
  await hold('w', 1200);
  await hold('d', 1800);
  await page.waitForTimeout(1000);
  await set('night');
  await hold('a', 1600);
  await hold('w', 1000);
  await page.waitForTimeout(2500);
  grabbing = false;
  await grabber;
  console.log(`${mapId}: ${n} frames in ${dir}`);
}
await context.close();
await browser.close();
