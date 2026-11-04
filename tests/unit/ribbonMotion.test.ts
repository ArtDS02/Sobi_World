import { describe, expect, it } from 'vitest';
import { RIBBON_MAX_POINTS, envelope, ribbonStep } from '../../src/areas/adventure/ui/ribbonMotion';

const spec = { n: 18, amp: 100, freq: 2.2, speed: 5 };

describe('ribbon motion (ANIM-006)', () => {
  it('the head swings higher than the tail', () => {
    expect(envelope(1)).toBeGreaterThan(envelope(0) * 3);
    let headMax = 0;
    let tailMax = 0;
    const state: number[] = [];
    for (let i = 0; i < 200; i += 1) {
      const o = ribbonStep(spec, i / 60, state, 1 / 60);
      headMax = Math.max(headMax, Math.abs(o[o.length - 1]!));
      tailMax = Math.max(tailMax, Math.abs(o[0]!));
    }
    expect(headMax).toBeGreaterThan(tailMax * 2);
  });

  it('a point lags behind its target (inertia) instead of jumping to it', () => {
    const state = ribbonStep(spec, 0, [], 1 / 60);
    const next = ribbonStep(spec, 0.5, state.slice(), 1 / 60);
    const jump = ribbonStep(spec, 0.5, state.slice(), 10);
    expect(Math.abs(next[17]! - state[17]!)).toBeLessThan(Math.abs(jump[17]! - state[17]!) + 1e-9);
  });

  it('never has more points than the budget', () => {
    expect(ribbonStep({ ...spec, n: 99 }, 0, [], 0.016)).toHaveLength(RIBBON_MAX_POINTS);
  });
});
