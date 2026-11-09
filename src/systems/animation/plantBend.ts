// A plant bending in a breeze, drawn as rows of its picture stacked on a curved stem: the soil mound at the bottom never moves,
// the stem curves more toward the top, the top (a bloom) turns and moves with the stem without bending, and trails the stem's
// sway a little (follow-through). Needs no data per picture. Pure; the Phaser drawing (a vertical Rope) is src/ui/world/bentPlant.ts.

export interface BendShape {
  /** Share of the picture's height at the bottom that never moves (the soil mound). */
  root: number;
  /** Share of the height from which the top stays rigid: it turns and moves with the stem, never bends. */
  stiff: number;
  /** How far the top trails the stem: radians of sway phase from the root to `stiff`. */
  lag: number;
}

/** The breeze over a field of plants, as the scene configs give it. */
export interface Breeze {
  /** Each plant's sway period lies in this range (ms). */
  periodMs: readonly number[];
  /** The slow gust that stirs every plant together: its period (ms) and how much it adds or takes off (share of the sway). */
  gustMs: number;
  gust: number;
}

/** Plant `k`'s sway phase at `time` (its own period and phase: never two neighbours in step) and the gust factor around 1. */
export function breezeAt(time: number, k: number, b: Breeze): { phase: number; gust: number } {
  const period = b.periodMs[0]! + ((k * 0.618) % 1) * (b.periodMs[1]! - b.periodMs[0]!);
  return { phase: (time / period) * Math.PI * 2 + k * 1.7, gust: 1 + Math.sin((time / b.gustMs) * Math.PI * 2) * b.gust };
}

/** The stem's lean (radians, + to the right) at height share `s` (0 bottom, 1 top), for a top lean `amp` at sway phase `phase`. */
export function stemLean(s: number, amp: number, phase: number, shape: BendShape): number {
  const u = Math.min(Math.max((s - shape.root) / (shape.stiff - shape.root), 0), 1);
  return amp * (2 * u - u * u) * Math.sin(phase - shape.lag * u);
}

/**
 * The vertices of a picture `width` × `height` bent on its stem, as `rows` pairs from top to bottom — right edge then left edge —
 * in the picture's px with (0, 0) at the middle of its bottom edge (the vertex order of a vertical Phaser Rope). The stem keeps its
 * length: each row stands on the one below it, along the mean lean of the two. With `amp` 0 the rows are the flat picture.
 */
export function bendRows(out: Float32Array, rows: number, width: number, height: number, amp: number, phase: number, shape: BendShape): Float32Array {
  const half = width / 2;
  const step = height / (rows - 1);
  let x = 0;
  let y = 0;
  let below = 0;
  for (let k = rows - 1; k >= 0; k--) {
    const lean = stemLean(1 - k / (rows - 1), amp, phase, shape);
    if (k < rows - 1) {
      const mid = (lean + below) / 2;
      x += Math.sin(mid) * step;
      y -= Math.cos(mid) * step;
    }
    below = lean;
    const c = Math.cos(lean) * half;
    const d = Math.sin(lean) * half;
    out[k * 4] = x + c;
    out[k * 4 + 1] = y + d;
    out[k * 4 + 2] = x - c;
    out[k * 4 + 3] = y - d;
  }
  return out;
}
