// How a fish of the Aquarium swims (fishSwim.ts): the velocity eases towards the wish and slows near the spot, and the
// next leg stays in the water, mostly level, near the top for a hungry fish and near the bottom for a sick one.
import { describe, expect, it } from 'vitest';
import { bodyWave, nextLeg, steer } from '../../src/areas/aquarium/scene/fishSwim';
import { AQUARIUM_VIEW } from '../../src/areas/aquarium/scene/aquariumView';
import { mulberry32 } from '../../src/core/rng';

const box = { left: 300, right: 1300, top: 300, bottom: 600 };

describe('fish swimming', () => {
  it('speeds up gradually, never past the top speed, and stops at the spot', () => {
    let m = { x: 0, y: 0, vx: 0, vy: 0 };
    m = steer(m, 1000, 0, 70, 0.016);
    expect(m.vx).toBeGreaterThan(0);
    expect(m.vx).toBeLessThan(70 * 0.1);
    for (let i = 0; i < 2000; i += 1) {
      m = steer(m, 1000, 0, 70, 0.016);
      expect(Math.hypot(m.vx, m.vy)).toBeLessThanOrEqual(70 + 1e-9);
    }
    expect(m.x).toBeCloseTo(1000, 0);
    expect(Math.abs(m.vx)).toBeLessThan(1);
  });

  it('curves instead of turning on the spot: the old velocity fades over several frames', () => {
    const m = steer({ x: 0, y: 0, vx: 70, vy: 0 }, -500, 0, 70, 0.016);
    expect(m.vx).toBeGreaterThan(0);
  });

  it('the next leg stays in the water and climbs at most a little', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i += 1) {
      const at = { y: 450 };
      const leg = nextLeg(rng, at, box, 'calm');
      expect(leg.x).toBeGreaterThanOrEqual(box.left);
      expect(leg.x).toBeLessThanOrEqual(box.right);
      expect(Math.abs(leg.y - at.y)).toBeLessThanOrEqual(AQUARIUM_VIEW.swim.climb);
    }
  });

  it('a hungry fish keeps to the top third, a sick one to the bottom half', () => {
    const rng = mulberry32(3);
    const h = box.bottom - box.top - 60;
    for (let i = 0; i < 100; i += 1) {
      expect(nextLeg(rng, { y: 500 }, box, 'hungry').y).toBeLessThanOrEqual(box.top + 30 + h / 3);
      expect(nextLeg(rng, { y: 320 }, box, 'sick').y).toBeGreaterThanOrEqual(box.top + 30 + h / 2);
    }
  });

  it('the body bends most at the tail, little at the nose, and not at all without effort', () => {
    const peak = (u: number) => Math.max(...Array.from({ length: 64 }, (_, i) => Math.abs(bodyWave(u, (i / 64) * Math.PI * 2, 10))));
    expect(peak(0)).toBeCloseTo(10, 0);
    expect(peak(0.5)).toBeLessThan(peak(0.2));
    expect(peak(0.7)).toBeLessThan(0.5);
    expect(peak(1)).toBeLessThanOrEqual(1.2);
    expect(bodyWave(0, 1, 0)).toBe(0);
  });
});
