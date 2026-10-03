import { describe, expect, it } from 'vitest';
import { advancePig } from '../../src/core/engine/advancePig';
import { advanceWithTrough } from '../../src/core/engine/trough';
import { mulberry32, sequenceRng, type Rng } from '../../src/core/rng';
import type { Pig } from '../../src/core/types';
import { makePig } from './pigFactory';

const SEC = 1000;
/** rng.next() just below 1: sample ~323,000 s fed / ~161,000 s starving, so never sick in these tests. */
const neverSick = (): Rng => sequenceRng([1 - 1e-12]);
const advance = (pig: Pig, seconds: number, rng: Rng = neverSick()) =>
  advancePig(pig, pig.lastTickedAt + seconds * SEC, rng);

// NH-1 rebalance: PINK hunger budget 7,200 s, cleanliness 18,000 s (was 2,400 / 5,400, D16).
describe('§14.1 golden values (PINK baby, progress 0, hunger 100, clean 100) — NH-1 budgets', () => {
  it('G1 advance 3,600 s → hunger 50, cleanliness 80, progress 50', () => {
    const p = advance(makePig(), 3600);
    expect(p.hunger).toBeCloseTo(50, 6);
    expect(p.cleanliness).toBeCloseTo(80, 6);
    expect(p.growthProgress).toBeCloseTo(50, 6);
  });

  it('G2 advance 7,200 s → hunger 0, cleanliness 60, progress 100', () => {
    const p = advance(makePig(), 7200);
    expect(p.hunger).toBeCloseTo(0, 6);
    expect(p.cleanliness).toBeCloseTo(60, 6);
    expect(p.growthProgress).toBe(100);
  });

  it('G3 hunger 50, advance 7,200 s, no trough → hunger 0, progress 50 (growth stopped at t=3,600)', () => {
    const p = advance(makePig({ hunger: 50 }), 7200);
    expect(p.hunger).toBe(0);
    expect(p.growthProgress).toBeCloseTo(50, 6);
  });

  it('G4 MELON advance 14,400 s: no trough → 25 %; trough stocked with 10 → adult, trough food 6', () => {
    const melon = () => makePig({ breed: 'PIG_STRIPED_MELON', hunger: 50 });
    expect(advance(melon(), 14_400).growthProgress).toBeCloseTo(25, 6);
    const out = advanceWithTrough(
      {
        pigs: [makePig({ breed: 'PIG_STRIPED_MELON' })],
        trough: { food: 10, capacity: 20, lastResolvedAt: 0 },
      },
      14_400 * SEC,
      neverSick(),
    );
    expect(out.pigs[0]!.growthProgress).toBe(100);
    expect(out.trough.food).toBe(6);
  });

  it('G5 cleanliness crosses 30 exactly at t = 12,600 s', () => {
    expect(advance(makePig(), 12_600).cleanliness).toBeCloseTo(30, 9);
    expect(advance(makePig(), 12_599).cleanliness).toBeGreaterThan(30);
    expect(advance(makePig(), 12_601).cleanliness).toBeLessThan(30);
  });

  it('G6 sick pig advance → growth unchanged; hunger and cleanliness still decay', () => {
    const sick = makePig({ isSick: true, growthProgress: 20 });
    const p = advance(sick, 3600);
    expect(p.growthProgress).toBe(20);
    expect(p.hunger).toBeCloseTo(50, 6);
    expect(p.cleanliness).toBeCloseTo(80, 6);
    expect(p.isSick).toBe(true);
  });

  it('G7 now < lastTickedAt → no change except lastTickedAt = now (D14)', () => {
    const pig = makePig({
      lastTickedAt: 10_000 * SEC,
      hunger: 42,
      cleanliness: 17,
      growthProgress: 5,
    });
    const p = advancePig(pig, 9_000 * SEC, mulberry32(1));
    expect(p).toEqual({ ...pig, lastTickedAt: 9_000 * SEC });
  });

  it('G8 split invariance: advance(a+b) = advance(a) then advance(b), never-sick rng', () => {
    // Detailed pair matrix in the "split invariance" block below.
    const whole = advance(makePig(), 5000);
    const split = advance(advance(makePig(), 1800), 3200);
    expectSamePig(split, whole);
  });

  it('G9 sickness, rng.next() = 0 → sick the moment cleanliness drops below 30', () => {
    expect(advance(makePig(), 12_600, sequenceRng([0])).isSick).toBe(false);
    expect(advance(makePig(), 12_600.001, sequenceRng([0])).isSick).toBe(true);
  });

  it('G10 sickness, rng.next() = 0.9999 → not sick within 1 h of exposure', () => {
    expect(advance(makePig(), 12_600 + 3600, sequenceRng([0.9999])).isSick).toBe(false);
  });

  // Fixed seed, N runs over one stream. Binomial σ = sqrt(p(1-p)/N).
  const N = 20_000;
  const sickRate = (start: Partial<Pig>, seed: number): number => {
    const rng = mulberry32(seed);
    let sick = 0;
    for (let i = 0; i < N; i++) if (advance(makePig(start), 600, rng).isSick) sick++;
    return sick / N;
  };
  // Exposure from t=0: cleanliness already at the threshold.
  const FED = { cleanliness: 30, hunger: 100 };
  const STARVING = { cleanliness: 30, hunger: 0 };

  it('G11 sickness statistics: ~5% of 600 s exposures → tolerance ±0.006 (≈3.9σ), N=20,000, seed 12345', () => {
    expect(Math.abs(sickRate(FED, 12345) - 0.05)).toBeLessThan(0.006);
  });

  it('G12 starving hazard: rate ≈ 2x fed → hazard ratio 2 ± 0.25, N=20,000 each, seeds 777/778', () => {
    const fed = sickRate(FED, 777);
    const starving = sickRate(STARVING, 778);
    // Exact: 1 - 0.95^2 = 0.0975; tolerance ±0.008 (≈3.8σ).
    expect(Math.abs(starving - 0.0975)).toBeLessThan(0.008);
    const hazardRatio = Math.log(1 - starving) / Math.log(1 - fed);
    expect(Math.abs(hazardRatio - 2)).toBeLessThan(0.25);
  });
});

function expectSamePig(actual: Pig, expected: Pig): void {
  expect(actual.hunger).toBeCloseTo(expected.hunger, 9);
  expect(actual.cleanliness).toBeCloseTo(expected.cleanliness, 9);
  expect(actual.growthProgress).toBeCloseTo(expected.growthProgress, 9);
  expect(actual.isSick).toBe(expected.isSick);
  expect(actual.lastTickedAt).toBe(expected.lastTickedAt);
}

describe('split invariance (many (a, b) pairs)', () => {
  const starts: Record<string, Pig> = {
    'pink baby': makePig(),
    'pink half-fed young': makePig({ hunger: 37, cleanliness: 61, growthProgress: 42 }),
    'superman near adult': makePig({ breed: 'PIG_SUPERMAN', growthProgress: 99.5, hunger: 80 }),
    'mythical dirty': makePig({ breed: 'PIG_MYTHICAL', cleanliness: 31, hunger: 5 }),
    'adult starving': makePig({ growthProgress: 100, hunger: 0, cleanliness: 20 }),
  };
  const pairs: [number, number][] = [
    [1, 1],
    [0.5, 0.25],
    [600, 600],
    [1200, 1200],
    [2399, 2],
    [2400, 5000],
    [100, 7100],
    [3780, 1],
    [3779.5, 0.5],
    [10_000, 50_000],
    [86_400, 3_600],
  ];

  for (const [name, pig] of Object.entries(starts)) {
    it.each(pairs)(`${name}: a=%s s, b=%s s`, (a, b) => {
      expectSamePig(advance(advance(pig, a), b), advance(pig, a + b));
    });
  }

  it('many 1 s ticks equal one big step', () => {
    let pig = makePig();
    for (let i = 0; i < 3000; i++) pig = advance(pig, 1);
    expectSamePig(pig, advance(makePig(), 3000));
  });
});

describe('invariants', () => {
  it('hunger and cleanliness never leave [0, 100]; adult stays at 100', () => {
    const p = advance(makePig({ growthProgress: 100 }), 1_000_000);
    expect(p.hunger).toBe(0);
    expect(p.cleanliness).toBe(0);
    expect(p.growthProgress).toBe(100);
  });

  it('a fed pig reaches exactly 100 progress', () => {
    const p = advance(makePig({ growthProgress: 90, hunger: 100 }), 720);
    expect(p.growthProgress).toBe(100);
  });

  it('sickness onset freezes growth at tSick', () => {
    // Fed pig (big hunger budget via SUPERMAN), dirty, rng=0 → sick at t=0 of exposure.
    const pig = makePig({ breed: 'PIG_SUPERMAN', cleanliness: 30, growthProgress: 10 });
    const p = advance(pig, 1000, sequenceRng([0]));
    expect(p.isSick).toBe(true);
    expect(p.growthProgress).toBe(10);
  });
});
