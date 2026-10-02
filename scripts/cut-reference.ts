// Cuts pigs out of the concept sheets in asset/reference/ (user request: use the reference art
// itself). The sheets already carry alpha (the coloured glow is RGB under ~transparent pixels), so
// the character is the largest opaque blob of the crop, holes filled. Each pig is then
// scaled by one factor per sheet (relative sizes stay as painted) and placed on the 512² canvas
// with its lowest pixel on the 82 % ground line. Output goes to art_inbox/ for npm run art:process.
// The sheets have no sleeping poses, so cut pigs drop their `sleepAsset` (the game then shows the
// idle frame + fx_zzz, DECISIONS Q5) and their old sleep files are removed.
// Usage: npm run art:cut [-- <id> …]  (no ids = every cut)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { COATS, toTeal } from './assets/coats';
import { TRAITS, applyTrait } from './assets/traits';
import { patchRowText } from './assets/manifestText';

const INBOX = 'art_inbox';
const ASSETS = 'public/assets';
const MANIFEST = join(ASSETS, 'manifest', 'assets.json');
const SIZE = 512;
const FEET = Math.round(SIZE * 0.82);
/** Height (ears to hooves) the plain pink pig of each sheet gets on the 512 canvas. */
const CLASSIC_HEIGHT = 330;
/** Alpha above this is the character; the sheets' glow sits far below it. */
const SOLID = 128;

interface Img {
  w: number;
  h: number;
  d: Buffer;
}
interface Cut {
  id: string;
  sheet: string;
  box: [number, number, number, number]; // x, y, w, h on the sheet
  /** Optional recolour of the body (white / brown variants of the plain pig). */
  tint?: (r: number, g: number, b: number) => [number, number, number];
  /** Optional coat pattern for species derived from a reference pig (U07, scripts/assets/coats). */
  coat?: keyof typeof COATS;
  /** Optional anatomy drawn over the final pig (A3, scripts/assets/traits). */
  trait?: keyof typeof TRAITS;
}

const ENV = 'asset/reference/style_reference_environment.png';
const PIGS = 'asset/reference/style_reference_pigs.png';
/** Grid cell of the pig sheet, widened so hats and hooves crossing the cell edge stay whole. */
const cell = (c: number, r: number): [number, number, number, number] => {
  const m = 40,
    x = Math.max(0, c * 256 - m),
    y = Math.max(0, r * 256 - m);
  return [x, y, Math.min(1536, c * 256 + 256 + m) - x, Math.min(1024, r * 256 + 256 + m) - y];
};

/**
 * Pink → another coat, keeping each pixel's lightness so the painted shading survives. The weight
 * follows how pink the pixel is (smooth, no hard edge), so outline and eyes barely move.
 */
const recolour =
  (target: [number, number, number], strength: number, bright = 1) =>
  (r: number, g: number, b: number): [number, number, number] => {
    const lum = (c: [number, number, number]) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    // Soft pink body/ears weigh most; the deeper snout and blush (r − g > 75) keep their pink.
    const d = r - g;
    const w = Math.max(0, Math.min(1, (d - 10) / 35, (105 - d) / 30)) * strength;
    const f = (lum([r, g, b]) / lum(target)) * bright;
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    return [
      clamp(r + (target[0] * f - r) * w),
      clamp(g + (target[1] * f - g) * w),
      clamp(b + (target[2] * f - b) * w),
    ];
  };

export const CUTS: Cut[] = [
  { id: 'pig_classic', sheet: ENV, box: [20, 50, 360, 300] },
  { id: 'pig_watermelon', sheet: ENV, box: [395, 30, 370, 320] },
  { id: 'pig_superhero', sheet: ENV, box: [770, 50, 370, 300] },
  { id: 'pig_thienlong', sheet: ENV, box: [1140, 30, 390, 320] },
  { id: 'pig_black', sheet: PIGS, box: cell(4, 0) },
  { id: 'pig_farmer', sheet: PIGS, box: cell(0, 1) },
  { id: 'pig_chef', sheet: PIGS, box: cell(1, 2) },
  { id: 'pig_nerd', sheet: PIGS, box: cell(2, 2) },
  { id: 'pig_spotted', sheet: PIGS, box: cell(5, 0) },
  { id: 'pig_pilot', sheet: PIGS, box: cell(4, 1) },
  { id: 'pig_pirate', sheet: PIGS, box: cell(5, 1) },
  { id: 'pig_ninja', sheet: PIGS, box: cell(0, 2) },
  { id: 'pig_robot', sheet: PIGS, box: cell(1, 3) },
  { id: 'pig_unicorn', sheet: PIGS, box: cell(2, 3) },
  // U07 species: bee and dragonling from STYLE cells; coats painted on the plain pig.
  { id: 'pig_bee', sheet: PIGS, box: cell(3, 3) },
  { id: 'pig_dragonling', sheet: PIGS, box: cell(4, 3), tint: toTeal },
  { id: 'pig_tiger', sheet: ENV, box: [20, 50, 360, 300], coat: 'tiger' },
  { id: 'pig_panda', sheet: ENV, box: [20, 50, 360, 300], coat: 'panda' },
  { id: 'pig_penguin', sheet: ENV, box: [20, 50, 360, 300], coat: 'penguin' },
  { id: 'pig_koi', sheet: ENV, box: [20, 50, 360, 300], coat: 'koi' },
  { id: 'pig_galaxy', sheet: ENV, box: [20, 50, 360, 300], coat: 'galaxy' },
  { id: 'pig_boar', sheet: ENV, box: [20, 50, 360, 300], coat: 'boar' },
  // A3 species: anatomy traits (scripts/assets/traits) over a coat on the plain pig.
  { id: 'pig_sheep', sheet: ENV, box: [20, 50, 360, 300], trait: 'sheep' },
  { id: 'pig_axolotl', sheet: ENV, box: [20, 50, 360, 300], coat: 'axolotl', trait: 'axolotl' },
  { id: 'pig_phoenix', sheet: ENV, box: [20, 50, 360, 300], coat: 'phoenix', trait: 'phoenix' },
  { id: 'pig_buffalo', sheet: ENV, box: [20, 50, 360, 300], coat: 'buffalo', trait: 'buffalo' },
  { id: 'pig_deer', sheet: ENV, box: [20, 50, 360, 300], coat: 'deer', trait: 'deer' },
  { id: 'pig_hedgehog', sheet: ENV, box: [20, 50, 360, 300], coat: 'hedgehog', trait: 'hedgehog' },
  { id: 'pig_turtle', sheet: ENV, box: [20, 50, 360, 300], coat: 'turtle', trait: 'turtle' },
  // A3 species cut whole from STYLE cells: pumpkin and sunflower pigs.
  { id: 'pig_pumpkin', sheet: PIGS, box: cell(5, 3) },
  { id: 'pig_sunflower', sheet: PIGS, box: cell(2, 1) },
  {
    id: 'pig_white',
    sheet: ENV,
    box: [20, 50, 360, 300],
    tint: recolour([252, 240, 230], 0.9, 1.18),
  },
  {
    id: 'pig_brown',
    sheet: ENV,
    box: [20, 50, 360, 300],
    tint: recolour([186, 120, 76], 0.95, 0.78),
  },
];

/** Plain pig used to fix each sheet's scale. */
const SCALE_REF: Record<string, [number, number, number, number]> = {
  [ENV]: [20, 50, 360, 300],
  [PIGS]: cell(0, 0),
};

function load(path: string): Img {
  const p = PNG.sync.read(readFileSync(path));
  return { w: p.width, h: p.height, d: p.data };
}

function crop(src: Img, [x, y, w, h]: [number, number, number, number]): Img {
  const d = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++)
    src.d.copy(d, r * w * 4, ((y + r) * src.w + x) * 4, ((y + r) * src.w + x + w) * 4);
  return { w, h, d };
}

/** Foreground mask: opaque pixels, largest blob only, enclosed holes filled. */
function mask(im: Img): Uint8Array {
  const { w, h, d } = im;
  const n = w * h;
  const bg = new Uint8Array(n);
  for (let i = 0; i < n; i++) bg[i] = d[i * 4 + 3]! > SOLID ? 0 : 1;
  // Largest 4-connected foreground blob.
  const label = new Int32Array(n).fill(-1);
  let best = -1,
    bestSize = 0;
  for (let s = 0; s < n; s++) {
    if (bg[s] || label[s] !== -1) continue;
    let size = 0;
    const q = [s];
    label[s] = s;
    while (q.length) {
      const i = q.pop()!;
      size++;
      const x = i % w;
      for (const j of [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        i >= w ? i - w : -1,
        i < n - w ? i + w : -1,
      ]) {
        if (j >= 0 && !bg[j] && label[j] === -1) {
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
  const fg = new Uint8Array(n);
  for (let i = 0; i < n; i++) fg[i] = label[i] === best ? 1 : 0;
  // Fill holes: background pockets not connected to the border become foreground.
  const outside = new Uint8Array(n);
  const q: number[] = [];
  const seed = (i: number) => {
    if (!fg[i] && !outside[i]) {
      outside[i] = 1;
      q.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (q.length) {
    const i = q.pop()!;
    const x = i % w;
    for (const j of [
      x > 0 ? i - 1 : -1,
      x < w - 1 ? i + 1 : -1,
      i >= w ? i - w : -1,
      i < n - w ? i + w : -1,
    ]) {
      if (j >= 0) seed(j);
    }
  }
  for (let i = 0; i < n; i++) if (!outside[i]) fg[i] = 1;
  return fg;
}

/** RGBA cut-out with a 1 px feathered edge. */
function cutout(im: Img, fg: Uint8Array, tint?: Cut['tint']): Img {
  const { w, h } = im;
  const d = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let sum = 0,
        cnt = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx,
            yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) {
            sum += fg[yy * w + xx]!;
            cnt++;
          }
        }
      const painted = im.d[i * 4 + 3]!;
      const a = fg[i]
        ? painted > 240
          ? 255
          : Math.round(255 * Math.min(1, (sum / cnt) * 1.4))
        : 0;
      let [r, g, b] = [im.d[i * 4]!, im.d[i * 4 + 1]!, im.d[i * 4 + 2]!];
      if (tint && a > 0) [r, g, b] = tint(r, g, b);
      d[i * 4] = Math.round(r);
      d[i * 4 + 1] = Math.round(g);
      d[i * 4 + 2] = Math.round(b);
      d[i * 4 + 3] = a;
    }
  }
  return { w, h, d };
}

function bbox(im: Img) {
  let x0 = im.w,
    y0 = im.h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++)
      if (im.d[(y * im.w + x) * 4 + 3]! > 16) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Bilinear resample (premultiplied) of `im` by `s`, pasted with its bbox at (ox, oy) on a 512² canvas. */
function placeScaled(im: Img, s: number, feetY: number): Img {
  const b = bbox(im);
  const out: Img = { w: SIZE, h: SIZE, d: Buffer.alloc(SIZE * SIZE * 4) };
  const W = b.w * s,
    H = b.h * s;
  const ox = Math.round((SIZE - W) / 2),
    oy = Math.round(feetY - H);
  const sample = (fx: number, fy: number, c: number) => {
    const x = Math.max(0, Math.min(im.w - 1, fx)),
      y = Math.max(0, Math.min(im.h - 1, fy));
    const x0 = Math.floor(x),
      y0 = Math.floor(y),
      x1 = Math.min(im.w - 1, x0 + 1),
      y1 = Math.min(im.h - 1, y0 + 1);
    const tx = x - x0,
      ty = y - y0;
    const at = (xx: number, yy: number) => {
      const i = (yy * im.w + xx) * 4;
      return c === 3 ? im.d[i + 3]! : (im.d[i + c]! * im.d[i + 3]!) / 255;
    };
    return (
      (at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) +
      (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty
    );
  };
  for (let y = Math.max(0, oy); y < Math.min(SIZE, oy + Math.ceil(H)); y++) {
    for (let x = Math.max(0, ox); x < Math.min(SIZE, ox + Math.ceil(W)); x++) {
      const fx = b.x + (x - ox + 0.5) / s - 0.5,
        fy = b.y + (y - oy + 0.5) / s - 0.5;
      const a = sample(fx, fy, 3);
      if (a < 1) continue;
      const o = (y * SIZE + x) * 4;
      for (let c = 0; c < 3; c++) out.d[o + c] = Math.round((sample(fx, fy, c) * 255) / a);
      out.d[o + 3] = Math.round(a);
    }
  }
  return out;
}

function main() {
  mkdirSync(INBOX, { recursive: true });
  const sheets = new Map<string, Img>();
  const sheet = (p: string) => sheets.get(p) ?? (sheets.set(p, load(p)), sheets.get(p)!);
  const scale = new Map<string, number>();
  for (const [p, box] of Object.entries(SCALE_REF)) {
    const im = crop(sheet(p), box);
    scale.set(p, CLASSIC_HEIGHT / bbox(cutout(im, mask(im))).h);
  }
  const only = new Set(process.argv.slice(2));
  const cuts = CUTS.filter((c) => only.size === 0 || only.has(c.id));
  for (const c of cuts) {
    const im = crop(sheet(c.sheet), c.box);
    const pig = cutout(im, mask(im), c.tint);
    if (c.coat) COATS[c.coat]!({ orig: im, out: pig, bbox: bbox(pig) });
    const placed = placeScaled(pig, scale.get(c.sheet)!, FEET);
    const out = c.trait ? applyTrait(placed, TRAITS[c.trait]!) : placed;
    const png = new PNG({ width: SIZE, height: SIZE });
    out.d.copy(png.data);
    writeFileSync(join(INBOX, `${c.id}.png`), PNG.sync.write(png));
    console.log(`${c.id}: ${bbox(pig).w}x${bbox(pig).h} → x${scale.get(c.sheet)!.toFixed(2)}`);
  }
  let text = readFileSync(MANIFEST, 'utf8');
  const pigs = (JSON.parse(text) as { pigs: { id: string; sleepAsset?: string | null }[] }).pigs;
  for (const c of cuts) {
    const sleep = pigs.find((p) => p.id === c.id)?.sleepAsset;
    if (!sleep) continue;
    text = patchRowText(text, c.id, { sleepAsset: null });
    if (existsSync(join(ASSETS, sleep))) rmSync(join(ASSETS, sleep));
    rmSync(join(INBOX, `${c.id}_sleep.png`), { force: true });
  }
  writeFileSync(MANIFEST, text);
}

main();
