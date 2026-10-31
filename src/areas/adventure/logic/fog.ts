// The ground seen on an area (decision 045, the fog of the area map): chunks of 4 × 4 tiles, seen once the party passes within a few
// tiles of them, kept for good as a hex bitmask per area (`slice.explored`). A walk is saved as a straight line between two saved
// spots, so every chunk along it counts. Pure.
import type { Vec } from '../../../systems/character';
import type { AreaMap } from './config/content';

/** Tiles per chunk side, and how far around the party the ground is seen (tiles). */
export const FOG_CHUNK = 4;
export const FOG_RADIUS = 7;

type Grid = Pick<AreaMap, 'cols' | 'rows' | 'tile'>;

const dims = (map: Grid) => ({ cw: Math.ceil(map.cols / FOG_CHUNK), ch: Math.ceil(map.rows / FOG_CHUNK) });

function decode(map: Grid, hex: string): boolean[] {
  const { cw, ch } = dims(map);
  const bits = new Array<boolean>(cw * ch).fill(false);
  for (let i = 0; i < bits.length; i += 1) {
    const nibble = parseInt(hex[i >> 2] ?? '0', 16) || 0;
    bits[i] = ((nibble >> (3 - (i & 3))) & 1) === 1;
  }
  return bits;
}

function encode(bits: readonly boolean[]): string {
  let out = '';
  for (let i = 0; i < bits.length; i += 4) out += ((bits[i] ? 8 : 0) | (bits[i + 1] ? 4 : 0) | (bits[i + 2] ? 2 : 0) | (bits[i + 3] ? 1 : 0)).toString(16);
  return out;
}

function mark(map: Grid, bits: boolean[], p: Vec) {
  const { cw, ch } = dims(map);
  const tx = p.x / map.tile;
  const ty = p.y / map.tile;
  const c0 = Math.max(0, Math.floor((tx - FOG_RADIUS) / FOG_CHUNK));
  const c1 = Math.min(cw - 1, Math.floor((tx + FOG_RADIUS) / FOG_CHUNK));
  const r0 = Math.max(0, Math.floor((ty - FOG_RADIUS) / FOG_CHUNK));
  const r1 = Math.min(ch - 1, Math.floor((ty + FOG_RADIUS) / FOG_CHUNK));
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) {
      // The nearest point of the chunk within the radius.
      const nx = Math.max(c * FOG_CHUNK, Math.min(tx, (c + 1) * FOG_CHUNK));
      const ny = Math.max(r * FOG_CHUNK, Math.min(ty, (r + 1) * FOG_CHUNK));
      if (Math.hypot(nx - tx, ny - ty) <= FOG_RADIUS) bits[r * cw + c] = true;
    }
  }
}

/** The mask with the ground seen along a walk from `from` to `to` (design px) added. */
export function revealWalk(map: Grid, hex: string, from: Vec, to: Vec): string {
  const bits = decode(map, hex);
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / map.tile));
  for (let i = 0; i <= steps; i += 1) mark(map, bits, { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps });
  return encode(bits);
}

/** Has the tile been seen. */
export function tileSeen(map: Grid, hex: string, x: number, y: number): boolean {
  const { cw } = dims(map);
  const i = Math.floor(y / FOG_CHUNK) * cw + Math.floor(x / FOG_CHUNK);
  const nibble = parseInt(hex[i >> 2] ?? '0', 16) || 0;
  return ((nibble >> (3 - (i & 3))) & 1) === 1;
}
