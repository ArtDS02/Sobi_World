// Shared gameplay systems (GĐ1 step 5): creature model, health frame, quality, valuation.
import { describe, expect, it } from 'vitest';
import { advanceCreature, hazardPerSec } from '../../src/systems/creature/advance';
import { displayWeight, growthStage } from '../../src/systems/creature/growth';
import { careMood } from '../../src/systems/creature/mood';
import { careBudget, needLevel } from '../../src/systems/creature/needs';
import type { Creature } from '../../src/systems/creature/types';
import { diseaseState, healthStage, onsetFields, sickBlockedUntil } from '../../src/systems/health/disease';
import { addMoodSample, QUALITY_RULES, qualityFromMood, withBond } from '../../src/systems/quality/quality';
import { healthFactor, linearFactor, valueOf, weightFactor } from '../../src/systems/valuation/value';
import { sequenceRng } from '../../src/core/rng';

const H = 3_600_000;
const fish: Creature = {
  id: 'f1', breed: 'FISH_KOI', name: 'Koi', gender: 'MALE', growthProgress: 0,
  hunger: 100, cleanliness: 100, isSick: false, lastTickedAt: 0, createdAt: 0,
};
const noSickness = {
  cleanThreshold: 30,
  lambda: hazardPerSec(0.05, 600),
  starvingMultiplier: 2,
  blockedUntil: () => 0,
  onset: (c: Creature, at: number) => onsetFields(c, at, 0),
};

describe('creature: any species is data', () => {
  it('a non-pig creature grows and gets hungry with its own rates', () => {
    const rates = { hungerPerSec: 100 / (10 * 3600), cleanPerSec: 100 / (100 * 3600), growthSec: 4 * 3600 };
    const after = advanceCreature(fish, 2 * H, sequenceRng([0.999]), rates, noSickness);
    expect(after.growthProgress).toBeCloseTo(50);
    expect(after.hunger).toBeCloseTo(80);
    expect(after.lastTickedAt).toBe(2 * H);
    expect(advanceCreature(after, H, sequenceRng([0]), rates, noSickness).lastTickedAt).toBe(H); // never backwards
  });

  it('stops growing when starving; snaps to grown', () => {
    const rates = { hungerPerSec: 100 / 3600, cleanPerSec: 0.0001, growthSec: 10 * 3600 };
    const after = advanceCreature(fish, 5 * H, sequenceRng([0.999]), rates, noSickness);
    expect(after.growthProgress).toBeCloseTo(10); // grew for the 1 h it had food
    const fast = { ...rates, hungerPerSec: 0.0001, growthSec: 3600 };
    expect(advanceCreature(fish, 2 * H, sequenceRng([0.999]), fast, noSickness).growthProgress).toBe(100);
  });

  it('stage, weight, mood, need levels and care budget', () => {
    expect([0, 29.9, 30, 99.9, 100].map((g) => growthStage(g, 30))).toEqual(['BABY', 'BABY', 'YOUNG', 'YOUNG', 'ADULT']);
    expect(displayWeight(50, 101)).toBe(51);
    const rules = { cleanWeight: 0.5, hungerWeight: 0.5, sickPenalty: 40 };
    expect(careMood({ hunger: 100, cleanliness: 60, isSick: true }, rules, 5)).toBe(45);
    expect(careMood({ hunger: 0, cleanliness: 0, isSick: true }, rules)).toBe(0);
    const mins = { good: 80, normal: 50, low: 25, veryLow: 10, critical: 0 };
    expect([90, 50, 24, 0].map((v) => needLevel(v, mins))).toEqual(['good', 'normal', 'veryLow', 'critical']);
    expect(careBudget(100, 0.5, 60)).toBe(60);
    expect(careBudget(1000, 0.5, 60)).toBe(500);
  });
});

describe('health: the disease lifecycle and the GĐ2 frame', () => {
  const ill = { ...fish, isSick: true, lastSickAt: 0 };
  it('healthy, ill, recovering', () => {
    expect(diseaseState(fish, 0)).toBe('healthy');
    expect(diseaseState(ill, 0)).toBe('ill');
    expect(diseaseState({ ...fish, recoveringUntil: 10 }, 5)).toBe('recovering');
  });

  it('critical and dead only once switched on (GĐ1: off, Sobi Farm D21)', () => {
    const off = { criticalAfterMs: null, deathAfterMs: null };
    expect(healthStage(ill, 1000 * H, off)).toBe('ill');
    const on = { criticalAfterMs: 48 * H, deathAfterMs: 72 * H };
    expect(healthStage(ill, 47 * H, on)).toBe('ill');
    expect(healthStage(ill, 48 * H, on)).toBe('critical');
    expect(healthStage(ill, 72 * H, on)).toBe('dead');
    expect(healthStage(fish, 100 * H, on)).toBe('healthy');
  });

  it('one episode per game day', () => {
    const sick = { ...fish, ...onsetFields(fish, 10 * H, 0) };
    expect(sick).toMatchObject({ isSick: true, lastSickAt: 10 * H, sickDay: 0, sickEpisodes: 1 });
    expect(sickBlockedUntil({ ...sick, isSick: false }, 0, 1)).toBe(24 * H);
    expect(sickBlockedUntil({ ...sick, isSick: false }, 0, 2)).toBe(0);
  });
});

describe('quality', () => {
  it('tiers from the average mood (GAME_BALANCE §2.5)', () => {
    expect([95, 90, 80, 60, 45, 10].map((m) => qualityFromMood(m, QUALITY_RULES))).toEqual([
      'PERFECT', 'PERFECT', 'EXCELLENT', 'GREAT', 'GOOD', 'NORMAL',
    ]);
  });
  it('3 hearts: a 20% chance of one tier up; never past PERFECT', () => {
    expect(withBond('GOOD', 3, sequenceRng([0.1]), QUALITY_RULES)).toBe('GREAT');
    expect(withBond('GOOD', 3, sequenceRng([0.5]), QUALITY_RULES)).toBe('GOOD');
    expect(withBond('GOOD', 2, sequenceRng([0]), QUALITY_RULES)).toBe('GOOD');
    expect(withBond('PERFECT', 5, sequenceRng([0]), QUALITY_RULES)).toBe('PERFECT');
  });
  it('running average', () => {
    expect(addMoodSample(80, 3, 40)).toEqual({ avg: 70, samples: 4 });
  });
});

describe('valuation', () => {
  it('base times factors, floored to a coin (float error guarded)', () => {
    expect(valueOf(1200, { care: 0.95 })).toBe(1140);
    expect(valueOf(500)).toBe(500);
    expect(valueOf(1000, { rarity: 1.5, quality: 1.2 })).toBe(1800);
  });
  it('Sobi World factors are ready for GĐ2', () => {
    expect(linearFactor(50, 0.7, 0.5)).toBeCloseTo(0.95);
    expect(weightFactor(120, 100, 1.1)).toBe(1.1);
    expect(healthFactor(5, 0.1, 0.7)).toBe(0.7);
  });
});
