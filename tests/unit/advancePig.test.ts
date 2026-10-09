import { describe, expect, it } from 'vitest';
import { advancePig } from '../../src/areas/farm/logic/advancePig';
import { advanceWithTrough } from '../../src/areas/farm/logic/trough';
import { mulberry32, sequenceRng, type Rng } from '../../src/core/rng';
import { episodeThreshold } from '../../src/systems/health/risk';
import type { Pig } from '../../src/areas/farm/logic/types';
import { makePig } from './pigFactory';

const SEC = 1000;
/** Sickness is seeded per pig, not drawn from the rng; this stands in where a stream is required. */
const neverSick = (): Rng => sequenceRng([1 - 1e-12]);
/** A world old enough that the new-world protection (first 72 h) is over. */
const LONG_AGO = -1e12;
const advance = (pig: Pig, seconds: number, rng: Rng = neverSick()) =>
  advancePig(pig, pig.lastTickedAt + seconds * SEC, rng, 0, 0, LONG_AGO);

// GĐ2 timescale (decision 003): hunger -8/h, cleanliness -4/h, a Common pig takes 172,800 s (48 h) to Mature.
describe('§14.1 golden values (PINK baby, progress 0, hunger 100, clean 100) — GĐ2 rates', () => {
  it('G1 advance 3,600 s → hunger 92, cleanliness 96, progress 2.0833', () => {
    const p = advance(makePig(), 3600);
    expect(p.hunger).toBeCloseTo(92, 6);
    expect(p.cleanliness).toBeCloseTo(96, 6);
    expect(p.growthProgress).toBeCloseTo(100 / 48, 6);
  });

  it('G2 advance 48 h fed by hand-equivalent: hunger runs out at 12.5 h, growth stops at hunger 30', () => {
    const p = advance(makePig(), 48 * 3600);
    expect(p.hunger).toBe(0);
    expect(p.cleanliness).toBeCloseTo(0, 6); // 100 - 4 x 48 < 0: floors at 0
    expect(p.growthProgress).toBeCloseTo(((100 - 30) / 8 / 48) * 100, 6); // grew for the 8.75 h hunger was above 30
  });

  it('G3 hunger 40, advance 7,200 s, no trough → hunger 24, growth stopped at hunger 30 (t=4,500)', () => {
    const p = advance(makePig({ hunger: 40 }), 7200);
    expect(p.hunger).toBeCloseTo(24, 6);
    expect(p.growthProgress).toBeCloseTo((4500 / 172_800) * 100, 6);
  });

  it('G3b a pig at hunger 30 or below does not grow at all', () => {
    expect(advance(makePig({ hunger: 30 }), 3600).growthProgress).toBe(0);
    expect(advance(makePig({ hunger: 10 }), 3600).growthProgress).toBe(0);
  });

  it('G4 MELON (Uncommon, 60 h to Mature) advance 24 h: no trough → grows until hunger 30; trough stocked with 20 → 40 %, 3 meals', () => {
    const melon = () => makePig({ breed: 'PIG_STRIPED_MELON' });
    expect(advance(melon(), 24 * 3600).growthProgress).toBeCloseTo((8.75 / 60) * 100, 6);
    const out = advanceWithTrough(
      { pigs: [melon()], trough: { food: 20, capacity: 20, lastResolvedAt: 0 } },
      24 * 3600 * SEC,
      neverSick(),
    );
    expect(out.pigs[0]!.growthProgress).toBeCloseTo(40, 6); // fed all day: 24 h of 60 h
    expect(out.trough.food).toBe(17); // first meal at hunger 40 (7.5 h), then every 6.25 h
  });

  it('G5 cleanliness crosses 30 exactly at t = 63,000 s (17.5 h)', () => {
    expect(advance(makePig(), 63_000).cleanliness).toBeCloseTo(30, 9);
    expect(advance(makePig(), 62_999).cleanliness).toBeGreaterThan(30);
    expect(advance(makePig(), 63_001).cleanliness).toBeLessThan(30);
  });

  it('G6 sick pig advance → growth unchanged; hunger and cleanliness still decay', () => {
    const sick = makePig({ isSick: true, growthProgress: 20 });
    const p = advance(sick, 3600);
    expect(p.growthProgress).toBe(20);
    expect(p.hunger).toBeCloseTo(92, 6);
    expect(p.cleanliness).toBeCloseTo(96, 6);
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

  // Illness (GAME_BALANCE §2.4): hourly risk 15 % starving / 10 % dirty (< 20) / 5 % low mood, banked as hazard.
  const LAMBDA = (p: number) => -Math.log(1 - p) / 3600;

  it('G9 a starving pig banks the starving hazard second by second', () => {
    const p = advance(makePig({ hunger: 0 }), 3000);
    expect(p.isSick).toBe(false);
    expect(p.illRisk).toBeCloseTo(LAMBDA(0.15) * 3000, 9);
  });

  it('G10 dirtiness counts from cleanliness 20 only: 25 falls to 17 at -4 per hour', () => {
    const p = advance(makePig({ cleanliness: 25 }), 2 * 3600); // below 20 from 1.25 h on
    expect(p.illRisk).toBeCloseTo(LAMBDA(0.1) * (2 * 3600 - 4500), 9);
  });

  it('G10b a well-kept pig banks nothing', () => {
    expect(advance(makePig(), 10 * 3600).illRisk).toBe(0);
  });

  it('G10c the first 72 hours of a world are protected: no illness, no hazard banked', () => {
    const starving = makePig({ hunger: 0 });
    const protectedPig = advancePig(starving, 60 * 3600 * SEC, neverSick(), 0, 0, 0);
    expect(protectedPig.isSick).toBe(false);
    expect(protectedPig.illRisk).toBe(0);
    // from 70 h: protection ends at 72 h, so only the last 2 h of the 4 h count
    const late = { ...starving, lastTickedAt: 70 * 3600 * SEC };
    const after = advancePig(late, 74 * 3600 * SEC, neverSick(), 0, 0, 0);
    expect(after.illRisk).toBeCloseTo(LAMBDA(0.15) * 2 * 3600, 9);
  });

  it('G11 the pig falls ill exactly when its banked hazard reaches its own threshold', () => {
    const pig = makePig({ hunger: 0 });
    const onsetS = episodeThreshold(pig) / LAMBDA(0.15);
    // mood stays above 20 for a long while here (cleanliness and energy are high), so only starving counts
    expect(onsetS).toBeGreaterThan(3600);
    expect(advance(pig, onsetS - 1).isSick).toBe(false);
    const sick = advance(pig, onsetS + 1);
    expect(sick.isSick).toBe(true);
    expect(sick.lastSickAt).toBe(Math.round(onsetS * 1000));
    expect(sick.illRisk).toBe(0); // the next episode starts from zero
  });

  it('G12 the share of pigs that fall ill within an hour of starving is ~15 %', () => {
    const N = 4000;
    let ill = 0;
    for (let i = 0; i < N; i++) if (advance(makePig({ id: `pig-${i}`, hunger: 0 }), 3600).isSick) ill++;
    expect(Math.abs(ill / N - 0.15)).toBeLessThan(0.03);
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
    const p = advance(makePig({ growthProgress: 90, hunger: 100 }), 17_280);
    expect(p.growthProgress).toBe(100);
  });

  it('sickness onset freezes growth at the onset', () => {
    // A fed, filthy pig that is 0.001 of hazard short of its threshold falls ill after ~34 s.
    const base = makePig({ cleanliness: 0, growthProgress: 10 });
    const pig = { ...base, illRisk: episodeThreshold(base) - 0.001 };
    const onsetS = 0.001 / (-Math.log(0.9) / 3600);
    const p = advance(pig, 1000);
    expect(p.isSick).toBe(true);
    expect(p.growthProgress).toBeCloseTo(10 + (onsetS / 172_800) * 100, 6);
  });
});
