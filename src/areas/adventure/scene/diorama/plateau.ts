// High ground of the diorama: the rock mass round a plateau, the path ramps that leave it, and the flights of stone steps those ramps
// become (where a path climbs onto the plateau, the walker's feet and the drawn treads agree on the height of every step).
// Pure (no Three, no DOM).
import type { AreaMap } from '../../logic/config/content';
import { K, MARGIN } from './kinds';

/** A flight of steps: its footprint (tile coords), the way it climbs, and the height of the high ground at its head. */
export interface Stair {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  /** Unit vector (x, z) from the foot of the flight to its head. */
  dx: number;
  dz: number;
  top: number;
}


/** Depth of one tread of a flight of steps, tiles. */
export const TREAD = 0.5;

/** Where on a flight of steps (tile coords) the foot stands: height of the tread under it, null outside the flight. */
export function stairHeight(s: Stair, x: number, z: number): number | null {
  if (x < s.x0 || x >= s.x1 || z < s.z0 || z >= s.z1) return null;
  const len = Math.abs(s.dx) * (s.x1 - s.x0) + Math.abs(s.dz) * (s.z1 - s.z0);
  const foot = s.dx + s.dz > 0 ? (s.dx ? s.x0 : s.z0) : s.dx ? s.x1 : s.z1;
  const along = s.dx ? (x - foot) * s.dx : (z - foot) * s.dz;
  const n = Math.max(1, Math.round(len / TREAD));
  return (s.top * Math.min(n, Math.floor(along / TREAD) + 1)) / n;
}

/**
 * Today's grids mark a plateau's cliffs as plain blocked tiles: around high ground, those become rock at the plateau's height (a cliff
 * mass with a face, not a wood that would hide the plateau), and the paths that leave it ramp down over a few tiles (stairs).
 */
export function raiseAroundHighGround(map: AreaMap, kind: Uint8Array, height: Float32Array, W: number): Ramp[] {
  const n = map.cols * map.rows;
  const dist = new Int16Array(n).fill(99);
  const top = new Float32Array(n);
  const queue: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = (Math.floor(i / map.cols) + MARGIN) * W + (i % map.cols) + MARGIN;
    if (kind[t] === K.high && height[t]! > 0) {
      dist[i] = 0;
      top[i] = height[t]!;
      queue.push(i);
    }
  }
  for (let q = 0; q < queue.length; q += 1) {
    const i = queue[q]!;
    const x = i % map.cols;
    const y = Math.floor(i / map.cols);
    for (let dy = -1; dy <= 1; dy += 1)
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= map.cols || ny >= map.rows) continue;
        const j = ny * map.cols + nx;
        if (dist[j]! <= dist[i]! + 1) continue;
        dist[j] = dist[i]! + 1;
        top[j] = top[i]!;
        if (dist[j]! < 5) queue.push(j);
      }
  }
  const ramps: Ramp[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = (Math.floor(i / map.cols) + MARGIN) * W + (i % map.cols) + MARGIN;
    const d = dist[i]!;
    if ((kind[t] === K.forest || kind[t] === K.rock) && d <= 3) {
      kind[t] = K.rock;
      height[t] = top[i]!;
    } else if (kind[t] === K.path && d <= 4 && height[t] === 0) {
      height[t] = top[i]! * Math.max(0, 1 - d / 4.5);
      ramps.push({ x: i % map.cols, y: Math.floor(i / map.cols), top: top[i]! });
    }
  }
  return ramps;
}

export interface Ramp {
  x: number;
  y: number;
  top: number;
}

const count = (a: number, b: number, f: (i: number) => boolean) => {
  let n = 0;
  for (let i = a; i <= b; i += 1) if (f(i)) n += 1;
  return n;
};

/**
 * The flights of steps: each connected run of ramp tiles (a path climbing onto high ground) becomes one straight flight, climbing
 * toward the side where the high ground lies. A run 6 tiles wide or more, or without high ground at its head, stays a plain slope.
 */
export function stairsOf(map: AreaMap, ramps: readonly Ramp[]): Stair[] {
  const at = new Map(ramps.map((r) => [r.y * map.cols + r.x, r]));
  const seen = new Set<number>();
  const out: Stair[] = [];
  const high = (x: number, y: number) => map.terrain[y]?.[x] === '^';
  for (const r of ramps) {
    if (seen.has(r.y * map.cols + r.x)) continue;
    const todo = [r];
    seen.add(r.y * map.cols + r.x);
    let [x0, y0, x1, y1, top] = [r.x, r.y, r.x, r.y, r.top];
    let cells = 0;
    while (todo.length) {
      const c = todo.pop()!;
      cells += 1;
      [x0, y0, x1, y1, top] = [Math.min(x0, c.x), Math.min(y0, c.y), Math.max(x1, c.x), Math.max(y1, c.y), Math.max(top, c.top)];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const k = (c.y + dy) * map.cols + c.x + dx;
        const n = at.get(k);
        if (n && !seen.has(k)) {
          seen.add(k);
          todo.push(n);
        }
      }
    }
    // The head is the side of the run's box that touches the most high-ground tiles.
    const head = [
      { dx: 0, dz: -1, n: count(x0, x1, (x) => high(x, y0 - 1)) },
      { dx: 0, dz: 1, n: count(x0, x1, (x) => high(x, y1 + 1)) },
      { dx: -1, dz: 0, n: count(y0, y1, (y) => high(x0 - 1, y)) },
      { dx: 1, dz: 0, n: count(y0, y1, (y) => high(x1 + 1, y)) },
    ].sort((a, b) => b.n - a.n)[0]!;
    const [along, wide] = head.dx ? [x1 - x0 + 1, y1 - y0 + 1] : [y1 - y0 + 1, x1 - x0 + 1];
    // A real flight: short, narrow and (nearly) filling its box; a path that only runs alongside the high ground is not one.
    if (head.n === 0 || top <= 0 || along > 5 || wide > 5 || cells < 0.6 * along * wide) continue;
    out.push({ x0, z0: y0, x1: x1 + 1, z1: y1 + 1, dx: head.dx, dz: head.dz, top });
  }
  return out;
}

/**
 * Pits: a patch of level ground (elevation 0) that high ground (elevation above 0) closes in on every side, such as a clearing cut
 * into a plateau. Drawn as it is, it would be a hole with cliff walls; it is the plateau's own floor, so it takes the height of the
 * lowest wall round it. Returns the level of each such tile (index in the area's grid). Drawing only: the walkable tiles are unchanged.
 */
export function pitLevels(map: AreaMap): Map<number, number> {
  const elev = map.scene?.elevation;
  const level = (x: number, y: number) => Number(elev?.[y]?.[x] ?? 0);
  const walk = (x: number, y: number) => ['.', ',', 'c', 's'].includes(map.terrain[y]?.[x] ?? '#');
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < map.cols && y < map.rows;
  const out = new Map<number, number>();
  const seen = new Set<number>();
  for (let y = 0; y < map.rows; y += 1)
    for (let x = 0; x < map.cols; x += 1) {
      if (seen.has(y * map.cols + x) || level(x, y) !== 0 || !walk(x, y)) continue;
      const cells: number[] = [y * map.cols + x];
      seen.add(cells[0]!);
      let wall = Infinity;
      let closed = true;
      for (let q = 0; q < cells.length; q += 1) {
        const [cx, cy] = [cells[q]! % map.cols, Math.floor(cells[q]! / map.cols)];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const [nx, ny] = [cx + dx, cy + dy];
          const k = ny * map.cols + nx;
          if (!inside(nx, ny)) closed = false;
          else if (level(nx, ny) === 0 && walk(nx, ny)) {
            if (!seen.has(k)) {
              seen.add(k);
              cells.push(k);
            }
          } else if (level(nx, ny) > 0) wall = Math.min(wall, level(nx, ny));
          else closed = false;
        }
      }
      if (closed && wall < Infinity && cells.length < 40) for (const c of cells) out.set(c, wall);
    }
  return out;
}
