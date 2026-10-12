#!/usr/bin/env node
// Cuts one generated sheet (several objects on a flat background, laid out in a grid) into one
// transparent candidate PNG per object (workflows/batch.md).
// Usage: node .claude/skills/image-to-asset/scripts/cut-sheet.mjs <sheet.png> --grid RxC --stems a,b,-,d
//          [--fit each|shared] [--size WxH] [--suffix _a] [--out art_inbox/.candidates] [--tol 48]
// - stems are row-major; "-" skips a cell (its object is cut but not written).
// - fit each   (default): writes the trimmed object; art:process scales it to its canvas later.
// - fit shared (needs --size): one scale for the whole sheet, each object bottom-centred on the final
//   WxH canvas, so relative sizes survive (growth stages: sprout < grow < ripe). art:process keeps a file
//   that already has its canvas size untouched.
// Also writes art_inbox/.qa/<sheet>_cut.png (the sheet with the found boxes) for a visual check.
// Exit 1 when the object count does not match the grid (nothing written).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const BOTTOM_MARGIN = 4; // same as scripts/process-art.ts for props / buildings
const SIDE_FILL = 0.96;
const PAD = 3;

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const sheetPath = args[0];
if (!sheetPath || sheetPath.startsWith('--') || !opt('grid') || !opt('stems')) {
  console.error('usage: cut-sheet.mjs <sheet.png> --grid RxC --stems a,b,... [--fit each|shared] [--size WxH] [--suffix _a] [--out dir] [--tol 48]');
  process.exit(2);
}
const [ROWS, COLS] = opt('grid').split('x').map(Number);
const stems = opt('stems').split(',').map((s) => s.trim());
const fit = opt('fit', 'each');
const size = opt('size') ? opt('size').split('x').map(Number) : null;
const suffix = opt('suffix', '');
const outDir = join(ROOT, opt('out', 'art_inbox/.candidates'));
const TOL = Number(opt('tol', 48));
if (stems.length !== ROWS * COLS) fail(`--stems has ${stems.length} entries, grid ${ROWS}x${COLS} needs ${ROWS * COLS}`);
if (fit === 'shared' && !size) fail('--fit shared needs --size WxH');

function fail(msg) {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

const abs = (p) => (/^([A-Z]:|\/)/i.test(p) ? p : join(ROOT, p));
const png = PNG.sync.read(readFileSync(abs(sheetPath)));
const W = png.width, H = png.height, D = png.data, N = W * H;

// ---------- background: the dominant border colour, flood-filled from the border ----------
const border = [];
for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
const buckets = new Map();
for (const i of border) {
  if (D[i * 4 + 3] < 128) continue;
  const k = ((D[i * 4] >> 4) << 8) | ((D[i * 4 + 1] >> 4) << 4) | (D[i * 4 + 2] >> 4);
  const b = buckets.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
  (b.n++, (b.r += D[i * 4]), (b.g += D[i * 4 + 1]), (b.b += D[i * 4 + 2]));
  buckets.set(k, b);
}
const transparentSheet = buckets.size === 0;
const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
const BG = top ? [top.r / top.n, top.g / top.n, top.b / top.n] : [0, 0, 0];
const dist = (i) => Math.hypot(D[i * 4] - BG[0], D[i * 4 + 1] - BG[1], D[i * 4 + 2] - BG[2]);
const isBgPixel = (i) => D[i * 4 + 3] <= 16 || (!transparentSheet && dist(i) <= TOL);
const bg = new Uint8Array(N);
{
  const st = border.filter((i) => isBgPixel(i));
  while (st.length) {
    const i = st.pop();
    if (bg[i]) continue;
    bg[i] = 1;
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1])
      if (j >= 0 && !bg[j] && isBgPixel(j)) st.push(j);
  }
}

// ---------- connected foreground components (8-connected) ----------
const lab = new Int32Array(N).fill(-1);
const comps = [];
for (let s = 0; s < N; s++) {
  if (bg[s] || lab[s] !== -1) continue;
  const id = comps.length;
  const c = { id, n: 0, x0: W, y0: H, x1: 0, y1: 0, sx: 0, sy: 0 };
  const st = [s];
  lab[s] = id;
  while (st.length) {
    const i = st.pop(), x = i % W, y = (i / W) | 0;
    (c.n++, (c.sx += x), (c.sy += y));
    if (x < c.x0) c.x0 = x;
    if (x > c.x1) c.x1 = x;
    if (y < c.y0) c.y0 = y;
    if (y > c.y1) c.y1 = y;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (!bg[j] && lab[j] === -1) ((lab[j] = id), st.push(j));
      }
  }
  comps.push(c);
}
const noise = Math.max(24, N * 0.00004);
// Panel dividers: a thin line across (almost) the whole sheet, drawn by the model between cells. Not an object.
const divider = (c) => {
  const w = c.x1 - c.x0 + 1, h = c.y1 - c.y0 + 1;
  return (h >= H * 0.9 && w <= W * 0.02) || (w >= W * 0.9 && h <= H * 0.02);
};
const dividers = comps.filter(divider);
for (const c of dividers) console.log(`INFO ignored a panel divider at x${c.x0}–${c.x1} y${c.y0}–${c.y1}`);
const real = comps.filter((c) => c.n >= noise && !divider(c)).sort((a, b) => b.n - a.n);
if (!real.length) fail('no object found (background not flat? try --tol)');
// Primaries: big enough to be one of the grid's objects (a sprout is much smaller than a bloom).
const primaries = real.filter((c) => c.n >= real[0].n * 0.025);
const want = ROWS * COLS;
const cy = (c) => c.sy / c.n, cx = (c) => c.sx / c.n;
const debugName = `${basename(dirname(abs(sheetPath)))}_${basename(sheetPath).replace(/\.\w+$/, '')}_cut.png`;

/** Primary objects → rows (split the y-sorted centroids at the ROWS-1 largest gaps) → x order; null if not a clean grid. */
function byObjects() {
  if (primaries.length !== want) return null;
  const byY = [...primaries].sort((a, b) => cy(a) - cy(b));
  const gaps = byY.slice(1).map((c, k) => ({ k: k + 1, g: cy(c) - cy(byY[k]) })).sort((a, b) => b.g - a.g).slice(0, ROWS - 1).map((g) => g.k).sort((a, b) => a - b);
  const rows = [];
  let start = 0;
  for (const cut of [...gaps, byY.length]) (rows.push(byY.slice(start, cut).sort((a, b) => cx(a) - cx(b))), (start = cut));
  return rows.some((r) => r.length !== COLS) ? null : rows.flat().map((c) => ({ c, members: [c] }));
}

/**
 * Fallback for objects made of several pieces (scattered petals, seeds): split the foreground's bounding box
 * into an even ROWS x COLS grid and give every component to the cell holding its centroid. null if a cell is empty.
 */
function byCells() {
  const X0 = Math.min(...real.map((c) => c.x0)), X1 = Math.max(...real.map((c) => c.x1));
  const Y0 = Math.min(...real.map((c) => c.y0)), Y1 = Math.max(...real.map((c) => c.y1));
  const cells = Array.from({ length: want }, () => []);
  for (const c of real) {
    const col = Math.min(COLS - 1, Math.floor(((cx(c) - X0) / (X1 - X0 + 1)) * COLS));
    const row = Math.min(ROWS - 1, Math.floor(((cy(c) - Y0) / (Y1 - Y0 + 1)) * ROWS));
    cells[row * COLS + col].push(c);
  }
  if (cells.some((m) => !m.length)) return null;
  return cells.map((m) => ({ c: m.reduce((a, b) => (a.n >= b.n ? a : b)), members: m }));
}

let groups = byObjects();
const primaryIds = new Set(primaries.map((c) => c.id));
if (!groups) {
  groups = byCells();
  if (!groups) {
    writeDebug(primaries.map((c) => ({ c, members: [c] })));
    fail(`found ${primaries.length} objects and no clean ${ROWS}x${COLS} layout (see art_inbox/.qa/${debugName}; objects touching or missing → regenerate with more space)`);
  }
  console.log(`WARN ${primaries.length} objects for ${want} cells → split by an even grid; check art_inbox/.qa/${debugName}`);
  for (const g of groups) for (const m of g.members) primaryIds.add(m.id);
}
// Small detached parts (dandelion seeds, a leaf) join the object whose box is nearest, if close.
const near = Math.max(W, H) * 0.02;
for (const s of real) {
  if (primaryIds.has(s.id)) continue;
  let best = null, bd = Infinity;
  for (const g of groups) {
    const dx = Math.max(g.c.x0 - s.x1, s.x0 - g.c.x1, 0), dy = Math.max(g.c.y0 - s.y1, s.y0 - g.c.y1, 0);
    const d = Math.hypot(dx, dy);
    if (d < bd) ((bd = d), (best = g));
  }
  if (best && bd <= near) best.members.push(s);
}

// ---------- crop each group ----------
const crops = groups.map((g) => {
  const ids = new Set(g.members.map((m) => m.id));
  const x0 = Math.max(0, Math.min(...g.members.map((m) => m.x0)) - PAD), y0 = Math.max(0, Math.min(...g.members.map((m) => m.y0)) - PAD);
  const x1 = Math.min(W - 1, Math.max(...g.members.map((m) => m.x1)) + PAD), y1 = Math.min(H - 1, Math.max(...g.members.map((m) => m.y1)) + PAD);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, d = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y0 + y) * W + x0 + x, o = (y * w + x) * 4;
      if (!ids.has(lab[i])) continue;
      D.copy(d, o, i * 4, i * 4 + 4);
      // Soft rim: a kept pixel next to the background fades by its closeness to the background colour.
      const xx = i % W;
      const touches = (xx > 0 && bg[i - 1]) || (xx < W - 1 && bg[i + 1]) || (i >= W && bg[i - W]) || (i < N - W && bg[i + W]);
      if (touches && !transparentSheet) d[o + 3] = Math.round(d[o + 3] * Math.max(0.25, Math.min(1, (dist(i) - TOL) / TOL)));
    }
  return { w, h, d, box: [x0, y0, w, h] };
});

/** Area-average resample with premultiplied alpha (as scripts/process-art.ts). */
function resize(im, w, h) {
  const d = Buffer.alloc(w * h * 4), sx = im.w / w, sy = im.h / h;
  for (let y = 0; y < h; y++) {
    const fy0 = y * sy, fy1 = Math.max(fy0 + 1e-6, (y + 1) * sy);
    for (let x = 0; x < w; x++) {
      const fx0 = x * sx, fx1 = Math.max(fx0 + 1e-6, (x + 1) * sx);
      let r = 0, g = 0, b = 0, a = 0, area = 0;
      for (let py = Math.floor(fy0); py < Math.min(im.h, Math.ceil(fy1)); py++) {
        const wy = Math.min(fy1, py + 1) - Math.max(fy0, py);
        for (let px = Math.floor(fx0); px < Math.min(im.w, Math.ceil(fx1)); px++) {
          const wgt = wy * (Math.min(fx1, px + 1) - Math.max(fx0, px)), i = (py * im.w + px) * 4, al = im.d[i + 3] * wgt;
          (r += im.d[i] * al), (g += im.d[i + 1] * al), (b += im.d[i + 2] * al), (a += al), (area += wgt);
        }
      }
      const o = (y * w + x) * 4;
      if (a > 0) (d[o] = Math.round(r / a)), (d[o + 1] = Math.round(g / a)), (d[o + 2] = Math.round(b / a)), (d[o + 3] = Math.round(a / area));
    }
  }
  return { w, h, d };
}

function write(path, im) {
  const o = new PNG({ width: im.w, height: im.h });
  im.d.copy(o.data);
  writeFileSync(path, PNG.sync.write(o));
}

mkdirSync(outDir, { recursive: true });
const scale = fit === 'shared'
  ? Math.min(...crops.map((c) => Math.min((size[0] * SIDE_FILL) / c.w, (size[1] - BOTTOM_MARGIN * 2) / c.h)))
  : 1;
const written = [];
crops.forEach((c, k) => {
  const stem = stems[k];
  if (stem === '-') return;
  let im = c;
  if (fit === 'shared') {
    const w = Math.max(1, Math.round(c.w * scale)), h = Math.max(1, Math.round(c.h * scale));
    const s = resize(c, w, h), cv = { w: size[0], h: size[1], d: Buffer.alloc(size[0] * size[1] * 4) };
    const ox = (size[0] - w) >> 1, oy = size[1] - BOTTOM_MARGIN - h;
    for (let y = 0; y < h; y++) s.d.copy(cv.d, ((oy + y) * cv.w + ox) * 4, y * w * 4, (y + 1) * w * 4);
    im = cv;
  }
  const file = join(outDir, `${stem}${suffix}.png`);
  write(file, im);
  written.push(`${file.slice(ROOT.length + 1).replace(/\\/g, '/')} (${im.w}x${im.h}${fit === 'shared' ? `, scale ${scale.toFixed(3)}` : ''})`);
});
writeDebug(groups);
console.log(`background rgb(${BG.map(Math.round).join(',')})${transparentSheet ? ' (transparent sheet)' : ''}, ${groups.length} objects, ${real.length - primaries.length} small part(s) considered`);
for (const w of written) console.log(`OK   ${w}`);
if (fit === 'shared' && scale > 1) console.log(`WARN upscaled ×${scale.toFixed(2)}: sheet objects are smaller than the canvas — generate bigger`);

function writeDebug(gs) {
  const dir = join(ROOT, 'art_inbox', '.qa');
  mkdirSync(dir, { recursive: true });
  const o = new PNG({ width: W, height: H });
  D.copy(o.data);
  const dot = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    o.data.set([230, 30, 60, 255], (y * W + x) * 4);
  };
  gs.forEach((g, k) => {
    const x0 = Math.min(...g.members.map((m) => m.x0)), y0 = Math.min(...g.members.map((m) => m.y0));
    const x1 = Math.max(...g.members.map((m) => m.x1)), y1 = Math.max(...g.members.map((m) => m.y1));
    for (let t = 0; t < 3; t++) {
      for (let x = x0 - t; x <= x1 + t; x++) (dot(x, y0 - t), dot(x, y1 + t));
      for (let y = y0 - t; y <= y1 + t; y++) (dot(x0 - t, y), dot(x1 + t, y));
    }
    // index marker: k+1 small squares above the box
    for (let q = 0; q <= k; q++) for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) dot(x0 + q * 12 + xx, y0 - 14 + yy);
  });
  writeFileSync(join(dir, `${basename(sheetPath).replace(/\.\w+$/, '')}_cut.png`), PNG.sync.write(o));
}
if (!existsSync(outDir)) process.exit(1);
