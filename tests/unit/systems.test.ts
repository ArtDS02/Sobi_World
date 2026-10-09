// Shared gameplay systems (GĐ1 step 5): creature model, health frame, quality, valuation.
import { describe, expect, it } from 'vitest';
import { advanceCreature } from '../../src/systems/creature/advance';
import { displayWeight, growthStage } from '../../src/systems/creature/growth';
import { careMood } from '../../src/systems/creature/mood';
import { needLevel } from '../../src/systems/creature/needs';
import type { Creature } from '../../src/systems/creature/types';
import { diseaseState, healthStage, onsetFields, sickBlockedUntil } from '../../src/systems/health/disease';
import { episodeThreshold, needsMood, riskOver } from '../../src/systems/health/risk';
import { addMoodSample, QUALITY_RULES, qualityFromMood, withBond } from '../../src/systems/quality/quality';
import { healthFactor, linearFactor, valueOf, weightFactor } from '../../src/systems/valuation/value';
import { sequenceRng } from '../../src/core/rng';
import { HEALTH } from '../../src/core/config/health';
import { idRoll, traitScale, traitsOf } from '../../src/systems/behavior-ai/identity';
import { outranks, pickWeighted } from '../../src/systems/behavior-ai/priority';
import { clampToEllipse, ellipsePoint, insideEllipse, separation, walkEllipse } from '../../src/systems/layout/walkArea';

const H = 3_600_000;
const fish: Creature = {
  id: 'f1', breed: 'FISH_KOI', name: 'Koi', gender: 'MALE', growthProgress: 0,
  hunger: 100, cleanliness: 100, isSick: false, lastTickedAt: 0, createdAt: 0,
};
const awake = { asleepAt: () => false, nextChange: (t: number) => t + H };
/** The rates a test cares about, plus neutral defaults for the rest. */
const rates = (r: { hungerPerSec: number; cleanPerSec: number; growthSec: number }) => ({
  ...r,
  energy: { awakePerSec: 0, asleepPerSec: 0 },
  growthMinHunger: 0,
  poopFromProgress: 100,
  poopSec: 1e9,
});
const RISK_OFF = { perHour: { starving: 0, dirty: 0, lowMood: 0 }, dirtyBelow: 20, lowMoodBelow: 20 };
const noSickness = {
  risk: RISK_OFF,
  protectedUntil: 0,
  blockedUntil: () => 0,
  onset: (c: Creature, at: number) => onsetFields(c, at, 0),
};

describe('creature: any species is data', () => {
  it('a non-pig creature grows and gets hungry with its own rates', () => {
    const r = rates({ hungerPerSec: 100 / (10 * 3600), cleanPerSec: 100 / (100 * 3600), growthSec: 4 * 3600 });
    const after = advanceCreature(fish, 2 * H, r, noSickness, awake);
    expect(after.growthProgress).toBeCloseTo(50);
    expect(after.hunger).toBeCloseTo(80);
    expect(after.lastTickedAt).toBe(2 * H);
    expect(advanceCreature(after, H, r, noSickness, awake).lastTickedAt).toBe(H); // never backwards
  });

  it('stops growing when starving; snaps to grown', () => {
    const r = rates({ hungerPerSec: 100 / 3600, cleanPerSec: 0.0001, growthSec: 10 * 3600 });
    const after = advanceCreature(fish, 5 * H, r, noSickness, awake);
    expect(after.growthProgress).toBeCloseTo(10); // grew for the 1 h it had food
    const fast = { ...r, hungerPerSec: 0.0001, growthSec: 3600 };
    expect(advanceCreature(fish, 2 * H, fast, noSickness, awake).growthProgress).toBe(100);
  });

  it('stage, weight, mood and need levels', () => {
    expect([0, 12.4, 12.5, 49.9, 50, 99.9, 100].map((g) => growthStage(g, 12.5, 50))).toEqual(['BABY', 'BABY', 'YOUNG', 'YOUNG', 'ADULT', 'ADULT', 'MATURE']);
    const kg = [[0, 0.02], [12.5, 0.05], [50, 0.6], [100, 1]] as const;
    expect(displayWeight(0, 100, kg)).toBe(2);
    expect(displayWeight(50, 100, kg)).toBe(60);
    expect(displayWeight(75, 100, kg)).toBeCloseTo(80); // halfway between 60 and 100
    expect(displayWeight(100, 100, kg)).toBe(100);
    expect(displayWeight(0, 10, kg)).toBe(1); // never below 1 kg
    const rules = { cleanWeight: 0.5, hungerWeight: 0.5, sickPenalty: 40 };
    expect(careMood({ hunger: 100, cleanliness: 60, isSick: true }, rules, 5)).toBe(45);
    expect(careMood({ hunger: 0, cleanliness: 0, isSick: true }, rules)).toBe(0);
    const mins = { good: 80, normal: 50, low: 25, veryLow: 10, critical: 0 };
    expect([90, 50, 24, 0].map((v) => needLevel(v, mins))).toEqual(['good', 'normal', 'veryLow', 'critical']);
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

describe('behavior-ai', () => {
  it('rolls and traits are fixed per id', () => {
    expect(idRoll('pig-1', 3, 7)).toBe(idRoll('pig-1', 3, 7));
    expect(idRoll('pig-1', 3, 7)).not.toBe(idRoll('pig-2', 3, 7));
    const t = traitsOf('fish-9', ['speed', 'shy'] as const);
    expect(t.speed).toBeGreaterThanOrEqual(0);
    expect(t.shy).toBeLessThanOrEqual(1);
    expect(traitScale(1, 0.35)).toBeCloseTo(1.35);
  });
  it('urgency order and weighted free time', () => {
    const order = ['flee', 'eat', 'free'] as const;
    expect(outranks(order, 'flee', 'eat')).toBe(true);
    expect(outranks(order, 'free', 'eat')).toBe(false);
    const w = [['a', 1], ['b', 0], ['c', 3]] as const;
    expect([0, 0.24, 0.25, 0.99].map((r) => pickWeighted(w, r))).toEqual(['a', 'a', 'c', 'c']);
  });
});

describe('layout: walk area', () => {
  const e = walkEllipse({ width: 1000, height: 500 }, { x: 0.1, y: 0.2, width: 0.8, height: 0.6 });
  it('ellipse, inside, clamp', () => {
    expect(e).toEqual({ cx: 500, cy: 250, rx: 400, ry: 150 });
    expect(insideEllipse(e, ellipsePoint(e, 1, 0.3))).toBe(true);
    expect(clampToEllipse(e, { x: 2000, y: 250 })).toEqual({ x: 900, y: 250 });
  });
  it('pushes close neighbours apart', () => {
    const push = separation([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 10, y: 0 }], 50, 100, () => 0);
    expect(push.get('a')).toEqual({ dx: -20, dy: 0 });
    expect(push.get('b')).toEqual({ dx: 20, dy: 0 });
  });
});

describe('illness risk (GAME_BALANCE §2.4, GĐ2)', () => {
  const rules = HEALTH.risk; // starving 15 %/h, dirty 10 %/h, low mood 5 %/h
  const still = { hunger0: 100, hungerPerSec: 0, clean0: 100, cleanPerSec: 0, mood0: 100, mood1: 100 };
  const hour = (extra: object) => riskOver({ dt: 3600, from: 0, ...still, ...extra }, rules, Infinity).hazard;

  it('an hour of one condition has the stated chance: hazard = -ln(1 - p)', () => {
    expect(hour({})).toBe(0);
    expect(hour({ hunger0: 0 })).toBeCloseTo(-Math.log(1 - 0.15), 9);
    expect(hour({ clean0: 10 })).toBeCloseTo(-Math.log(1 - 0.1), 9);
    expect(hour({ mood0: 10, mood1: 10 })).toBeCloseTo(-Math.log(1 - 0.05), 9);
  });

  it('conditions add up: starving and dirty and low mood is a 30 % hour', () => {
    expect(hour({ hunger0: 0, clean0: 10, mood0: 10, mood1: 10 })).toBeCloseTo(-Math.log(1 - 0.3), 9);
  });

  it('exposure starts when a condition begins: cleanliness 40 falling 20 an hour is dirty for the last half hour', () => {
    const dirtyHalf = hour({ clean0: 30, cleanPerSec: 20 / 3600 });
    expect(dirtyHalf).toBeCloseTo((-Math.log(1 - 0.1) / 3600) * 1800, 9);
  });

  it('nothing counts before `from` (protection, recovery, the day limit)', () => {
    const r = riskOver({ dt: 3600, from: 1800, ...still, hunger0: 0 }, rules, Infinity);
    expect(r.hazard).toBeCloseTo((-Math.log(1 - 0.15) / 3600) * 1800, 9);
    expect(riskOver({ dt: 3600, from: 3600, ...still, hunger0: 0 }, rules, Infinity).hazard).toBe(0);
  });

  it('the onset is where the accumulated hazard reaches the budget', () => {
    const lambda = -Math.log(1 - 0.15) / 3600;
    const r = riskOver({ dt: 7200, from: 0, ...still, hunger0: 0 }, rules, lambda * 1000);
    expect(r.onsetAt).toBeCloseTo(1000, 6);
    expect(riskOver({ dt: 500, from: 0, ...still, hunger0: 0 }, rules, lambda * 1000).onsetAt).toBeNull();
  });

  it('splitting a span changes nothing: the same total hazard and the same onset', () => {
    const base = { hunger0: 40, hungerPerSec: 8 / 3600, clean0: 30, cleanPerSec: 4 / 3600 };
    const mood = (t: number) => needsMood({ hunger: Math.max(0, 40 - 8 * (t / 3600)), cleanliness: Math.max(0, 30 - 4 * (t / 3600)), energy: 100 });
    const whole = riskOver({ dt: 36_000, from: 0, ...base, mood0: mood(0), mood1: mood(36_000) }, rules, Infinity).hazard;
    let parts = 0;
    for (let t = 0; t < 36_000; t += 600) {
      const b = { hunger0: Math.max(0, 40 - 8 * (t / 3600)), hungerPerSec: 8 / 3600, clean0: Math.max(0, 30 - 4 * (t / 3600)), cleanPerSec: 4 / 3600 };
      parts += riskOver({ dt: 600, from: 0, ...b, mood0: mood(t), mood1: mood(t + 600) }, rules, Infinity).hazard;
    }
    expect(parts).toBeCloseTo(whole, 3);
  });

  it('episode thresholds are Exp(1): the share that falls ill within an hour of 15 % risk is ~15 %', () => {
    const N = 20_000;
    const limit = -Math.log(1 - 0.15);
    let ill = 0;
    for (let i = 0; i < N; i++) if (episodeThreshold({ id: `pig-${i}`, lastSickAt: undefined }) < limit) ill++;
    expect(Math.abs(ill / N - 0.15)).toBeLessThan(0.01);
    // the same creature and episode always give the same draw; a new episode a new one
    expect(episodeThreshold({ id: 'a', lastSickAt: 5 })).toBe(episodeThreshold({ id: 'a', lastSickAt: 5 }));
    expect(episodeThreshold({ id: 'a', lastSickAt: 5 })).not.toBe(episodeThreshold({ id: 'a', lastSickAt: 6 }));
  });

  const illness = (protectedUntil = 0, blockedUntil = 0) => ({
    risk: rules,
    protectedUntil,
    blockedUntil: () => blockedUntil,
    onset: (c: Creature, at: number) => onsetFields(c, at, 0),
  });
  const starving = { ...fish, hunger: 0 };
  const r = rates({ hungerPerSec: 100 / 3600, cleanPerSec: 0, growthSec: 1e9 });

  it('a creature left starving falls ill, at a time that depends only on its own draw', () => {
    const after = advanceCreature(starving, 100 * H, r, illness(), awake);
    expect(after.isSick).toBe(true);
    const budget = episodeThreshold(starving);
    expect(after.lastSickAt).toBe(Math.round((budget / (-Math.log(1 - 0.15) / 3600)) * 1000));
    // the same, whichever way the time is sliced
    let stepped: Creature = starving;
    for (let t = 600_000; t <= 100 * H; t += 600_000) stepped = advanceCreature(stepped, t, r, illness(), awake);
    expect(stepped.lastSickAt).toBe(after.lastSickAt);
  });

  it('protection: no illness before protectedUntil, and the hazard of that time is not banked', () => {
    const protectedFor = advanceCreature(starving, 50 * H, r, illness(50 * H), awake);
    expect(protectedFor.isSick).toBe(false);
    expect(protectedFor.illRisk).toBe(0);
  });

  it('recovery (blockedUntil) holds the risk off the same way', () => {
    const after = advanceCreature(starving, 10 * H, r, illness(0, 10 * H), awake);
    expect(after.isSick).toBe(false);
  });

  it('a well-kept creature never falls ill', () => {
    const fine = advanceCreature({ ...fish, hunger: 100, cleanliness: 100 }, 20 * H, rates({ hungerPerSec: 0, cleanPerSec: 0, growthSec: 1e9 }), illness(), awake);
    expect(fine.isSick).toBe(false);
  });
});
