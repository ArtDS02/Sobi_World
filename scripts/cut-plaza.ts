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
type Mode = 'light' | 'blue' | 'strict';

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
  /** Keep the box as it is (ground tiles): no background removal, no trim. */
  raw?: boolean;
  /** Centre on a square canvas of this size (HUD icons). */
  square?: number;
}

const ASSET_1 = 'sobi_world_lobby_asset_1.png';
const ASSET_2 = 'sobi_world_lobby_asset_2.png';
const CHARS = 'sobi_world_character_moving.png';

/**
 * The two playable characters, two frames per side on the sheet (A: standing, B: mid-stride). `so` is the
 * girl on the left half of the sheet, `bi` the boy on the right half (the sheet labels him Kai).
 */
const CHARACTERS: Record<string, Record<string, [Box, Box]>> = {
  so: {
    up: [[55, 160, 170, 372], [215, 160, 330, 372]],
    down: [[375, 160, 495, 372], [535, 160, 650, 372]],
    left: [[55, 470, 170, 683], [215, 470, 335, 683]],
    right: [[375, 470, 495, 683], [535, 470, 650, 683]],
  },
  bi: {
    up: [[770, 160, 885, 372], [925, 160, 1040, 372]],
    down: [[1085, 160, 1205, 372], [1240, 160, 1360, 372]],
    left: [[770, 470, 885, 683], [925, 470, 1040, 683]],
    right: [[1085, 470, 1205, 683], [1240, 470, 1360, 683]],
  },
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
  // The scenery of the lobby mock-up: farm yard, house, sky tree in its clouds.
  { out: 'buildings/prop_farm_yard.png', sheet: ASSET_1, box: [250, 215, 652, 528] },
  { out: 'buildings/prop_main_house.png', sheet: ASSET_1, box: [1196, 288, 1394, 504] },
  { out: 'props/prop_wheelbarrow_hay.png', sheet: ASSET_1, box: [1306, 556, 1398, 636] },
  { out: 'props/prop_star_orange.png', sheet: ASSET_1, box: [570, 500, 612, 542] },
  { out: 'props/prop_star_blue.png', sheet: ASSET_1, box: [613, 505, 648, 540] },
  { out: 'props/prop_coral_purple.png', sheet: ASSET_1, box: [650, 490, 698, 542] },
  { out: 'props/prop_coral_red.png', sheet: ASSET_1, box: [704, 492, 748, 542] },
  { out: 'props/prop_seashell_red.png', sheet: ASSET_2, box: [808, 646, 840, 678] },
  { out: 'props/prop_seashell_conch.png', sheet: ASSET_2, box: [852, 646, 888, 680] },
  { out: 'props/prop_pebbles.png', sheet: ASSET_2, box: [892, 648, 1052, 682] },
  { out: 'props/prop_flowers_tiny.png', sheet: ASSET_2, box: [1128, 508, 1342, 548] },
  // Animals of the farm yard (idle animation is done in the scene).
  { out: 'props/prop_animal_sheep.png', sheet: ASSET_1, box: [8, 488, 76, 548] },
  { out: 'props/prop_animal_llama.png', sheet: ASSET_1, box: [82, 476, 140, 552] },
  { out: 'props/prop_animal_duck.png', sheet: ASSET_1, box: [144, 498, 194, 552] },
  { out: 'props/prop_animal_hen_brown.png', sheet: ASSET_1, box: [200, 508, 238, 548] },
  { out: 'props/prop_animal_hen_white.png', sheet: ASSET_1, box: [248, 508, 290, 550] },
  { out: 'props/prop_animal_hen_cream.png', sheet: ASSET_1, box: [296, 504, 340, 550] },
  { out: 'props/prop_animal_pig_a.png', sheet: ASSET_1, box: [754, 500, 804, 544] },
  { out: 'props/prop_animal_pig_b.png', sheet: ASSET_1, box: [806, 500, 856, 544] },
  { out: 'props/prop_animal_pig_c.png', sheet: ASSET_1, box: [860, 500, 910, 544] },
  { out: 'props/prop_animal_pig_d.png', sheet: ASSET_1, box: [914, 500, 962, 544] },
  // Butterflies (wings flap in the scene).
  { out: 'props/prop_butterfly_blue.png', sheet: ASSET_2, box: [654, 390, 694, 428] },
  { out: 'props/prop_butterfly_violet.png', sheet: ASSET_2, box: [696, 390, 738, 428] },
  { out: 'props/prop_butterfly_orange.png', sheet: ASSET_2, box: [858, 392, 910, 428] },
  { out: 'props/prop_butterfly_azure.png', sheet: ASSET_2, box: [910, 392, 958, 428] },
  { out: 'props/prop_butterfly_white.png', sheet: ASSET_2, box: [654, 442, 694, 478] },
  { out: 'props/prop_butterfly_red.png', sheet: ASSET_2, box: [696, 442, 738, 478] },
  // The new clouds (the old ones were rough).
  { out: 'environment/env_cloud_a.png', sheet: ASSET_2, box: [978, 128, 1146, 196], mode: 'strict' },
  { out: 'environment/env_cloud_b.png', sheet: ASSET_2, box: [1154, 132, 1292, 174], mode: 'strict' },
  { out: 'environment/env_cloud_c.png', sheet: ASSET_2, box: [1304, 130, 1384, 170], mode: 'strict' },
  { out: 'environment/env_cloud_d.png', sheet: ASSET_2, box: [982, 198, 1104, 256], mode: 'strict' },
  { out: 'environment/env_cloud_e.png', sheet: ASSET_2, box: [1132, 182, 1234, 224], mode: 'strict' },
  { out: 'environment/env_cloud_f.png', sheet: ASSET_2, box: [1234, 172, 1324, 214], mode: 'strict' },
  { out: 'environment/env_cloud_g.png', sheet: ASSET_2, box: [1262, 196, 1396, 264], mode: 'strict' },
  // Ground tiles (cell interiors, the sheet's grid lines left out); the scene paints them into one texture.
  { out: 'environment/env_tile_grass_a.png', sheet: ASSET_2, box: [6, 574, 44, 618], raw: true },
  { out: 'environment/env_tile_grass_b.png', sheet: ASSET_2, box: [74, 644, 118, 688], raw: true },
  { out: 'environment/env_tile_grass_c.png', sheet: ASSET_2, box: [138, 710, 182, 754], raw: true },
  { out: 'environment/env_tile_grass_d.png', sheet: ASSET_2, box: [74, 576, 118, 620], raw: true },
  { out: 'environment/env_tile_dirt.png', sheet: ASSET_2, box: [420, 642, 462, 690], raw: true },
  { out: 'environment/env_tile_water.png', sheet: ASSET_2, box: [524, 574, 580, 630], raw: true },
  // HUD icons and buttons of the top bar.
  { out: 'ui/ui_icon_coin.png', sheet: ASSET_1, box: [8, 10, 62, 64], square: 128 },
  { out: 'ui/ui_icon_gem.png', sheet: ASSET_1, box: [78, 10, 132, 64], square: 128 },
  { out: 'ui/ui_icon_energy.png', sheet: ASSET_1, box: [152, 10, 198, 64], square: 128 },
  { out: 'ui/ui_btn_hub.png', sheet: ASSET_1, box: [236, 6, 306, 74], square: 128 },
  { out: 'ui/ui_btn_map.png', sheet: ASSET_1, box: [316, 6, 384, 74], square: 128 },
  { out: 'ui/ui_btn_menu.png', sheet: ASSET_1, box: [394, 6, 462, 74], square: 128 },
  { out: 'ui/ui_btn_items.png', sheet: ASSET_1, box: [472, 6, 540, 74], square: 128 },
];

for (const [who, sides] of Object.entries(CHARACTERS)) {
  for (const [facing, [a, b]] of Object.entries(sides)) {
    const flipStride = facing === 'up' || facing === 'down'; // the other leg forward
    const cut = (box: Box, flip = false): Omit<Cut, 'out'> => ({ sheet: CHARS, box, mode: 'blue', height: 144, feetAt: box[3] - 8, flip });
    CUTS.push({ out: `props/chr_${who}_${facing}_idle.png`, ...cut(a) });
    CUTS.push({ out: `props/chr_${who}_${facing}_walk1.png`, ...cut(b) });
    CUTS.push({ out: `props/chr_${who}_${facing}_walk2.png`, ...cut(b, flipStride) });
  }
}

const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Is this pixel part of the sheet's background (grey cells and lines, or the blue backdrop)? */
function isBackground(mode: Mode, r: number, g: number, b: number): boolean {
  const l = lum(r, g, b);
  // Clouds: only the sheet's exact greys and whites, so the cloud's own bluish whites stay.
  if (mode === 'strict') return (l > 200 && Math.max(r, g, b) - Math.min(r, g, b) <= 22) || (l > 165 && Math.max(r, g, b) - Math.min(r, g, b) <= 12);
  if (mode === 'light') return l > 150 && Math.abs(r - g) < 16 && Math.abs(g - b) < 22;
  return l > 120 && b >= r - 4 && b - r < 70 && b - g < 40 && Math.max(r, g, b) - Math.min(r, g, b) < 75;
}

/** Marks every pixel that touches (8 neighbours) a pixel that is not sheet background. */
function nextToArt(data: Buffer, w: number, h: number, mode: Mode): Uint8Array {
  const art = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) art[i] = isBackground(mode, data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!) ? 0 : 1;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let near = 0;
      for (let dy = -2; dy <= 2 && !near; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && art[ny * w + nx]) { near = 1; break; }
        }
      }
      out[y * w + x] = near;
    }
  }
  return out;
}

/** Takes the background rim the fill had to leave: background-coloured pixels touching removed ones. */
function trimRim(seen: Uint8Array, data: Buffer, w: number, h: number, mode: Mode) {
  for (let pass = 0; pass < 3; pass++) {
    const add: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (seen[i] || !isBackground(mode, data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!)) continue;
        if ((x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w])) add.push(i);
      }
    }
    for (const i of add) seen[i] = 1;
  }
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
  // Clouds: the outline is thin and has gaps, so the fill must not squeeze through next to it: pixels beside
  // anything that is not sheet background are off limits; the rim they leave is trimmed after the fill.
  const blocked = mode === 'strict' ? nextToArt(data, w, h, mode) : null;
  const push = (x: number, y: number) => {
    const i = y * w + x;
    if (seen[i] || blocked?.[i]) return;
    const p = i * 4;
    if (!blocked && !isBackground(mode, data[p]!, data[p + 1]!, data[p + 2]!)) return;
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
  if (blocked) trimRim(seen, data, w, h, mode);
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
  if (!c.raw) png = cutOut(png, c.mode ?? 'light', c.feetAt === undefined ? undefined : c.feetAt - c.box[1]);
  if (c.height) png = scaleTo(png, Math.min(c.height - 4, png.height));
  if (c.flip) png = flipX(png);
  if (c.out.includes('/chr_')) png = padTo(png, 96, 144);
  if (c.square) {
    // Fill the square (icons are drawn small on the sheet): scale up by whole steps so the pixels stay crisp.
    const fit = c.square - 12;
    const k = Math.max(1, Math.floor(fit / Math.max(png.width, png.height)));
    const big = k > 1 ? scaleTo(png, png.height * k) : png;
    png = padTo(Math.max(big.width, big.height) > fit ? scaleTo(big, Math.round((big.height * fit) / Math.max(big.width, big.height))) : big, c.square, c.square);
  }
  made.push({ out: c.out, png });
}

// The grass tiles come from different cells of the sheet and differ a little in tone, which shows as a
// chequerboard when they are laid side by side: shift each to the same average colour.
{
  const tiles = made.filter((m) => m.out.includes('env_tile_grass_'));
  const mean = (png: PNG) => {
    const sum = [0, 0, 0];
    for (let i = 0; i < png.data.length; i += 4) for (let k = 0; k < 3; k++) sum[k]! += png.data[i + k]!;
    return sum.map((v) => v / (png.data.length / 4));
  };
  const means = tiles.map((t) => mean(t.png));
  const target = [0, 1, 2].map((k) => means.reduce((n, m) => n + m[k]!, 0) / means.length);
  tiles.forEach((t, i) => {
    for (let p = 0; p < t.png.data.length; p += 4) {
      for (let k = 0; k < 3; k++) t.png.data[p + k] = Math.max(0, Math.min(255, Math.round(t.png.data[p + k]! + target[k]! - means[i]![k]!)));
    }
  });
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

// Registers what was cut in the asset manifest (rows already there are replaced, others are left alone).
if (!process.argv.includes('--preview')) {
  const manifestPath = join(OUT, 'manifest/assets.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { id: string }[]>;
  const upsert = (section: string, row: { id: string }) => {
    const rows = manifest[section]!;
    const at = rows.findIndex((r) => r.id === row.id);
    if (at >= 0) rows[at] = row;
    else rows.push(row);
  };
  const frames = new Map<string, Record<string, string>>();
  for (const { out } of made) {
    const [section, file] = out.split('/') as [string, string];
    const base = file.replace(/\.png$/, '');
    const chr = /^(chr_[a-z]+)_(up|down|left|right)_(idle|walk1|walk2)$/.exec(base);
    if (chr) {
      frames.set(chr[1]!, { ...frames.get(chr[1]!), [`${chr[2]}_${chr[3]}`]: out });
      continue;
    }
    upsert(section, { id: base, status: 'production', asset: out } as { id: string });
  }
  for (const [id, states] of frames) upsert('props', { id, status: 'production', states } as { id: string });
  // The first placeholder character is replaced by the two real ones.
  manifest.props = manifest.props!.filter((r) => r.id !== 'chr_player');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('manifest updated');
}
