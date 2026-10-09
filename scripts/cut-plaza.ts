// Cuts the plaza's art out of the reference sheets in asset/reference/sobi_world (the art director's mock-up
// sheets): crop a box, take the sheet's background away from the edges inward, trim to the figure, write a
// PNG with alpha. Run once when the sheets change: `npx tsx scripts/cut-plaza.ts [--preview <png>]`.
// Sobi Farm's own art is not touched.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PNG } from 'pngjs';

const SHEETS = 'asset/reference/sobi_world';
const OUT = 'public/assets';

type Box = [number, number, number, number]; // x0, y0, x1, y1 on the sheet
type Mode = 'light' | 'blue';

interface Cut {
  out: string; // path under public/assets
  sheet: string;
  box: Box;
  mode?: Mode;
  /** Mirror left-right after cutting. */
  flip?: boolean;
  /** Scale so the cut is this high (px); default: keep the sheet's pixels. */
  height?: number;
  /** Drop everything below this row of the box (a sprite's own ground shadow). */
  feetAt?: number;
}

const ASSET_1 = 'sobi_world_lobby_asset_1.png';
const CHARS = 'sobi_world_character_moving.png';

/** Sobi, the female character: two frames per side (A: standing, B: mid-stride). */
const SOBI: Record<string, [Box, Box]> = {
  up: [[55, 160, 170, 372], [215, 160, 330, 372]],
  down: [[375, 160, 495, 372], [535, 160, 650, 372]],
  left: [[55, 470, 170, 683], [215, 470, 335, 683]],
  right: [[375, 470, 495, 683], [535, 470, 650, 683]],
};

const CUTS: Cut[] = [
  { out: 'buildings/prop_portal_gate.png', sheet: ASSET_1, box: [8, 268, 240, 488] },
  { out: 'buildings/prop_garden_gate.png', sheet: ASSET_1, box: [588, 140, 958, 368] },
  { out: 'buildings/prop_sea_dock.png', sheet: ASSET_1, box: [738, 370, 848, 497] },
  { out: 'buildings/prop_sky_tree.png', sheet: ASSET_1, box: [958, 278, 1122, 497] },
  { out: 'props/prop_fountain.png', sheet: ASSET_1, box: [806, 544, 892, 642] },
  { out: 'props/prop_bench_wood.png', sheet: ASSET_1, box: [898, 560, 980, 642] },
  { out: 'props/prop_bench_side.png', sheet: ASSET_1, box: [980, 566, 1052, 632] },
  { out: 'props/prop_lamp_post.png', sheet: ASSET_1, box: [1058, 548, 1094, 646] },
  { out: 'props/prop_lamp_post_b.png', sheet: ASSET_1, box: [1126, 548, 1162, 646] },
  { out: 'props/prop_boat.png', sheet: ASSET_1, box: [1166, 556, 1272, 634] },
  { out: 'props/prop_tree_round.png', sheet: ASSET_1, box: [1052, 646, 1142, 766] },
  { out: 'props/prop_tree_round_b.png', sheet: ASSET_1, box: [1142, 646, 1232, 766] },
  { out: 'props/prop_tree_pine.png', sheet: ASSET_1, box: [1232, 646, 1324, 766] },
  { out: 'props/prop_tree_pine_b.png', sheet: ASSET_1, box: [1328, 636, 1404, 766] },
  { out: 'props/prop_crate_wood.png', sheet: ASSET_1, box: [806, 678, 878, 754] },
  { out: 'props/prop_hay_stack.png', sheet: ASSET_1, box: [890, 690, 958, 754] },
  { out: 'props/prop_signboard.png', sheet: ASSET_1, box: [974, 12, 1066, 112] },
  { out: 'props/prop_signboard_arrow.png', sheet: ASSET_1, box: [1072, 12, 1164, 112] },
];

for (const [facing, [a, b]] of Object.entries(SOBI)) {
  const flipStride = facing === 'up' || facing === 'down'; // the other leg forward
  const cut = (box: Box, flip = false): Omit<Cut, 'out'> => ({ sheet: CHARS, box, mode: 'blue', height: 144, feetAt: box[3] - 8, flip });
  CUTS.push({ out: `props/chr_player_${facing}_idle.png`, ...cut(a) });
  CUTS.push({ out: `props/chr_player_${facing}_walk1.png`, ...cut(b) });
  CUTS.push({ out: `props/chr_player_${facing}_walk2.png`, ...cut(b, flipStride) });
}

const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Is this pixel part of the sheet's background (grey cells and lines, or the blue backdrop)? */
function isBackground(mode: Mode, r: number, g: number, b: number): boolean {
  const l = lum(r, g, b);
  if (mode === 'light') return l > 150 && Math.abs(r - g) < 16 && Math.abs(g - b) < 22;
  return l > 120 && b >= r - 4 && b - r < 70 && b - g < 40 && Math.max(r, g, b) - Math.min(r, g, b) < 75;
}

function crop(sheet: PNG, [x0, y0, x1, y1]: Box): PNG {
  const out = new PNG({ width: x1 - x0, height: y1 - y0 });
  PNG.bitblt(sheet, out, x0, y0, x1 - x0, y1 - y0, 0, 0);
  return out;
}

/** Background pixels connected to the border become transparent; then trim to what is left. */
function cutOut(img: PNG, mode: Mode, feetAt?: number): PNG {
  const { width: w, height: h, data } = img;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const i = y * w + x;
    if (seen[i]) return;
    const p = i * 4;
    if (!isBackground(mode, data[p]!, data[p + 1]!, data[p + 2]!)) return;
    seen[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length > 0) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  keepMainFigure(seen, w, h);
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let i = 0; i < w * h; i++) {
    const y = Math.floor(i / w);
    if (seen[i] || (feetAt !== undefined && y > feetAt)) data[i * 4 + 3] = 0;
    if (data[i * 4 + 3] === 0) continue;
    const x = i % w;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (maxX < 0) throw new Error('nothing left after cutting');
  return crop(img, [minX, minY, maxX + 1, maxY + 1]);
}

/**
 * Marks as background (`seen`) every piece of the cut that is small next to the main figure: bits of
 * grid line and neighbouring objects that touched the box. Pieces at least a fifth of the main one stay
 * (a portal's side stones, a bench's two halves).
 */
function keepMainFigure(seen: Uint8Array, w: number, h: number) {
  const label = new Int32Array(w * h).fill(-1);
  const sizes: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || label[start] !== -1) continue;
    const id = sizes.length;
    let count = 0;
    const stack = [start];
    label[start] = id;
    while (stack.length > 0) {
      const i = stack.pop()!;
      count++;
      const x = i % w;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < w * (h - 1) ? i + w : -1]) {
        if (n < 0 || seen[n] || label[n] !== -1) continue;
        label[n] = id;
        stack.push(n);
      }
    }
    sizes.push(count);
  }
  const biggest = Math.max(0, ...sizes);
  for (let i = 0; i < w * h; i++) {
    if (!seen[i] && sizes[label[i]!]! < biggest / 5) seen[i] = 1;
  }
}

/** Nearest-neighbour resize (pixel art stays crisp). */
function scaleTo(img: PNG, height: number): PNG {
  const width = Math.max(1, Math.round((img.width * height) / img.height));
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = Math.min(img.width - 1, Math.floor((x * img.width) / width));
      const sy = Math.min(img.height - 1, Math.floor((y * img.height) / height));
      const s = (sy * img.width + sx) * 4;
      const d = (y * width + x) * 4;
      for (let k = 0; k < 4; k++) out.data[d + k] = img.data[s + k]!;
    }
  }
  return out;
}

function flipX(img: PNG): PNG {
  const out = new PNG({ width: img.width, height: img.height });
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const s = (y * img.width + x) * 4;
      const d = (y * img.width + (img.width - 1 - x)) * 4;
      for (let k = 0; k < 4; k++) out.data[d + k] = img.data[s + k]!;
    }
  }
  return out;
}

/** Puts every cut on a canvas of the given size, bottom-aligned in its own cell (for the character frames). */
function padTo(img: PNG, width: number, height: number): PNG {
  const out = new PNG({ width, height });
  const ox = Math.floor((width - img.width) / 2);
  const oy = height - img.height - 2;
  PNG.bitblt(img, out, 0, 0, Math.min(img.width, width), Math.min(img.height, height), ox, oy);
  return out;
}

const sheets = new Map<string, PNG>();
const sheet = (name: string) => {
  let s = sheets.get(name);
  if (!s) sheets.set(name, (s = PNG.sync.read(readFileSync(join(SHEETS, name)))));
  return s;
};

const made: { out: string; png: PNG }[] = [];
for (const c of CUTS) {
  let png = crop(sheet(c.sheet), c.box);
  png = cutOut(png, c.mode ?? 'light', c.feetAt === undefined ? undefined : c.feetAt - c.box[1]);
  if (c.height) png = scaleTo(png, Math.min(c.height - 4, png.height));
  if (c.flip) png = flipX(png);
  if (c.out.includes('chr_player')) png = padTo(png, 96, 144);
  made.push({ out: c.out, png });
}

if (process.argv.includes('--preview')) {
  const target = process.argv[process.argv.indexOf('--preview') + 1]!;
  const cell = 200;
  const cols = 8;
  const rows = Math.ceil(made.length / cols);
  const sheetOut = new PNG({ width: cols * cell, height: rows * cell });
  for (let i = 0; i < sheetOut.data.length; i += 4) {
    sheetOut.data[i] = 120; sheetOut.data[i + 1] = 170; sheetOut.data[i + 2] = 110; sheetOut.data[i + 3] = 255;
  }
  made.forEach((m, i) => {
    const fit = Math.min(1, (cell - 10) / m.png.width, (cell - 10) / m.png.height);
    const s = fit < 1 ? scaleTo(m.png, Math.max(1, Math.round(m.png.height * fit))) : m.png;
    const x0 = (i % cols) * cell + Math.floor((cell - s.width) / 2);
    const y0 = Math.floor(i / cols) * cell + cell - s.height - 4;
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        const si = (y * s.width + x) * 4;
        const a = s.data[si + 3]! / 255;
        if (a === 0) continue;
        const di = ((y0 + y) * sheetOut.width + x0 + x) * 4;
        for (let k = 0; k < 3; k++) sheetOut.data[di + k] = Math.round(s.data[si + k]! * a + sheetOut.data[di + k]! * (1 - a));
      }
    }
  });
  writeFileSync(target, PNG.sync.write(sheetOut));
  console.log(`preview of ${made.length} cuts → ${target}`);
} else {
  for (const m of made) {
    const file = join(OUT, m.out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, PNG.sync.write(m.png));
  }
  console.log(`${made.length} files written`);
}
