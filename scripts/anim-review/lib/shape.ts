// Does the main effect change shape, or is it a still picture moved / scaled? Measured from frames, with no help from the game:
// each frame's change against the first frame becomes a coarse mask, the biggest blob of it is cut to its own box and scaled to a
// fixed grid (which removes moving and scaling), and two following masks are compared (IoU). A still picture tweened across the
// screen keeps the same normalised mask (IoU near 1); a wave that rises, curls and breaks does not. A hint for STATIC_SHAPE, never a score.
import type { PNG } from 'pngjs';

export interface ShapeOptions {
  /** Side of a mask cell in px (coarse cells ignore noise and keep it fast). */
  cell: number;
  /** A cell is "changed" when the mean colour difference of its pixels is above this (sum of RGB differences). */
  threshold: number;
  /** Blobs smaller than this many cells are ignored (a spark, a number). */
  minCells: number;
  /** Side of the normalised grid. */
  grid: number;
}
export const SHAPE_DEFAULTS: ShapeOptions = { cell: 8, threshold: 40, minCells: 12, grid: 24 };

export interface ShapeResult {
  /** Pairs of following frames that both had a big enough blob. */
  samples: number;
  /** Median IoU of the normalised masks of those pairs (1 = the same shape every frame). */
  medianIoU: number | null;
}

/** The coarse change mask of `img` against `base`: one boolean per cell, row by row. */
export function changeMask(base: PNG, img: PNG, o: ShapeOptions = SHAPE_DEFAULTS): { w: number; h: number; on: Uint8Array } {
  const w = Math.floor(img.width / o.cell);
  const h = Math.floor(img.height / o.cell);
  const on = new Uint8Array(w * h);
  for (let cy = 0; cy < h; cy += 1)
    for (let cx = 0; cx < w; cx += 1) {
      let sum = 0;
      for (let y = cy * o.cell; y < (cy + 1) * o.cell; y += 2)
        for (let x = cx * o.cell; x < (cx + 1) * o.cell; x += 2) {
          const i = (y * img.width + x) * 4;
          sum += Math.abs(base.data[i]! - img.data[i]!) + Math.abs(base.data[i + 1]! - img.data[i + 1]!) + Math.abs(base.data[i + 2]! - img.data[i + 2]!);
        }
      if (sum / ((o.cell / 2) * (o.cell / 2)) > o.threshold) on[cy * w + cx] = 1;
    }
  return { w, h, on };
}

/** The biggest 4-connected blob of a mask, as a list of cell indices. */
export function biggestBlob(m: { w: number; h: number; on: Uint8Array }): number[] {
  const seen = new Uint8Array(m.on.length);
  let best: number[] = [];
  for (let s = 0; s < m.on.length; s += 1) {
    if (!m.on[s] || seen[s]) continue;
    const blob: number[] = [];
    const stack = [s];
    seen[s] = 1;
    while (stack.length > 0) {
      const i = stack.pop()!;
      blob.push(i);
      const x = i % m.w;
      for (const j of [i - m.w, i + m.w, x > 0 ? i - 1 : -1, x < m.w - 1 ? i + 1 : -1])
        if (j >= 0 && j < m.on.length && m.on[j] && !seen[j]) {
          seen[j] = 1;
          stack.push(j);
        }
    }
    if (blob.length > best.length) best = blob;
  }
  return best;
}

/** A blob cut to its box and resampled to `grid`×`grid` (nearest cell): position and scale removed. */
export function normalise(blob: readonly number[], w: number, grid: number): Uint8Array {
  const xs = blob.map((i) => i % w);
  const ys = blob.map((i) => Math.floor(i / w));
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const bw = Math.max(...xs) - x0 + 1;
  const bh = Math.max(...ys) - y0 + 1;
  const set = new Set(blob);
  const out = new Uint8Array(grid * grid);
  for (let gy = 0; gy < grid; gy += 1)
    for (let gx = 0; gx < grid; gx += 1) {
      const x = x0 + Math.floor(((gx + 0.5) / grid) * bw);
      const y = y0 + Math.floor(((gy + 0.5) / grid) * bh);
      if (set.has(y * w + x)) out[gy * grid + gx] = 1;
    }
  return out;
}

export function iou(a: Uint8Array, b: Uint8Array): number {
  let and = 0;
  let or = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] && b[i]) and += 1;
    if (a[i] || b[i]) or += 1;
  }
  return or === 0 ? 1 : and / or;
}

/** The shape measure over `frames` (in time order) against `base` (the clean first frame). */
export function shapeChange(base: PNG, frames: readonly PNG[], o: ShapeOptions = SHAPE_DEFAULTS): ShapeResult {
  const masks: (Uint8Array | null)[] = frames.map((f) => {
    const m = changeMask(base, f, o);
    const blob = biggestBlob(m);
    return blob.length >= o.minCells ? normalise(blob, m.w, o.grid) : null;
  });
  const ious: number[] = [];
  for (let i = 1; i < masks.length; i += 1) if (masks[i - 1] && masks[i]) ious.push(iou(masks[i - 1]!, masks[i]!));
  if (ious.length === 0) return { samples: 0, medianIoU: null };
  const s = [...ious].sort((a, b) => a - b);
  const mid = s.length / 2;
  const median = s.length % 2 === 1 ? s[Math.floor(mid)]! : (s[mid - 1]! + s[mid]!) / 2;
  return { samples: ious.length, medianIoU: Number(median.toFixed(3)) };
}
