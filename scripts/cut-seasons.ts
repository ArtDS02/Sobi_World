// Seasonal variants of buildings and props (SE task) cut out of asset/building/building_season/
// building-<season>.png. The four sheets share one layout; their "transparent" checkerboard is baked
// into opaque pixels, so the backdrop is flood-filled from the crop border through low-saturation
// mid-grey pixels (painted greys inside an outline are never reached). Each cut is fitted onto the
// canvas of the row's DEFAULT file: same canvas size, bottom line and centre, scaled to the default
// art's painted area — so placement, scale, hit area and obstacle bounds stay as they are.
// Writes public/assets/<dir>/<id>_<season>.png and the row's `seasons` field in the manifest.
// Usage: npm run art:seasons [-- <id> …]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { SEASON_IDS, type SeasonId } from '../src/core/config/seasons';
import { patchRowObject } from './assets/manifestText';

const SHEETS = 'asset/building/building_season';
const ASSETS = 'public/assets';
const MANIFEST = join(ASSETS, 'manifest', 'assets.json');
/** Backdrop checker: max channel spread and luminance range (measured on the four sheets). */
const BG_SPREAD = 12;
const BG_LUM: [number, number] = [56, 102];
/** Blobs smaller than this share of the biggest one are specks / caption bits. */
const MIN_BLOB = 0.06;
/**
 * The generator's translucent ✦ watermark sits on the rock (sheet bottom-right): inside this rect
 * (crop coordinates) lighter greys also count as backdrop.
 */
const GLYPH_OF: Record<string, Box> = { prop_rock: [18, 0, 38, 36] };
const GLYPH_LUM_MAX = 145;
const OPAQUE = 16;

type Box = [number, number, number, number];
interface Img {
  w: number;
  h: number;
  d: Buffer;
}

/** Manifest row id → its box on every season sheet (x, y, w, h). */
export const SEASON_CUTS: Record<string, Box> = {
  prop_pig_house: [258, 110, 218, 170],
  prop_hay_shed: [535, 110, 230, 170],
  prop_shop_stall: [862, 110, 180, 170],
  prop_order_board: [1135, 120, 140, 160],
  prop_water_well: [235, 340, 130, 132],
  prop_fence_section: [485, 365, 155, 105],
  prop_veggie_patch: [942, 335, 178, 130],
  prop_wheelbarrow: [1185, 335, 165, 135],
  prop_food_sack: [72, 545, 96, 96],
  prop_water_bowl: [240, 555, 130, 86],
  prop_apple_crate: [425, 540, 118, 101],
  prop_hay_bale: [590, 548, 128, 93],
  prop_bush: [770, 555, 100, 86],
  prop_red_tree: [905, 495, 147, 146],
  prop_sunflower: [1083, 535, 113, 106],
  prop_mushroom: [1235, 540, 115, 100],
  prop_rock: [1372, 525, 148, 116],
};

const load = (path: string): Img => {
  const p = PNG.sync.read(readFileSync(path));
  return { w: p.width, h: p.height, d: p.data };
};

function crop(src: Img, [x, y, w, h]: Box): Img {
  const d = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++)
    src.d.copy(d, r * w * 4, ((y + r) * src.w + x) * 4, ((y + r) * src.w + x + w) * 4);
  return { w, h, d };
}

const isChecker = (d: Buffer, i: number, lumMax = BG_LUM[1]) => {
  const r = d[i]!,
    g = d[i + 1]!,
    b = d[i + 2]!;
  const lum = (r + g + b) / 3;
  return Math.max(r, g, b) - Math.min(r, g, b) <= BG_SPREAD && lum >= BG_LUM[0] && lum <= lumMax;
};
const inBox = (x: number, y: number, b?: Box) =>
  !!b && x >= b[0] && y >= b[1] && x < b[0] + b[2] && y < b[1] + b[3];

const N8 = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => [dx, dy] as const));

/** Clears the backdrop reachable from the border, then feathers the cut edge by one pixel. */
function keyOutChecker(im: Img, glyph?: Box) {
  const { w, h, d } = im;
  const bg = new Uint8Array(w * h);
  const q: number[] = [];
  for (let x = 0; x < w; x++) q.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) q.push(y * w, y * w + w - 1);
  while (q.length) {
    const i = q.pop()!;
    const lumMax = inBox(i % im.w, (i / im.w) | 0, glyph) ? GLYPH_LUM_MAX : BG_LUM[1];
    if (bg[i] || !isChecker(d, i * 4, lumMax)) continue;
    bg[i] = 1;
    const x = i % w,
      y = (i / w) | 0;
    for (const [dx, dy] of N8) {
      const xx = x + dx,
        yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h && !bg[yy * w + xx]) q.push(yy * w + xx);
    }
  }
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) {
      d[i * 4 + 3] = 0;
      continue;
    }
    const x = i % w,
      y = (i / w) | 0;
    let near = 0;
    for (const [dx, dy] of N8) {
      const xx = x + dx,
        yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h || bg[yy * w + xx]) near++;
    }
    // Soft rim: a pixel mostly surrounded by backdrop keeps part of its alpha (no stair steps).
    if (near > 0) d[i * 4 + 3] = Math.round(255 * Math.max(0.35, 1 - near / 9));
  }
}

/** Drops 8-connected blobs smaller than MIN_BLOB of the biggest (glyphs, specks, caption bits). */
function dropSpecks(im: Img) {
  const { w, h, d } = im;
  const label = new Int32Array(w * h).fill(-1);
  const sizes: number[] = [];
  for (let s = 0; s < w * h; s++) {
    if (d[s * 4 + 3]! <= OPAQUE || label[s] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    const q = [s];
    label[s] = id;
    while (q.length) {
      const i = q.pop()!;
      size++;
      const x = i % w,
        y = (i / w) | 0;
      for (const [dx, dy] of N8) {
        const xx = x + dx,
          yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx;
        if (label[j] === -1 && d[j * 4 + 3]! > OPAQUE) {
          label[j] = id;
          q.push(j);
        }
      }
    }
    sizes.push(size);
  }
  const big = Math.max(0, ...sizes);
  for (let i = 0; i < w * h; i++) {
    const l = label[i]!;
    if (l === -1 ? d[i * 4 + 3]! > 0 : sizes[l]! < big * MIN_BLOB) d[i * 4 + 3] = 0;
  }
}

function bbox(im: Img) {
  let x0 = im.w,
    y0 = im.h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++)
      if (im.d[(y * im.w + x) * 4 + 3]! > OPAQUE) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Premultiplied bilinear scale of `im`'s bbox by `s`; bbox bottom-centre lands on (cx, bottom). */
function place(im: Img, s: number, W: number, H: number, cx: number, bottom: number): Img {
  const b = bbox(im);
  const out: Img = { w: W, h: H, d: Buffer.alloc(W * H * 4) };
  const ox = cx - (b.w * s) / 2,
    oy = bottom - b.h * s;
  const at = (x: number, y: number, c: number) => {
    const i = (y * im.w + x) * 4;
    return c === 3 ? im.d[i + 3]! : (im.d[i + c]! * im.d[i + 3]!) / 255;
  };
  const sample = (fx: number, fy: number, c: number) => {
    const x = Math.max(0, Math.min(im.w - 1, fx)),
      y = Math.max(0, Math.min(im.h - 1, fy));
    const x0 = Math.floor(x),
      y0 = Math.floor(y),
      x1 = Math.min(im.w - 1, x0 + 1),
      y1 = Math.min(im.h - 1, y0 + 1);
    const tx = x - x0,
      ty = y - y0;
    return (
      (at(x0, y0, c) * (1 - tx) + at(x1, y0, c) * tx) * (1 - ty) +
      (at(x0, y1, c) * (1 - tx) + at(x1, y1, c) * tx) * ty
    );
  };
  for (let y = Math.max(0, Math.floor(oy)); y < Math.min(H, Math.ceil(oy + b.h * s)); y++) {
    for (let x = Math.max(0, Math.floor(ox)); x < Math.min(W, Math.ceil(ox + b.w * s)); x++) {
      const fx = b.x + (x - ox + 0.5) / s - 0.5,
        fy = b.y + (y - oy + 0.5) / s - 0.5;
      const a = sample(fx, fy, 3);
      if (a < 1) continue;
      const o = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) out.d[o + c] = Math.round((sample(fx, fy, c) * 255) / a);
      out.d[o + 3] = Math.round(a);
    }
  }
  return out;
}

/** Fits a cut onto the default file's canvas: same painted area, centre and bottom line. */
function fitToDefault(cut: Img, def: Img): Img {
  const c = bbox(cut);
  const d = bbox(def);
  const area = Math.sqrt((d.w * d.h) / (c.w * c.h));
  const s = Math.min(area, (def.w - 2) / c.w, (d.y + d.h) / c.h);
  const cx = Math.min(def.w - (c.w * s) / 2 - 1, Math.max((c.w * s) / 2 + 1, d.x + d.w / 2));
  return place(cut, s, def.w, def.h, cx, d.y + d.h);
}

function main() {
  const only = new Set(process.argv.slice(2));
  let text = readFileSync(MANIFEST, 'utf8');
  const manifest = JSON.parse(text) as Record<string, { id: string; asset?: string }[]>;
  const rowOf = (id: string) =>
    [...manifest.props!, ...manifest.buildings!].find((r) => r.id === id);
  const sheets = new Map(
    SEASON_IDS.map((s) => [s, load(join(SHEETS, `building-${s}.png`))] as [SeasonId, Img]),
  );
  for (const [id, box] of Object.entries(SEASON_CUTS)) {
    if (only.size && !only.has(id)) continue;
    const row = rowOf(id);
    if (!row?.asset) throw new Error(`${id}: no manifest row with a default asset`);
    const def = load(join(ASSETS, row.asset));
    const seasons: Record<string, string> = {};
    for (const [season, sheet] of sheets) {
      const im = crop(sheet, box);
      keyOutChecker(im, GLYPH_OF[id]);
      dropSpecks(im);
      const out = fitToDefault(im, def);
      const path = row.asset.replace(/\.png$/, `_${season}.png`);
      const png = new PNG({ width: out.w, height: out.h });
      out.d.copy(png.data);
      writeFileSync(join(ASSETS, path), PNG.sync.write(png));
      seasons[season] = path;
    }
    text = patchRowObject(text, id, 'seasons', seasons);
    console.log(`${id}: ${Object.keys(seasons).join(', ')}`);
  }
  writeFileSync(MANIFEST, text);
}

main();
