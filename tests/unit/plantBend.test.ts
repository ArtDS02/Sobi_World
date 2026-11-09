// Plants bending in a breeze (systems/animation/plantBend.ts): flat at rest, soil mound fixed, stem keeps its length, rigid top
// that trails the stem.
import { describe, expect, it } from 'vitest';
import { bendRows, stemLean, type BendShape } from '../../src/systems/animation';

const shape: BendShape = { root: 0.1, stiff: 0.62, lag: 0.7 };
const ROWS = 14;
const W = 160;
const H = 150;
const rows = (amp: number, phase: number) => bendRows(new Float32Array(ROWS * 4), ROWS, W, H, amp, phase, shape);
const centre = (v: Float32Array, k: number) => ({ x: (v[k * 4]! + v[k * 4 + 2]!) / 2, y: (v[k * 4 + 1]! + v[k * 4 + 3]!) / 2 });
const AMP = 0.09;

describe('plant bend', () => {
  it('is the flat picture at rest, top row first, right edge before left', () => {
    const v = rows(0, 1.3);
    for (let k = 0; k < ROWS; k++) {
      const y = -H * (1 - k / (ROWS - 1));
      expect(v[k * 4]).toBeCloseTo(W / 2);
      expect(v[k * 4 + 1]).toBeCloseTo(y);
      expect(v[k * 4 + 2]).toBeCloseTo(-W / 2);
      expect(v[k * 4 + 3]).toBeCloseTo(y);
    }
  });

  it('never moves the bottom row (the soil mound)', () => {
    for (let phase = 0; phase < 7; phase += 0.5) {
      const v = rows(AMP, phase);
      const b = (ROWS - 1) * 4;
      [W / 2, 0, -W / 2, 0].forEach((want, i) => expect(v[b + i]).toBeCloseTo(want, 9));
    }
  });

  it('keeps the stem its length', () => {
    const v = rows(AMP, 1.1);
    for (let k = 0; k < ROWS - 1; k++) {
      const a = centre(v, k);
      const b = centre(v, k + 1);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(H / (ROWS - 1));
    }
  });

  it('leans right with a positive lean, more toward the top', () => {
    const v = rows(AMP, Math.PI / 2 + shape.lag / 2);
    const xs = Array.from({ length: ROWS }, (_, k) => centre(v, k).x);
    expect(xs[0]).toBeGreaterThan(5);
    for (let k = 0; k < ROWS - 1; k++) expect(xs[k]!).toBeGreaterThanOrEqual(xs[k + 1]! - 1e-9);
  });

  it('keeps the top rigid: every row above `stiff` has the same lean', () => {
    for (const s of [0.62, 0.7, 0.85, 1]) expect(stemLean(s, AMP, 2, shape)).toBeCloseTo(stemLean(1, AMP, 2, shape));
    expect(stemLean(0.4, AMP, 2, shape)).not.toBeCloseTo(stemLean(1, AMP, 2, shape));
  });

  it('lets the top trail the stem', () => {
    // The phase at which a height leans furthest right comes later the higher it is.
    const peak = (s: number) => {
      let at = 0;
      for (let p = 0; p < Math.PI * 2; p += 0.001) if (stemLean(s, AMP, p, shape) > stemLean(s, AMP, at, shape)) at = p;
      return at;
    };
    expect(peak(1) - peak(0.2)).toBeGreaterThan(0.5);
    expect(peak(1)).toBeCloseTo(Math.PI / 2 + shape.lag, 2);
  });
});
