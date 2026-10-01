import { describe, expect, it } from 'vitest';
import { advancePig } from '../../src/core/engine/advancePig';
import { advanceWithTrough, resolveTrough, type Trough } from '../../src/core/engine/trough';
import { sequenceRng, type Rng } from '../../src/core/rng';
import type { Pig } from '../../src/core/types';
import { makePig } from './pigFactory';

const SEC = 1000;
const PINK_PERIOD = 1200; // FOOD_HUNGER_RESTORE / (100 / 2400) s
const neverSick = (): Rng => sequenceRng([1 - 1e-12]);
const trough = (food: number, capacity = 20): Trough => ({ food, capacity, lastResolvedAt: 0 });
const run = (pigs: Pig[], t: Trough, seconds: number) =>
  advanceWithTrough({ pigs, trough: t }, seconds * SEC, neverSick());

describe('§14.2 trough', () => {
  it('order of operations: hunger 50, trough 5, dt = 2 periods ends above 50, not 0', () => {
    const out = run([makePig({ hunger: 50 })], trough(5), 2 * PINK_PERIOD);
    expect(out.pigs[0]!.hunger).toBeGreaterThan(50);
    expect(out.trough.food).toBe(2);
  });

  it('1 unit, 3 hungry pigs: lowest slotIndex eats, identical on every run', () => {
    const pigs = [
      makePig({ id: 'c', slotIndex: 2, hunger: 50 }),
      makePig({ id: 'a', slotIndex: 0, hunger: 50 }),
      makePig({ id: 'b', slotIndex: 1, hunger: 50 }),
    ];
    const first = resolveTrough({ pigs, trough: trough(1) }, 600 * SEC);
    expect(first.trough.food).toBe(0);
    expect(first.pigs.map((p) => [p.id, p.hunger])).toEqual([
      ['c', 50],
      ['a', 100],
      ['b', 50],
    ]);
    for (let i = 0; i < 5; i++) expect(run(pigs, trough(1), 600)).toEqual(run(pigs, trough(1), 600));
  });

  it('empty trough for the whole window: same as advancePig alone, growth stalls at tHungerZero', () => {
    const out = run([makePig()], trough(0), 7200);
    expect(out.pigs[0]).toEqual(advancePig(makePig(), 7200 * SEC, neverSick()));
    expect(out.pigs[0]!.growthProgress).toBeCloseTo(33.33, 2);
    expect(out.trough.food).toBe(0);
  });

  it.todo('advanceWorld twice with the same now consumes food only once (S04B)');

  it('3-day offline window with a full trough: food consumed, never negative, growth capped at 100', () => {
    const pigs = [0, 1, 2, 3].map((i) => makePig({ id: `p${i}`, slotIndex: i }));
    const out = run(pigs, trough(20), 3 * 24 * 3600);
    expect(out.trough.food).toBe(0);
    for (const p of out.pigs) {
      expect(p.growthProgress).toBeLessThanOrEqual(100);
      expect(p.hunger).toBeGreaterThanOrEqual(0);
      expect(p.hunger).toBeLessThanOrEqual(100);
    }
    // Closed form is greedy by slotIndex (DECISIONS Q4): slot 0 eats all 20 units and reaches
    // adult; the others get nothing and stall at tHungerZero.
    expect(out.pigs.map((p) => +p.growthProgress.toFixed(2))).toEqual([100, 33.33, 33.33, 33.33]);
  });

  it.todo('fillTrough beyond capacity gives TROUGH_FULL and changes nothing (actions phase)');
});

describe('trough closed form vs step simulation', () => {
  /**
   * Reference: 1 s steps in integer units (1 unit = 1/24 hunger = 1 s of PINK decay, so no float
   * drift). Eats one food whenever hunger <= 50, including at the window end (meals at exactly
   * t = dt count, as in the closed form and G4).
   */
  function stepSim(hunger: number, food: number, seconds: number) {
    const UNITS = 24;
    let h = Math.round(hunger * UNITS);
    let f = food;
    let fedTime = 0; // seconds with hunger > 0
    const eat = () => {
      if (h <= 50 * UNITS && f > 0) {
        h += 50 * UNITS;
        f -= 1;
      }
    };
    for (let t = 0; t < seconds; t++) {
      eat();
      if (h > 0) fedTime += 1;
      h = Math.max(0, h - 1);
    }
    eat();
    return { h: h / UNITS, f, fedTime };
  }

  it.each([
    [100, 20, 7200],
    [50, 5, 2400],
    [73, 2, 9000],
    [10, 3, 5000],
    [100, 1, 7200],
    [60, 50, 30_000],
  ])('hunger %s, food %s, %s s', (hunger, food, seconds) => {
    const pig = makePig({ hunger, growthProgress: 0 });
    const out = run([pig], trough(food, 200), seconds);
    const ref = stepSim(hunger, food, seconds);
    expect(out.trough.food).toBe(ref.f);
    expect(out.pigs[0]!.hunger).toBeCloseTo(ref.h, 1);
    const expectedProgress = Math.min(100, (ref.fedTime * 100) / 7200);
    expect(out.pigs[0]!.growthProgress).toBeCloseTo(expectedProgress, 1);
  });
});

describe('trough edge cases', () => {
  it('hunger never exceeds 100 after a window, even with plenty of food', () => {
    for (const seconds of [1, 599, 1200, 1201, 3600, 86_400]) {
      const out = run([makePig({ hunger: 50 })], trough(999, 999), seconds);
      expect(out.pigs[0]!.hunger).toBeLessThanOrEqual(100);
      expect(out.pigs[0]!.hunger).toBeGreaterThan(50);
    }
  });

  it('dt = 0 eats nothing (same-now call is a no-op for food)', () => {
    const out = run([makePig({ hunger: 50 })], trough(5), 0);
    expect(out.trough.food).toBe(5);
  });

  it('clock moved backwards: resync lastResolvedAt only (D14)', () => {
    const t = { food: 5, capacity: 20, lastResolvedAt: 10_000 * SEC };
    const pig = makePig({ hunger: 10, lastTickedAt: 10_000 * SEC });
    const out = resolveTrough({ pigs: [pig], trough: t }, 9_000 * SEC);
    expect(out.trough).toEqual({ ...t, lastResolvedAt: 9_000 * SEC });
    expect(out.pigs[0]).toBe(pig);
  });

  it('ample food: splitting the window gives the same result', () => {
    const whole = run([makePig()], trough(100, 100), 9000);
    const half = run([makePig()], trough(100, 100), 4100);
    const split = advanceWithTrough(half, 9000 * SEC, neverSick());
    expect(split.trough.food).toBe(whole.trough.food);
    expect(split.pigs[0]!.hunger).toBeCloseTo(whole.pigs[0]!.hunger, 9);
    expect(split.pigs[0]!.growthProgress).toBeCloseTo(whole.pigs[0]!.growthProgress, 9);
  });
});
