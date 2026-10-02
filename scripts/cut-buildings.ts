// Cuts buildings and props out of asset/building/style_reference_building_new.png (A4). That sheet
// is opaque on a near-black backdrop: alpha comes from each pixel's colour distance to the backdrop
// (soft ramp, colour un-mixed), then the largest blob of the crop is kept, which drops the caption
// text under each item. Older sheet (style_reference_building.png) already has alpha and provides
// the windmill. Every item is scaled by ONE world factor so relative sizes stay as painted, and
// placed bottom-centred on a canvas of exactly its catalogue size (art:process keeps it as is).
// Usage: npm run art:buildings [-- <id> …]  → art_inbox/<file>.png, then npm run art:process.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { CATALOGUE_SIZES } from './assets/sizes';

const INBOX = 'art_inbox';
const SHEET = 'asset/building/style_reference_building_new.png';
const OLD_SHEET = 'asset/building/style_reference_building.png';
/** Sheet px → canvas px for every item (keeps the sheet's relative sizes). */
export const WORLD_SCALE = 1.2;
/** The older sheet is painted ~1.2× larger (its pig house is 374 px wide, the new one 310). */
const OLD_SCALE = WORLD_SCALE * (310 / 374);
const BOTTOM_MARGIN = 4; // matches process-art for buildings/props
/** Colour distance to the backdrop: below LO transparent, above HI opaque. */
const LO = 12;
const HI = 40;

interface Img {
  w: number;
  h: number;
  d: Buffer;
}
type Box = [number, number, number, number];

export interface BuildingCut {
  file: string; // target stem in art_inbox (= manifest file name)
  box: Box; // x, y, w, h on the sheet
  old?: boolean; // from the older sheet that already has alpha
  /** Recolours applied after the cut (trough states). */
  edit?: (im: Img) => void;
}

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

/** Median of the four sheet corners: the backdrop colour. */
function backdrop(s: Img): [number, number, number] {
  const at = (x: number, y: number) => [0, 1, 2].map((c) => s.d[(y * s.w + x) * 4 + c]!);
  const cs = [at(2, 2), at(s.w - 3, 2), at(2, s.h - 3), at(s.w - 3, s.h - 3)];
  return [0, 1, 2].map((c) => cs.map((v) => v[c]!).sort((a, b) => a - b)[2]!) as [
    number,
    number,
    number,
  ];
}

/** Alpha from distance to the backdrop; colour un-mixed from it on the soft edge. */
function keyOut(im: Img, bg: [number, number, number]) {
  for (let i = 0; i < im.d.length; i += 4) {
    const dist = Math.hypot(im.d[i]! - bg[0], im.d[i + 1]! - bg[1], im.d[i + 2]! - bg[2]);
    const a = Math.max(0, Math.min(1, (dist - LO) / (HI - LO)));
    if (a > 0 && a < 1) {
      for (let c = 0; c < 3; c++) {
        im.d[i + c] = Math.max(0, Math.min(255, Math.round((im.d[i + c]! - (1 - a) * bg[c]!) / a)));
      }
    }
    im.d[i + 3] = Math.round(a * 255 * (im.d[i + 3]! / 255));
  }
}

/** Keeps only the largest 8-connected blob of pixels with alpha > 40 (drops captions, specks). */
function largestBlob(im: Img) {
  const { w, h, d } = im;
  const n = w * h;
  const label = new Int32Array(n).fill(-1);
  let best = -1,
    bestSize = 0;
  for (let s = 0; s < n; s++) {
    if (d[s * 4 + 3]! <= 40 || label[s] !== -1) continue;
    let size = 0;
    const q = [s];
    label[s] = s;
    while (q.length) {
      const i = q.pop()!;
      size++;
      const x = i % w,
        y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx,
            yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = yy * w + xx;
          if (label[j] === -1 && d[j * 4 + 3]! > 40) {
            label[j] = s;
            q.push(j);
          }
        }
    }
    if (size > bestSize) {
      bestSize = size;
      best = s;
    }
  }
  // Soft edge pixels (alpha ≤ 40) next to the blob stay; everything else goes.
  for (let i = 0; i < n; i++) {
    if (label[i] === best) continue;
    const x = i % w,
      y = (i / w) | 0;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++)
      for (let dx = -1; dx <= 1 && !near; dx++) {
        const xx = x + dx,
          yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && label[yy * w + xx] === best) near = true;
      }
    if (!near || d[i * 4 + 3]! > 40) d[i * 4 + 3] = 0;
  }
}

function bbox(im: Img) {
  let x0 = im.w,
    y0 = im.h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++)
      if (im.d[(y * im.w + x) * 4 + 3]! > 8) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Premultiplied bilinear scale of `im`'s bbox by `s`, bottom-centred on a `W`×`H` canvas. */
function place(im: Img, s: number, W: number, H: number): Img {
  const b = bbox(im);
  const out: Img = { w: W, h: H, d: Buffer.alloc(W * H * 4) };
  const sw = b.w * s,
    sh = b.h * s;
  const ox = (W - sw) / 2,
    oy = H - BOTTOM_MARGIN - sh;
  const at = (xx: number, yy: number, c: number) => {
    const i = (yy * im.w + xx) * 4;
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
  for (let y = Math.max(0, Math.floor(oy)); y < Math.min(H, Math.ceil(oy + sh)); y++) {
    for (let x = Math.max(0, Math.floor(ox)); x < Math.min(W, Math.ceil(ox + sw)); x++) {
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

const lum = (r: number, g: number, b: number) => 0.3 * r + 0.59 * g + 0.11 * b;
/** How "corn yellow" a pixel is (0..1). */
const corn = (r: number, g: number, b: number) =>
  Math.max(0, Math.min(1, ((r + g) / 2 - b - 90) / 50)) * (r > 150 ? 1 : 0);

/**
 * Trough states from the full painting: corn above `cut` (fraction of the corn's height from its
 * top) becomes the dark wooden floor of the trough; the cobs leaning on the rim go with it.
 */
function troughFill(keep: number) {
  return (im: Img) => {
    let top = im.h,
      bottom = 0;
    for (let y = 0; y < im.h; y++)
      for (let x = 0; x < im.w; x++) {
        const i = (y * im.w + x) * 4;
        if (im.d[i + 3]! > 200 && corn(im.d[i]!, im.d[i + 1]!, im.d[i + 2]!) > 0.6) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    const cut = top + (bottom - top) * (1 - keep);
    for (let y = 0; y < im.h; y++)
      for (let x = 0; x < im.w; x++) {
        const i = (y * im.w + x) * 4;
        const [r, g, b] = [im.d[i]!, im.d[i + 1]!, im.d[i + 2]!];
        const k = corn(r, g, b);
        if (k <= 0 || y >= cut) continue;
        const l = lum(r, g, b) / 255;
        const wood = [118 * l + 30, 78 * l + 22, 44 * l + 16];
        for (let c = 0; c < 3; c++)
          im.d[i + c] = Math.round(im.d[i + c]! + (wood[c]! - im.d[i + c]!) * k);
      }
  };
}

export const BUILDING_CUTS: BuildingCut[] = [
  // prop_pig_house is user art (signed "Chuồng Heo", background removed by hand): not cut here.
  { file: 'prop_hay_shed', box: [395, 20, 350, 285] },
  { file: 'prop_water_well', box: [765, 60, 255, 235] },
  { file: 'prop_shop_stall', box: [1045, 15, 270, 285] },
  { file: 'prop_order_board', box: [1345, 70, 170, 220] },
  { file: 'prop_feed_trough_full', box: [505, 305, 250, 160] },
  { file: 'prop_feed_trough_half', box: [505, 305, 250, 160], edit: troughFill(0.45) },
  { file: 'prop_feed_trough_empty', box: [505, 305, 250, 160], edit: troughFill(0) },
  { file: 'prop_water_bowl', box: [780, 345, 165, 110] },
  { file: 'prop_food_sack', box: [960, 315, 150, 145] },
  { file: 'prop_mud_puddle', box: [1300, 355, 225, 100] },
  { file: 'prop_fence_section', box: [25, 525, 180, 105] },
  { file: 'prop_apple_crate', box: [1125, 330, 170, 125] },
  { file: 'prop_veggie_patch', box: [220, 515, 195, 110] },
  { file: 'prop_bush', box: [435, 520, 160, 110] },
  { file: 'prop_rock', box: [610, 545, 130, 80] },
  { file: 'prop_red_tree', box: [760, 495, 125, 130] },
  { file: 'prop_wheelbarrow', box: [905, 525, 165, 100] },
  { file: 'prop_hay_bale', box: [1075, 525, 155, 100] },
  { file: 'prop_sunflower', box: [1245, 505, 150, 120] },
  { file: 'prop_mushroom', box: [1420, 545, 85, 80] },
  { file: 'prop_windmill', box: [960, 0, 275, 325], old: true },
];

function main() {
  mkdirSync(INBOX, { recursive: true });
  const sheet = load(SHEET);
  const old = load(OLD_SHEET);
  const bg = backdrop(sheet);
  const only = new Set(process.argv.slice(2));
  for (const c of BUILDING_CUTS.filter((c) => only.size === 0 || only.has(c.file))) {
    const im = crop(c.old ? old : sheet, c.box);
    if (!c.old) keyOut(im, bg);
    largestBlob(im);
    c.edit?.(im);
    const b = bbox(im);
    const size = CATALOGUE_SIZES[c.file];
    if (!size) throw new Error(`${c.file}: no catalogue size`);
    const scale = c.old ? OLD_SCALE : WORLD_SCALE;
    const fit = Math.min(scale, (size.width - 2) / b.w, (size.height - BOTTOM_MARGIN * 2) / b.h);
    if (fit < scale - 1e-6) console.warn(`${c.file}: shrunk to x${fit.toFixed(2)} to fit`);
    const out = place(im, fit, size.width, size.height);
    const png = new PNG({ width: size.width, height: size.height });
    out.d.copy(png.data);
    writeFileSync(join(INBOX, `${c.file}.png`), PNG.sync.write(png));
    console.log(`${c.file}: ${b.w}x${b.h} → ${size.width}x${size.height}`);
  }
}

main();
