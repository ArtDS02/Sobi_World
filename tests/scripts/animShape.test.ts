// The frame measure behind STATIC_SHAPE (scripts/anim-review/lib/shape.ts): a still picture moved or scaled keeps its normalised
// shape; a shape that changes does not. Synthetic frames only.
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { biggestBlob, changeMask, shapeChange } from '../../scripts/anim-review/lib/shape';

const W = 320;
const H = 160;
const blank = () => {
  const p = new PNG({ width: W, height: H });
  for (let i = 0; i < p.data.length; i += 4) p.data.set([20, 30, 60, 255], i);
  return p;
};
/** A frame with white pixels where `inside(x, y)`. */
function frame(inside: (x: number, y: number) => boolean): PNG {
  const p = blank();
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) if (inside(x, y)) p.data.set([255, 255, 255, 255], (y * W + x) * 4);
  return p;
}
/** A "wave": a triangle whose slope turns over (lean goes from -1 to 1), moving right. */
const wave = (cx: number, lean: number) => (x: number, y: number) => y > 40 && y < 120 && Math.abs(x - cx - lean * (120 - y) * 0.6) < (120 - y) * 0.5 + 6;

describe('shape change from frames', () => {
  it('finds the biggest blob and ignores small sparks', () => {
    const f = frame((x, y) => (x > 40 && x < 120 && y > 40 && y < 120) || (x > 300 && y < 8));
    const m = changeMask(blank(), f);
    expect(biggestBlob(m).length).toBeGreaterThan(50);
  });

  it('a still picture moved and scaled keeps its shape (IoU near 1)', () => {
    const frames = [0, 1, 2, 3, 4].map((i) => frame((x, y) => Math.hypot(x - 60 - i * 40, y - 80) < 24 + i * 4 && y < 80 + 12 + i * 2));
    const r = shapeChange(blank(), frames);
    expect(r.samples).toBe(4);
    expect(r.medianIoU!).toBeGreaterThanOrEqual(0.8);
  });

  it('a shape that changes (a wave that leans over) scores low', () => {
    const frames = [-1, -0.5, 0, 0.5, 1].map((lean, i) => frame(wave(80 + i * 30, lean)));
    const r = shapeChange(blank(), frames);
    expect(r.samples).toBe(4);
    expect(r.medianIoU!).toBeLessThan(0.8);
  });

  it('gives no sample when nothing big shows', () => {
    expect(shapeChange(blank(), [blank(), blank()])).toEqual({ samples: 0, medianIoU: null });
  });
});
