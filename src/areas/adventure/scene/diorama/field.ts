// The diorama's fields (docs/research/ADVENTURE_MAP_VFX_LESSONS.md §10–11, docs/maps/MAP_SCENE_STANDARD.md): what the ground is at
// any point of an area, read from the same tile grid the game walks on (`maps.json` terrain + elevation), so what is drawn always
// matches the data. Tile edges are bent with noise (at most WARP_MAX tile) and sharpened, so borders curve instead of stepping tile by
// tile. The blocked tiles come from the game's own `blockedTiles` (props, things, decor, closed gates too), not from the characters.
// Pure (no Three, no DOM).
import type { AreaMap } from '../../logic/config/content';
import { blockedTiles, type Thing } from '../../logic/maps';
import { K, MARGIN, type Kind } from './kinds';
import { noise2 } from './noise';
import { raiseAroundHighGround, stairHeight, stairsOf, type Stair } from './plateau';

export { K, MARGIN };


export interface Grid {
  cols: number;
  rows: number;
  /** Kind and height (world units) per tile of the grid grown by MARGIN on every side. */
  kind: Uint8Array;
  height: Float32Array;
  W: number;
  H: number;
  /** Per tile of the area itself (cols × rows): blocked for the walker (the game's `blockedTiles`), and waterfall tiles (`w`). */
  blocked: Uint8Array;
  fall: Uint8Array;
  /** The stone steps where a path climbs onto high ground (drawn and stood on as steps, not a slope). */
  stairs: Stair[];
}

/** Height of one elevation level, world units (a tile is 1): a level reads as a clear step up, two as a plateau. */
const LEVEL = 1.5;
const WATER_BED = -0.45;

const kindOf = (c: string): Kind =>
  c === ',' || c === 's' ? K.path : c === '~' || c === 'w' ? K.water : c === '=' ? K.bridge : c === 'F' ? K.rock : c === '^' ? K.high : c === '#' ? K.forest : c === 'c' ? K.moss : K.grass;

/** The grid of an area, with `opened` gates open and `closed` more blocking rectangles (as in `blockedTiles`). */
export function gridOf(map: AreaMap, opened: ReadonlySet<string> = new Set(), closed: readonly Pick<Thing, 'x' | 'y' | 'w' | 'h'>[] = []): Grid {
  const W = map.cols + MARGIN * 2;
  const H = map.rows + MARGIN * 2;
  const kind = new Uint8Array(W * H).fill(K.forest);
  const height = new Float32Array(W * H);
  const elev = map.scene?.elevation;
  const fall = new Uint8Array(map.cols * map.rows);
  for (let y = 0; y < map.rows; y += 1)
    for (let x = 0; x < map.cols; x += 1) {
      const k = kindOf(map.terrain[y]?.[x] ?? '#');
      const i = (y + MARGIN) * W + x + MARGIN;
      kind[i] = k;
      if (map.terrain[y]?.[x] === 'w') fall[y * map.cols + x] = 1;
      const lv = Number(elev?.[y]?.[x] ?? 0) * LEVEL;
      height[i] = k === K.water || k === K.bridge ? WATER_BED : k === K.rock ? Math.max(lv, LEVEL * 1.6) : lv;
    }
  const ramps = raiseAroundHighGround(map, kind, height, W);
  const stairs = stairsOf(map, ramps);
  // A path that only runs alongside the high ground stays level: the drop shows as a cliff face, not a slope.
  for (const r of ramps) if (!stairs.some((s) => r.x >= s.x0 && r.x < s.x1 && r.y >= s.z0 && r.y < s.z1)) height[(r.y + MARGIN) * W + r.x + MARGIN] = 0;
  // The world beyond: forest rising a little, so the edge reads as woods, not a wall.
  for (let y = 0; y < H; y += 1)
    for (let x = 0; x < W; x += 1) {
      const out = x < MARGIN || y < MARGIN || x >= W - MARGIN || y >= H - MARGIN;
      if (out) height[y * W + x] = 0.15 + noise2(x * 0.3, y * 0.3, 5) * 0.5;
    }
  return {
    cols: map.cols,
    rows: map.rows,
    kind,
    height,
    W,
    H,
    blocked: Uint8Array.from(blockedTiles(map, opened, closed), (b) => (b ? 1 : 0)),
    fall,
    stairs,
  };
}

const clampI = (v: number, n: number) => (v < 0 ? 0 : v >= n ? n - 1 : v);
/** Samples per tile of the smooth fields (the ground mesh uses the same spacing). */
export const RES = 4;

/** Furthest a point is bent (tiles) at a walkable ↔ blocked boundary: the drawn 0.5 edge stays within this (and the blur's corner rounding) of the tile boundary. */
export const WARP_MAX = 0.12;

/** Furthest a point is bent between two WALKABLE materials (grass / path / moss / the shore's sand): free, soft and organic like G0. */
export const SOFT_WARP = 0.45;

/** The point after the noise bend (area tile coordinates in, out). */
export function warp(u: number, v: number): [number, number] {
  const a = WARP_MAX * 2;
  return [u + (noise2(u * 0.45, v * 0.45, 11) - 0.5) * a, v + (noise2(u * 0.45, v * 0.45, 23) - 0.5) * a];
}

/** The wide bend of the walkable materials (never used where the walker is blocked). */
export function softWarp(u: number, v: number): [number, number] {
  const a = SOFT_WARP * 2;
  return [u + (noise2(u * 0.45, v * 0.45, 31) - 0.5) * a, v + (noise2(u * 0.45, v * 0.45, 43) - 0.5) * a];
}

/** Separable gaussian blur of a (w × h) field, `sigma` in samples. */
function blur(f: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const r = Math.ceil(sigma * 2.5);
  const k = Array.from({ length: r * 2 + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const sum = k.reduce((a, b) => a + b, 0);
  const tmp = new Float32Array(f.length);
  const out = new Float32Array(f.length);
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      let a = 0;
      for (let i = -r; i <= r; i += 1) a += f[y * w + clampI(x + i, w)]! * k[i + r]!;
      tmp[y * w + x] = a / sum;
    }
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      let a = 0;
      for (let i = -r; i <= r; i += 1) a += tmp[clampI(y + i, h) * w + x]! * k[i + r]!;
      out[y * w + x] = a / sum;
    }
  return out;
}

/** Smooth fields on the vertices of the ground mesh: kind shares (path, forest, water, rock) and height. */
interface Fields {
  w: number;
  h: number;
  ch: Float32Array[];
  height: Float32Array;
}
const FIELDS = new WeakMap<Grid, Fields>();

function fields(g: Grid): Fields {
  const have = FIELDS.get(g);
  if (have) return have;
  const w = g.W * RES + 1;
  const h = g.H * RES + 1;
  // Blocked boundaries (woods, water, rock): a small bend and a narrow blur, so the edge is rounded but stays at the tile's boundary.
  // Walkable materials (path, moss): G0's wide bend and blur, so grass melts into dirt and moss like painted ground.
  const field = () => new Float32Array(w * h);
  const [forest, water, rock, path, moss] = [field(), field(), field(), field(), field()] as [Float32Array, Float32Array, Float32Array, Float32Array, Float32Array];
  const hgt = new Float32Array(w * h);
  for (let j = 0; j < h; j += 1)
    for (let i = 0; i < w; i += 1) {
      const [wu, wv] = warp(i / RES - MARGIN, j / RES - MARGIN);
      const [su, sv] = softWarp(i / RES - MARGIN, j / RES - MARGIN);
      const t = clampI(Math.floor(wv) + MARGIN, g.H) * g.W + clampI(Math.floor(wu) + MARGIN, g.W);
      const ts = clampI(Math.floor(sv) + MARGIN, g.H) * g.W + clampI(Math.floor(su) + MARGIN, g.W);
      const k = g.kind[t]!;
      const ks = g.kind[ts]!;
      const o = j * w + i;
      forest[o] = k === K.forest ? 1 : 0;
      water[o] = k === K.water ? 1 : k === K.bridge ? 0.7 : 0;
      rock[o] = k === K.rock ? 1 : 0;
      path[o] = ks === K.path ? 1 : ks === K.bridge ? 0.3 : 0;
      moss[o] = ks === K.moss ? 0.3 : 0;
      hgt[o] = g.height[t]!;
    }
  const strict = [forest, water, rock].map((c) => blur(c, w, h, RES * 0.3));
  const soft = [path, moss].map((c) => blur(c, w, h, RES * 0.55));
  // Moss floor (walkable) shades like a faint wood but never counts as blocked: its share stays under 0.5.
  const mossShare = soft[1]!.map((v, o) => Math.max(v, strict[0]![o]!));
  const height = blur(hgt, w, h, RES * 0.3);
  // Under a flight of steps the ground lies just below the treads, so the blur of the high ground beside it never rises over them.
  for (const s of g.stairs)
    for (let j = 0; j < h; j += 1)
      for (let i = 0; i < w; i += 1) {
        const [u, v] = [i / RES - MARGIN, j / RES - MARGIN];
        const here = stairHeight(s, u, v);
        if (here === null) continue;
        // The lower of the treads a quarter tile either way, so the ground between two sample rows never rises over a tread.
        const lo = Math.min(here, stairHeight(s, u + s.dx * 0.26, v + s.dz * 0.26) ?? here, stairHeight(s, u - s.dx * 0.26, v - s.dz * 0.26) ?? here);
        if (height[j * w + i]! > lo - 0.06) height[j * w + i] = lo - 0.06;
      }
  const f: Fields = {
    w,
    h,
    ch: [soft[0]!, mossShare, strict[1]!, strict[2]!],
    height,
  };
  FIELDS.set(g, f);
  return f;
}

/** Bilinear lookup of a field at area tile coords. */
function sample(f: Fields, arr: Float32Array, u: number, v: number): number {
  const fx = Math.min(f.w - 1.001, Math.max(0, (u + MARGIN) * RES));
  const fy = Math.min(f.h - 1.001, Math.max(0, (v + MARGIN) * RES));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const at = (x: number, y: number) => arr[y * f.w + x]!;
  return (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
}

/** Ground height at (u, v), world units. */
export function heightAt(g: Grid, u: number, v: number): number {
  const f = fields(g);
  return sample(f, f.height, u, v);
}

/** Share of each kind at (u, v): path, forest floor, water (river bed / bank), rock. Grass is what is left. */
export function weightsAt(g: Grid, u: number, v: number): [number, number, number, number] {
  const f = fields(g);
  return [sample(f, f.ch[0]!, u, v), sample(f, f.ch[1]!, u, v), sample(f, f.ch[2]!, u, v), sample(f, f.ch[3]!, u, v)];
}

/** Kind of the tile at area tile (x, y) (forest outside). */
export const kindAt = (g: Grid, x: number, y: number): number => g.kind[clampI(y + MARGIN, g.H) * g.W + clampI(x + MARGIN, g.W)]!;

/**
 * Signed distance to the shore, in tiles, `res` samples per tile over the area itself: positive over the water, negative on land.
 * Two chamfer passes each way on the bent water share, so the drawn river follows the drawn banks and its edge is a smooth contour.
 */
export function waterDistance(g: Grid, res: number): { data: Float32Array; share: Float32Array; w: number; h: number } {
  const w = g.cols * res;
  const h = g.rows * res;
  const wet = new Uint8Array(w * h);
  const share = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      share[y * w + x] = weightsAt(g, (x + 0.5) / res, (y + 0.5) / res)[2];
      wet[y * w + x] = share[y * w + x]! > 0.5 ? 1 : 0;
    }
  const into = (inside: 1 | 0) => {
    const d = new Float32Array(w * h);
    for (let i = 0; i < d.length; i += 1) d[i] = wet[i] === inside ? 1e4 : 0;
    const step = 1 / res;
    const diag = step * Math.SQRT2;
    const relax = (x: number, y: number, dx: number, dy: number, cost: number) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const c = d[ny * w + nx]! + cost;
      if (c < d[y * w + x]!) d[y * w + x] = c;
    };
    for (let y = 0; y < h; y += 1)
      for (let x = 0; x < w; x += 1) {
        relax(x, y, -1, 0, step);
        relax(x, y, 0, -1, step);
        relax(x, y, -1, -1, diag);
        relax(x, y, 1, -1, diag);
      }
    for (let y = h - 1; y >= 0; y -= 1)
      for (let x = w - 1; x >= 0; x -= 1) {
        relax(x, y, 1, 0, step);
        relax(x, y, 0, 1, step);
        relax(x, y, 1, 1, diag);
        relax(x, y, -1, 1, diag);
      }
    return d;
  };
  const inWater = into(1);
  const onLand = into(0);
  const data = new Float32Array(w * h);
  // Half a sample each side, so the zero crossing sits between a wet and a dry sample.
  for (let i = 0; i < data.length; i += 1) data[i] = Math.max(-2, Math.min(4, wet[i] ? inWater[i]! - 0.5 / res : -(onLand[i]! - 0.5 / res)));
  return { data, share, w, h };
}
