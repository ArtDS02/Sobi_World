// Pig life simulation rules (DECISIONS PL-1): personality, sleepiness and the need priority that
// picks what a pig does next. Pure and deterministic — `now` arrives as elapsed ms, randomness as
// rolls derived from the pig id; the farm view (game/state/pigBrain.ts) plays the result.
import { PIG_LIFE, SLEEP_LEVELS, type SleepLevel } from '../config/pigLife';
import type { Pig } from '../types';
import { needLevel, needRank } from './pigHealth';

const S = PIG_LIFE.sleep;
const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

export interface Personality {
  foodDrive: number;
  thirstDrive: number;
  energy: number;
  social: number;
  curiosity: number;
  laziness: number;
}

const TRAITS = ['foodDrive', 'thirstDrive', 'energy', 'social', 'curiosity', 'laziness'] as const;

/** FNV-1a 32-bit hash of a string. */
export function lifeHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic roll in [0, 1] for (pig, step, salt). */
export const lifeRoll = (pigId: string, step: number, salt: number): number =>
  (lifeHash(`${pigId}:${step}:${salt}`) % 10007) / 10006;

/** Fixed per pig id, so it survives save / load without being stored. */
export function personalityOf(pigId: string): Personality {
  const p = {} as Personality;
  TRAITS.forEach((t, i) => (p[t] = lifeRoll(pigId, 0, 100 + i)));
  return p;
}

/** A 0..1 trait as a multiplier around 1 (± personality.spread). */
export const traitScale = (t: number): number => 1 + PIG_LIFE.personality.spread * (2 * t - 1);

export function sleepLevel(value: number): SleepLevel {
  return [...SLEEP_LEVELS].reverse().find((l) => value >= S.levelMin[l]) ?? 'awake';
}

/** Lazy pigs tire faster, energetic ones slower. */
export const tireRate = (p: Personality): number => traitScale(p.laziness) / traitScale(p.energy);

const clamp100 = (v: number) => Math.min(100, Math.max(0, v));

/** Sleepiness after `dtMs` of game time awake or asleep, by day or at night. */
export function sleepinessAfter(
  value: number,
  dtMs: number,
  asleep: boolean,
  night: boolean,
  p: Personality,
): number {
  if (dtMs <= 0) return value;
  if (asleep) {
    const fall = night
      ? (S.nightRecoverPerHour * dtMs) / HOUR_MS
      : (S.napRecoverPerMin * dtMs) / MIN_MS;
    return clamp100(value - fall);
  }
  const rise = night ? (S.nightRisePerMin * dtMs) / MIN_MS : (S.dayRisePerHour * dtMs) / HOUR_MS;
  return clamp100(value + rise * tireRate(p));
}

/** A pig appearing (spawn, load) at night is asleep; by day it has been up since dawn. */
export function initialSleepiness(night: boolean, msSinceDawn: number, p: Personality): number {
  if (night) return S.nightSleepAt;
  return Math.min(S.loadCap, (S.dayRisePerHour * tireRate(p) * Math.max(0, msSinceDawn)) / HOUR_MS);
}

/** After the night, each pig gets up a little later than the first (lazier = later). */
export const wakeDelayMs = (pigId: string, p: Personality): number =>
  S.wakeSpreadMs * (0.6 * p.laziness + 0.4 * lifeRoll(pigId, 0, 7));

export interface SleepCheck {
  sleepiness: number;
  night: boolean;
  asleep: boolean;
  /** Game time since the night ended (Infinity when it has not ended while watched). */
  sinceDayMs: number;
  wakeDelayMs: number;
}

/**
 * Lie down / keep sleeping. Asleep pigs sleep through the night and their morning wake delay; in
 * the morning every sleeper then gets up, later in the day a nap lasts until rested.
 */
export function wantsSleep(c: SleepCheck): boolean {
  if (!PIG_LIFE.auto.sleep) return false;
  if (c.asleep) {
    if (c.night || c.sinceDayMs < c.wakeDelayMs) return true;
    return c.sinceDayMs >= S.morningMs && c.sleepiness > S.napWakeAt;
  }
  return c.sleepiness >= (c.night ? S.nightSleepAt : S.daySleepAt);
}

/** Sleepiness on waking up: a night's sleep (morning) leaves the pig rested. */
export const sleepinessOnWake = (value: number, sinceDayMs: number): number =>
  sinceDayMs < S.morningMs ? Math.min(value, S.morningLevel) : value;

/** What the pig's needs ask for, most urgent first. */
export type LifeBehavior = 'eatUrgent' | 'sleep' | 'eat' | 'rest' | 'free';
const RANK: readonly LifeBehavior[] = ['eatUrgent', 'sleep', 'eat', 'rest', 'free'];
export const behaviorRank = (b: LifeBehavior): number => RANK.indexOf(b);

export interface LifeInput {
  /** A trough meal already eaten in the data (PIG_ATE_FROM_TROUGH) still to be shown. */
  meal: { hungerBefore: number } | null;
  sleep: boolean;
  sick: boolean;
  pregnant: boolean;
}

/** The hunger before the meal was very low: eating beats sleep (critical hunger). */
export const urgentHunger = (hungerBefore: number): boolean =>
  needRank(needLevel(hungerBefore)) >= needRank('veryLow');

/**
 * Priority (PL-1): critical hunger > sleep > hunger > sick / pregnant rest > free time. Thirst and
 * cleaning slot in here once the farm has a water trough / cleaning spot (LIFE_NEEDS).
 */
export function chooseBehavior(i: LifeInput): LifeBehavior {
  const eat = i.meal !== null && PIG_LIFE.auto.feed;
  if (eat && urgentHunger(i.meal!.hungerBefore)) return 'eatUrgent';
  if (i.sleep) return 'sleep';
  if (eat) return 'eat';
  if (i.sick || i.pregnant) return 'rest';
  return 'free';
}

/** A hungry pig facing an empty trough, or a dirty one, mopes (rests more, wanders less). */
export const mopes = (pig: Pick<Pig, 'hunger' | 'cleanliness'>): boolean =>
  needRank(needLevel(pig.hunger)) >= needRank('low') ||
  needRank(needLevel(pig.cleanliness)) >= needRank('veryLow');

export type FreeChoice = 'social' | 'wander' | 'lookAround' | 'idle';

export interface FreeInput {
  night: boolean;
  moping: boolean;
  /** A friend is free nearby and the social cooldown is over. */
  friendReady: boolean;
}

/** Free time: maybe a friend, otherwise wander / look around / idle by personality weights. */
export function freeChoice(
  p: Personality,
  roll: number,
  socialRoll: number,
  i: FreeInput,
): FreeChoice {
  const awakeAtNight = i.night;
  if (!awakeAtNight && !i.moping && i.friendReady) {
    if (socialRoll < PIG_LIFE.social.chance * p.social) return 'social';
  }
  const w = PIG_LIFE.idle.weights;
  const wander = awakeAtNight
    ? 0
    : (w.wander * traitScale(p.energy) * (i.moping ? 0.4 : 1)) / traitScale(p.laziness);
  const look = w.lookAround * traitScale(p.curiosity);
  const idle = w.idle * traitScale(p.laziness);
  const r = roll * (wander + look + idle);
  if (r < wander) return 'wander';
  return r < wander + look ? 'lookAround' : 'idle';
}

/** Pause before the next activity: longer for lazy or moping pigs, shorter for energetic ones. */
export function restMs(p: Personality, roll: number, moping: boolean): number {
  const I = PIG_LIFE.idle;
  const base = I.restMinMs + roll * (I.restMaxMs - I.restMinMs);
  return (base * traitScale(p.laziness) * (moping ? I.mopeRest : 1)) / traitScale(p.energy);
}

/** Eating time at the trough for `meals` meals. */
export const eatMs = (meals: number): number =>
  Math.min(PIG_LIFE.feed.maxEatMs, Math.max(1, meals) * PIG_LIFE.feed.eatMsPerMeal);

/** Reaction delay to a meal: a high foodDrive runs at once. */
export const reactMs = (p: Personality): number => PIG_LIFE.feed.maxReactMs * (1 - p.foodDrive);

/** Speed multiplier running to the trough. */
export const runSpeed = (p: Personality): number =>
  PIG_LIFE.feed.runSpeed + PIG_LIFE.feed.driveSpeed * p.foodDrive;
