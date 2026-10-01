import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../src/core/clock';
import { mulberry32, orderSeed, pick, sequenceRng } from '../../src/core/rng';

describe('mulberry32', () => {
  it('is deterministic (golden values, seed 42)', () => {
    const rng = mulberry32(42);
    expect(rng.next()).toBe(0.6011037519201636);
    expect(rng.next()).toBe(0.44829055899754167);
    expect(rng.next()).toBe(0.8524657934904099);
  });

  it('same seed gives the same stream, values in [0, 1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = a.next();
      expect(v).toBe(b.next());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('orderSeed (DECISIONS Q3)', () => {
  it('golden values', () => {
    expect(orderSeed(0, 0)).toBe(2246822507);
    expect(orderSeed(122000, 1)).toBe(783162182);
    expect(orderSeed(500000, 2)).toBe(1871566945);
  });
});

describe('helpers', () => {
  it('sequenceRng replays values and pick maps them uniformly', () => {
    const rng = sequenceRng([0, 0.5, 0.9999]);
    expect(pick(rng, ['a', 'b', 'c'])).toBe('a');
    expect(pick(rng, ['a', 'b', 'c'])).toBe('b');
    expect(pick(rng, ['a', 'b', 'c'])).toBe('c');
  });

  it('fakeClock only moves when told', () => {
    const clock = fakeClock(1000);
    expect(clock.now()).toBe(1000);
    clock.advance(500);
    expect(clock.now()).toBe(1500);
    clock.set(0);
    expect(clock.now()).toBe(0);
  });
});
