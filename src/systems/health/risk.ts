// Illness risk (GAME_BALANCE §2.4): every hour a creature is starving, dirty or low in mood it runs a
// chance of falling ill; the active conditions add up. Modelled as a hazard that accumulates against a
// per-episode threshold (a seeded Exp(1) draw), so *when* a creature falls ill depends only on its own
// state and time, never on how the time span was sliced (1-minute steps, 10-minute steps, one jump).
// Pure.
import { mulberry32, hashSeed } from '../../core/rng';
import type { Creature } from '../creature/types';

export interface RiskRules {
  /** Chance of falling ill within one hour of exposure, per condition (they add up, capped below 1). */
  perHour: { starving: number; dirty: number; lowMood: number };
  /** Cleanliness below this counts as dirty. */
  dirtyBelow: number;
  /** Mood below this counts as low. */
  lowMoodBelow: number;
}

/** Mood used for risk: the mean of hunger, cleanliness and energy (GAME_BALANCE §2.2). */
export const needsMood = (c: Pick<Creature, 'hunger' | 'cleanliness'> & { energy?: number }): number =>
  (c.hunger + c.cleanliness + (c.energy ?? 100)) / 3;

/**
 * The hazard this creature's next illness needs before it starts: Exp(1) from a seed of its id and
 * its last illness (a new episode, a new draw; the same state, the same answer).
 */
export function episodeThreshold(c: Pick<Creature, 'id' | 'lastSickAt'>): number {
  return -Math.log(1 - mulberry32(hashSeed(c.id, c.lastSickAt ?? 'never')).next());
}

export interface RiskSpan {
  /** Length of the span, seconds. */
  dt: number;
  /** Exposure counts from here (seconds from the span start): after protection, recovery, the day's limit. */
  from: number;
  hunger0: number;
  hungerPerSec: number;
  clean0: number;
  cleanPerSec: number;
  /** Mood at the span's start and end (it is close to linear inside a span of a few minutes). */
  mood0: number;
  mood1: number;
}

export interface RiskResult {
  /** Hazard accumulated over the span (up to the onset when there is one). */
  hazard: number;
  /** Seconds from the span start at which the accumulated hazard reached `budget`, or null. */
  onsetAt: number | null;
}

const HOUR = 3600;

/** Hazard of the span against a `budget` (hazard still needed for an onset). */
export function riskOver(span: RiskSpan, rules: RiskRules, budget: number): RiskResult {
  const { dt, from } = span;
  if (from >= dt) return { hazard: 0, onsetAt: null };
  const tStarving = span.hunger0 <= 0 ? 0 : span.hungerPerSec > 0 ? span.hunger0 / span.hungerPerSec : Infinity;
  const tDirty = span.clean0 < rules.dirtyBelow ? 0 : span.cleanPerSec > 0 ? (span.clean0 - rules.dirtyBelow) / span.cleanPerSec : Infinity;
  const L = rules.lowMoodBelow;
  const crossing = (span.mood0 - L) * (span.mood1 - L) < 0 ? (dt * (span.mood0 - L)) / (span.mood0 - span.mood1) : Infinity;
  const mood = (t: number): number => span.mood0 + ((span.mood1 - span.mood0) * t) / dt;

  const edges = [from, tStarving, tDirty, crossing, dt].filter((t) => t >= from && t <= dt).sort((a, b) => a - b);
  let hazard = 0;
  for (let i = 0; i + 1 < edges.length; i++) {
    const a = edges[i]!;
    const b = edges[i + 1]!;
    if (b <= a) continue;
    const mid = (a + b) / 2;
    const p = Math.min(
      0.99,
      (mid >= tStarving ? rules.perHour.starving : 0) + (mid >= tDirty ? rules.perHour.dirty : 0) + (mood(mid) < L ? rules.perHour.lowMood : 0),
    );
    if (p <= 0) continue;
    const lambda = -Math.log(1 - p) / HOUR; // per-second hazard that makes p the chance over one hour
    if (hazard + lambda * (b - a) >= budget) return { hazard: budget, onsetAt: a + (budget - hazard) / lambda };
    hazard += lambda * (b - a);
  }
  return { hazard, onsetAt: null };
}
