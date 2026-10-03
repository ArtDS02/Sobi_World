// Seasonal environment FX art (DECISIONS MU-2) from asset/building/building_season/environment.png.
// The sheet's "transparent" checkerboard is baked into opaque grey pixels, so every sprite is
// UNMIXED from it: per pixel the smallest alpha that explains the colour as paint over the grey
// backdrop (no grey halo, glows keep their soft edge), plus full alpha for saturated paint; solid
// sprites (leaves) also fill their enclosed interior. Sprites of one kind are split by connected
// components and packed into one horizontal strip of equal frames (manifest fx `frames`).
// Butterflies, fireflies and sunbeams (the sheet's glows on grey cannot be unmixed cleanly), the
// soft glow and the haze blob are painted here procedurally, straight into RGBA. Every frame keeps
// a fully transparent border (assets:check).
// Usage: npm run art:season-fx
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { SEASON_FX_ART } from '../src/core/config/seasonFx';

const SHEET = 'asset/building/building_season/environment.png';
const OUT_DIR = 'public/assets/fx/env';
const MANIFEST = 'public/assets/manifest/assets.json';
/** Backdrop grey band: a pixel whose channels all stay inside it is backdrop (alpha 0). */
const BG_LO = 62;
const BG_HI = 90;
/** Grey the paint is unmixed against (mean of the two checker tones). */
const BG = 76;
/** Channel spread (max − min) from which paint counts as fully opaque colour. */
const SAT_FULL = 46;
const SAT_START = 16;
const ALPHA_MIN = 0.06;

type Box = [number, number, number, number];
interface Img {
  w: number;
  h: number;
  d: Float32Array; // premultiplied RGBA, 0..1
}

interface Cut {
  /** Region of the sheet holding every sprite of this kind (no captions). */
  box: Box;
  /** Frame size of the output strip. */
  cell: [number, number];
  /** Dilation (px) that groups a sprite's loose parts (sparkles, dust) into one frame. */
  group: number;
  /** paint: any colour away from the grey (saturated = opaque); solid: + enclosed interior opaque. */
  mode: 'paint' | 'solid';
  /** Parts smaller than this many pixels are dropped (caption specks, stray dust). */
  minArea: number;
  /** Max frames kept (left to right, top to bottom). */
  max?: number;
}

const CUTS: Record<string, Cut> = {
  fx_env_petals: { box: [228, 148, 360, 112], cell: [48, 48], group: 1, mode: 'paint', minArea: 40 },
  fx_env_leaves: { box: [142, 426, 456, 98], cell: [64, 64], group: 1, mode: 'solid', minArea: 120 },
  fx_env_snowflakes: { box: [72, 588, 516, 56], cell: [48, 48], group: 2, mode: 'paint', minArea: 60 },
  fx_env_wind: { box: [628, 568, 336, 74], cell: [160, 96], group: 2, mode: 'paint', minArea: 300 },
};

function readSheet(): { w: number; h: number; rgb: Buffer } {
  const p = PNG.sync.read(readFileSync(SHEET));
  return { w: p.width, h: p.height, rgb: p.data };
}

/** Unmixed premultiplied crop of `box`. */
function unmix(sheet: ReturnType<typeof readSheet>, [x0, y0, w, h]: Box, mode: Cut['mode']): Img {
  const d = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = ((y0 + y) * sheet.w + x0 + x) * 4;
      const c = [sheet.rgb[i]!, sheet.rgb[i + 1]!, sheet.rgb[i + 2]!];
      const spread = Math.max(...c) - Math.min(...c);
      let a = 0;
      for (const v of c) {
        if (v > BG_HI) a = Math.max(a, (v - BG_HI) / (255 - BG_HI));
        else if (v < BG_LO) a = Math.max(a, (BG_LO - v) / BG_LO);
      }
      a = Math.max(a, Math.min(1, Math.max(0, (spread - SAT_START) / (SAT_FULL - SAT_START))));
      if (a < ALPHA_MIN) a = 0;
      const o = (y * w + x) * 4;
      // Paint colour F with C = a·F + (1 − a)·BG, stored premultiplied (a·F).
      for (let k = 0; k < 3; k++) d[o + k] = Math.min(a, Math.max(0, (c[k]! - (1 - a) * BG) / 255));
      d[o + 3] = a;
    }
  const img = { w, h, d };
  if (mode === 'solid') fillInterior(img, sheet, [x0, y0, w, h]);
  return img;
}

/** Pixels not reachable from the border through low alpha are inside the sprite: opaque, raw colour. */
function fillInterior(img: Img, sheet: ReturnType<typeof readSheet>, [x0, y0]: Box) {
  const { w, h, d } = img;
  const out = new Uint8Array(w * h);
  const q: number[] = [];
  for (let x = 0; x < w; x++) q.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) q.push(y * w, y * w + w - 1);
  while (q.length) {
    const i = q.pop()!;
    if (out[i] || d[i * 4 + 3]! > 0.6) continue;
    out[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) q.push(i - 1);
    if (x < w - 1) q.push(i + 1);
    if (y > 0) q.push(i - w);
    if (y < h - 1) q.push(i + w);
  }
  for (let i = 0; i < w * h; i++) {
    if (out[i] || d[i * 4 + 3]! >= 1) continue;
    const x = i % w, y = (i / w) | 0;
    const s = ((y0 + y) * sheet.w + x0 + x) * 4;
    for (let k = 0; k < 3; k++) d[i * 4 + k] = sheet.rgb[s + k]! / 255;
    d[i * 4 + 3] = 1;
  }
}

/** Connected parts (after grouping dilation) as bounding boxes, reading order. */
function parts(img: Img, cut: Cut): Box[] {
  const { w, h, d } = img;
  const on = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (d[i * 4 + 3]! > 0.12) on[i] = 1;
  const grown = new Uint8Array(w * h);
  const r = cut.group;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!on[y * w + x]) continue;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) grown[yy * w + xx] = 1;
        }
    }
  const label = new Int32Array(w * h).fill(-1);
  const boxes: { box: Box; area: number }[] = [];
  for (let s = 0; s < w * h; s++) {
    if (!grown[s] || label[s] !== -1) continue;
    const id = boxes.length;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0;
    const q = [s];
    label[s] = id;
    while (q.length) {
      const i = q.pop()!;
      const x = i % w, y = (i / w) | 0;
      if (on[i]) {
        area++;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      for (const j of [i - 1, i + 1, i - w, i + w]) {
        if (j < 0 || j >= w * h || label[j] !== -1 || !grown[j]) continue;
        if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue;
        label[j] = id;
        q.push(j);
      }
    }
    boxes.push({ box: [x0, y0, x1 - x0 + 1, y1 - y0 + 1], area });
  }
  const kept = boxes.filter((b) => b.area >= cut.minArea).map((b) => b.box);
  const rowTol = cut.cell[1] / 2;
  kept.sort((p, q) => (Math.abs(p[1] + p[3] / 2 - (q[1] + q[3] / 2)) > rowTol ? p[1] - q[1] : p[0] - q[0]));
  return cut.max ? kept.slice(0, cut.max) : kept;
}

/** Area-sampled premultiplied resize of `src`'s `box` into a `cell` frame (centred, 2 px clear border). */
function frame(src: Img, [bx, by, bw, bh]: Box, [cw, ch]: [number, number]): Img {
  const pad = 2;
  const s = Math.min((cw - 2 * pad) / bw, (ch - 2 * pad) / bh, 1.5);
  const out: Img = { w: cw, h: ch, d: new Float32Array(cw * ch * 4) };
  const ox = (cw - bw * s) / 2, oy = (ch - bh * s) / 2;
  const n = 3; // supersamples per axis
  for (let y = pad; y < ch - pad; y++)
    for (let x = pad; x < cw - pad; x++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < n; sy++)
        for (let sx = 0; sx < n; sx++) {
          const fx = bx + (x + (sx + 0.5) / n - ox) / s;
          const fy = by + (y + (sy + 0.5) / n - oy) / s;
          if (fx < bx || fy < by || fx >= bx + bw || fy >= by + bh) continue;
          const i = ((fy | 0) * src.w + (fx | 0)) * 4;
          for (let k = 0; k < 4; k++) acc[k]! += src.d[i + k]!;
        }
      for (let k = 0; k < 4; k++) out.d[(y * cw + x) * 4 + k] = acc[k]! / (n * n);
    }
  return out;
}

/** Premultiplied frames → straight-alpha RGBA strip PNG. */
function strip(frames: Img[]): PNG {
  const fw = frames[0]!.w, fh = frames[0]!.h;
  const png = new PNG({ width: fw * frames.length, height: fh });
  frames.forEach((f, n) => {
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        const i = (y * fw + x) * 4;
        const o = (y * png.width + n * fw + x) * 4;
        const a = f.d[i + 3]!;
        if (a < 1 / 255) continue; // fully clear: colour 0 too (no fringe when filtered)
        for (let k = 0; k < 3; k++) png.data[o + k] = Math.round(Math.min(1, f.d[i + k]! / a) * 255);
        png.data[o + 3] = Math.round(Math.min(1, a) * 255);
      }
  });
  return png;
}

// ---- procedural sprites ---------------------------------------------------------------------

const blank = (w: number, h: number): Img => ({ w, h, d: new Float32Array(w * h * 4) });

/** Paints colour `rgb` with coverage `a` over premultiplied `img` at (x, y). */
function over(img: Img, x: number, y: number, rgb: readonly number[], a: number) {
  if (a <= 0 || x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  for (let k = 0; k < 3; k++) img.d[i + k] = (rgb[k]! / 255) * a + img.d[i + k]! * (1 - a);
  img.d[i + 3] = a + img.d[i + 3]! * (1 - a);
}

/** Anti-aliased ellipse (centre, radii, rotation). */
function ellipse(img: Img, cx: number, cy: number, rx: number, ry: number, rot: number, rgb: readonly number[], alpha = 1) {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      let cov = 0;
      for (let sy = 0; sy < 4; sy++)
        for (let sx = 0; sx < 4; sx++) {
          const px = x + (sx + 0.5) / 4 - cx, py = y + (sy + 0.5) / 4 - cy;
          const u = (px * c + py * s) / rx, v = (-px * s + py * c) / ry;
          if (u * u + v * v <= 1) cov++;
        }
      over(img, x, y, rgb, (cov / 16) * alpha);
    }
}

/** A butterfly seen from above: four wings (open = 1, half-closed = 0.45) and a dark body. */
function butterfly(open: number, wing: readonly number[], spot: readonly number[]): Img {
  const img = blank(64, 64);
  const cx = 32, cy = 32;
  for (const side of [-1, 1]) {
    ellipse(img, cx + side * 11 * open, cy - 6, 12 * open + 1.5, 10, side * 0.5, [70, 50, 60]);
    ellipse(img, cx + side * 11 * open, cy - 6, 11 * open + 0.8, 9, side * 0.5, wing);
    ellipse(img, cx + side * 13 * open, cy - 8, 4 * open + 0.5, 3.5, 0, spot);
    ellipse(img, cx + side * 9 * open, cy + 8, 8 * open + 1.2, 7, -side * 0.4, [70, 50, 60]);
    ellipse(img, cx + side * 9 * open, cy + 8, 7 * open + 0.6, 6, -side * 0.4, wing);
  }
  ellipse(img, cx, cy + 1, 2.4, 13, 0, [60, 45, 55]);
  return img;
}

/** Soft radial glow / blob: alpha falls off smoothly to 0 well before the border. */
function radial(size: number, rgb: readonly number[], falloff: number): Img {
  const img = blank(size, size);
  const c = size / 2, r = size / 2 - 3;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const t = Math.hypot(x + 0.5 - c, y + 0.5 - c) / r;
      if (t >= 1) continue;
      over(img, x, y, rgb, Math.pow(1 - t * t, falloff));
    }
  return img;
}

/** A firefly seen from above: glowing tail (brightness `glow`), small dark body and wings. */
function firefly(glow: number): Img {
  const img = blank(64, 64);
  const halo = radial(64, [236, 255, 120], 2.4);
  for (let i = 0; i < halo.d.length; i++) img.d[i] = halo.d[i]! * glow * 0.8;
  ellipse(img, 32, 36, 5, 6.5, 0, [250, 255, 170], glow);
  ellipse(img, 32, 27, 3.2, 5, 0, [58, 52, 40]);
  ellipse(img, 27.5, 27, 3.5, 6, 0.5, [220, 235, 240], 0.55);
  ellipse(img, 36.5, 27, 3.5, 6, -0.5, [220, 235, 240], 0.55);
  return img;
}

/** A slanted shaft of warm light: bright at the top, fading out downwards and at both sides. */
function sunbeam(slant: number, width: number): Img {
  const img = blank(128, 192);
  const top = 12, bottom = 186;
  for (let y = top; y < bottom; y++) {
    const t = (y - top) / (bottom - top);
    const cx = 64 - slant * 40 + slant * 80 * t;
    const half = width * (0.55 + 0.45 * t);
    const along = Math.pow(1 - t, 1.4) * Math.min(1, t * 8);
    for (let x = 0; x < 128; x++) {
      const u = Math.abs(x + 0.5 - cx) / half;
      if (u >= 1) continue;
      const across = 1 - u * u * (3 - 2 * u); // smoothstep falloff to the edges
      over(img, x, y, [255, 244, 205], 0.85 * along * across);
    }
  }
  return img;
}

function writePng(id: string, png: PNG) {
  writeFileSync(join(OUT_DIR, `${id}.png`), PNG.sync.write(png));
}

mkdirSync(OUT_DIR, { recursive: true });
const sheet = readSheet();
let manifest = readFileSync(MANIFEST, 'utf8');
const summary: string[] = [];
/** Upserts fx row `id` in the manifest text, in its own style (2-space JSON, rows at 4 spaces). */
const register = (id: string, extra: Record<string, unknown>) => {
  const row = { id, status: 'production', asset: `fx/env/${id}.png`, ...extra };
  const NL = '\n';
  const text = `    ${JSON.stringify(row, null, 2).split(NL).join(`${NL}    `)}`;
  const open = manifest.indexOf('"fx": [');
  const close = manifest.indexOf(`${NL}  ],`, open);
  const at = manifest.indexOf(`"id": ${JSON.stringify(id)}`, open);
  if (at > 0 && at < close) {
    const start = manifest.lastIndexOf(NL, manifest.lastIndexOf('{', at));
    const end = manifest.indexOf(`${NL}    }`, at) + `${NL}    }`.length;
    manifest = `${manifest.slice(0, start + 1)}${text}${manifest.slice(end)}`;
  } else manifest = `${manifest.slice(0, close)},${NL}${text}${manifest.slice(close)}`;
};

for (const [id, cut] of Object.entries(CUTS)) {
  const img = unmix(sheet, cut.box, cut.mode);
  const boxes = parts(img, cut);
  const frames = boxes.map((b) => frame(img, b, cut.cell));
  writePng(id, strip(frames));
  register(id, { frames: { width: cut.cell[0], height: cut.cell[1], count: frames.length, fps: SEASON_FX_ART.stripFps } });
  summary.push(`${id}: ${frames.length} frames`);
}

const butterflies = [
  butterfly(1, [255, 190, 215], [255, 236, 150]),
  butterfly(0.45, [255, 190, 215], [255, 236, 150]),
  butterfly(1, [170, 210, 255], [255, 255, 255]),
  butterfly(0.45, [170, 210, 255], [255, 255, 255]),
  butterfly(1, [255, 226, 120], [255, 160, 90]),
  butterfly(0.45, [255, 226, 120], [255, 160, 90]),
];
writePng('fx_env_butterflies', strip(butterflies));
register('fx_env_butterflies', { frames: { width: 64, height: 64, count: butterflies.length, fps: SEASON_FX_ART.stripFps } });
const flies = [firefly(1), firefly(0.8), firefly(0.6), firefly(0.9)];
writePng('fx_env_fireflies', strip(flies));
register('fx_env_fireflies', { frames: { width: 64, height: 64, count: flies.length, fps: SEASON_FX_ART.stripFps } });
const beams = [sunbeam(0.35, 20), sunbeam(0.1, 26), sunbeam(-0.25, 18)];
writePng('fx_env_sunbeams', strip(beams));
register('fx_env_sunbeams', { frames: { width: 128, height: 192, count: beams.length, fps: SEASON_FX_ART.stripFps } });
writePng('fx_env_glow', strip([radial(64, [255, 255, 255], 2.2)]));
register('fx_env_glow', { particle: true });
writePng('fx_env_haze', strip([radial(256, [255, 255, 255], 1.6)]));
register('fx_env_haze', {});
summary.push('fx_env_fireflies: 4 frames', 'fx_env_butterflies: 6 frames', 'fx_env_sunbeams: 3 frames', 'fx_env_glow', 'fx_env_haze');

writeFileSync(MANIFEST, manifest);
console.log(`art:season-fx → ${OUT_DIR}\n  ${summary.join('\n  ')}`);
