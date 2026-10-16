// Item icons derived from accepted sprites (K-derive, decision 035): the fish icon is the whole fish, a produce / flower
// icon is a crop of the ripe plant, a seed icon is the Area's seed packet with a round label showing the produce.
// Writes public/assets/ui/ui_item_*.png (128²) and marks the manifest rows production.
// Usage: npx tsx scripts/art/derive-icons.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { patchRowText } from '../assets/manifestText';

type Box = readonly [number, number, number, number]; // x0, y0, x1, y1 on the source canvas

const SIZE = 128;
const MANIFEST = 'public/assets/manifest/assets.json';
const OUTLINE: Rgb = [74, 46, 28]; // the warm dark-brown line of the style (GAME_ART_DIRECTION §1)
type Rgb = readonly [number, number, number];

const FISH = ['guppy', 'neon_tetra', 'catfish', 'loach', 'gourami', 'molly', 'butterflyfish', 'boxfish', 'blue_tang', 'discus', 'lionfish', 'parrotfish', 'jellyfish', 'octopus', 'sea_turtle', 'manta', 'arowana', 'dolphin'];
/** The part of each ripe crop that reads as the produce (152×132 canvas): the whole plant, or the head of the sunflower. */
const CROPS: Record<string, Box> = {
  tomato: [0, 0, 152, 106],
  cabbage: [0, 0, 152, 132],
  sweet_potato: [0, 0, 152, 132],
  pumpkin: [0, 0, 152, 132],
  strawberry: [0, 0, 152, 132],
  sugarcane: [0, 0, 152, 132],
  watermelon: [0, 0, 152, 132],
  sunflower: [46, 14, 104, 70],
};
/** The blooms of each ripe flower (152×132 canvas). */
const FLOWERS: Record<string, Box> = {
  sun_tulip: [26, 2, 126, 112],
  rain_hydrangea: [16, 12, 136, 100],
  comet_lavender: [16, 2, 132, 102],
  sunset_hibiscus: [22, 12, 132, 104],
  thunder_iris: [24, 2, 126, 76],
  snow_camellia: [18, 10, 134, 106],
  crystal_peony: [30, 8, 116, 80],
  sky_lotus: [24, 8, 128, 76],
};
/** The packet each Area's seeds come in, and where its round label sits. */
const PACKETS = {
  garden: { file: 'ui_item_seed_carrot', cx: 64, cy: 66, r: 30, fill: [255, 248, 220] as Rgb },
  cloud: { file: 'ui_item_seed_cloud_daisy', cx: 62, cy: 66, r: 29, fill: [240, 250, 255] as Rgb },
};

const load = (path: string) => PNG.sync.read(readFileSync(path));

function trim(p: PNG, box: Box = [0, 0, p.width, p.height]): Box {
  let x0 = box[2], y0 = box[3], x1 = box[0] - 1, y1 = box[1] - 1;
  for (let y = box[1]; y < box[3]; y++)
    for (let x = box[0]; x < box[2]; x++)
      if (p.data[(y * p.width + x) * 4 + 3]! > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return [x0, y0, x1 + 1, y1 + 1];
}

/** Draws `box` of `src` into `dst`, scaled (area average, premultiplied) to fit a `fit`-px square centred on (cx, cy). */
function blitFit(dst: PNG, src: PNG, box: Box, cx: number, cy: number, fit: number, clipR = Infinity) {
  const bw = box[2] - box[0], bh = box[3] - box[1];
  const s = Math.min(fit / bw, fit / bh);
  const w = Math.round(bw * s), h = Math.round(bh * s);
  const ox = Math.round(cx - w / 2), oy = Math.round(cy - h / 2);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx0 = box[0] + x / s, sx1 = box[0] + (x + 1) / s, sy0 = box[1] + y / s, sy1 = box[1] + (y + 1) / s;
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++)
        for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
          const i = (sy * src.width + sx) * 4, al = src.data[i + 3]! / 255;
          r += src.data[i]! * al; g += src.data[i + 1]! * al; b += src.data[i + 2]! * al; a += al; n++;
        }
      if (a <= 0) continue;
      const alpha = a / n, dx = ox + x, dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height || Math.hypot(dx + 0.5 - cx, dy + 0.5 - cy) > clipR) continue;
      const o = (dy * dst.width + dx) * 4, da = dst.data[o + 3]! / 255;
      const outA = alpha + da * (1 - alpha);
      for (let c = 0; c < 3; c++) {
        const sc = [r, g, b][c]! / a;
        dst.data[o + c] = Math.round((sc * alpha + dst.data[o + c]! * da * (1 - alpha)) / outA);
      }
      dst.data[o + 3] = Math.round(outA * 255);
    }
}

/** A round label (fill + 2.5 px outline), anti-aliased, over the packet's printed picture. */
function label(dst: PNG, cx: number, cy: number, r: number, fill: Rgb) {
  for (let y = 0; y < dst.height; y++)
    for (let x = 0; x < dst.width; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const cover = Math.max(0, Math.min(1, r + 0.5 - d));
      if (cover <= 0) continue;
      const line = Math.max(0, Math.min(1, d - (r - 3)));
      const col = fill.map((f, c) => f * (1 - line) + OUTLINE[c]! * line);
      const o = (y * dst.width + x) * 4;
      for (let c = 0; c < 3; c++) dst.data[o + c] = Math.round(col[c]! * cover + dst.data[o + c]! * (1 - cover));
      dst.data[o + 3] = Math.max(dst.data[o + 3]!, Math.round(cover * 255));
    }
}

const blank = () => {
  const p = new PNG({ width: SIZE, height: SIZE });
  p.data.fill(0);
  return p;
};
const save = (id: string, p: PNG) => writeFileSync(`public/assets/ui/${id}.png`, PNG.sync.write(p));

const done: string[] = [];
for (const f of FISH) {
  const src = load(`public/assets/props/fish_${f}.png`);
  const icon = blank();
  blitFit(icon, src, trim(src), SIZE / 2, SIZE / 2, SIZE * 0.86);
  save(`ui_item_fish_${f}`, icon);
  done.push(`ui_item_fish_${f}`);
}
const plant = (area: keyof typeof PACKETS, stem: string, produceId: string, seedId: string, box: Box) => {
  const ripe = load(`public/assets/props/${stem}_ripe.png`);
  const crop = trim(ripe, box);
  const produce = blank();
  blitFit(produce, ripe, crop, SIZE / 2, SIZE / 2, SIZE * 0.86);
  save(produceId, produce);
  const k = PACKETS[area];
  const seed = load(`public/assets/ui/${k.file}.png`);
  label(seed, k.cx, k.cy, k.r, k.fill);
  blitFit(seed, ripe, crop, k.cx, k.cy, k.r * 1.5, k.r - 3);
  save(seedId, seed);
  done.push(produceId, seedId);
};
for (const [s, box] of Object.entries(CROPS)) plant('garden', `crop_${s}`, `ui_item_${s}`, `ui_item_seed_${s}`, box);
for (const [s, box] of Object.entries(FLOWERS)) plant('cloud', `flower_${s}`, `ui_item_flower_${s}`, `ui_item_seed_${s}`, box);

let text = readFileSync(MANIFEST, 'utf8');
for (const id of done) text = patchRowText(text, id, { status: 'production' });
writeFileSync(MANIFEST, text);
console.log(`${done.length} icons`);
