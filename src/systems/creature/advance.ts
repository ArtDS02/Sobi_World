// Piecewise time simulation of one creature (spec §7.2): needs decay, growth while fed and healthy,
// memoryless sickness onset. Closed form over [lastTickedAt, now], so one call covers a 1 s tick or
// a 30-day absence alike (ARCHITECTURE §5: one formula for every mode). Pure: `now` and `rng` injected.
import type { Rng } from '../../core/rng';
import { GROWN_SNAP } from './growth';
import type { Creature } from './types';

export interface CreatureRates {
  hungerPerSec: number;
  cleanPerSec: number;
  /** Seconds from 0 to grown at full care. */
  growthSec: number;
}

export interface SicknessRules {
  /** Exposure starts once cleanliness is at or below this. */
  cleanThreshold: number;
  /** Constant hazard (per second of exposure) of the memoryless onset (D5). */
  lambda: number;
  /** Hazard multiplier while starving (hunger 0). */
  starvingMultiplier: number;
  /** Earliest epoch ms an episode may start (recovery, per-day limit). */
  blockedUntil(c: Creature): number;
  /** Fields written when an episode starts at `at`. */
  onset(c: Creature, at: number): Partial<Pick<Creature, 'isSick' | 'lastSickAt' | 'sickDay' | 'sickEpisodes'>>;
}

/** `c` simulated up to `now`. Hunger and cleanliness floor at 0; growth only while fed and healthy. */
export function advanceCreature<C extends Creature>(c: C, now: number, rng: Rng, rates: CreatureRates, sick: SicknessRules): C {
  const dt = (now - c.lastTickedAt) / 1000;
  if (dt <= 0) return { ...c, lastTickedAt: now }; // D14: never backwards

  // Seconds from lastTickedAt at which thresholds are crossed.
  const tHungerZero = c.hunger / rates.hungerPerSec;
  const tCleanBelow = c.cleanliness > sick.cleanThreshold ? (c.cleanliness - sick.cleanThreshold) / rates.cleanPerSec : 0;

  // D5 — memoryless sickness onset; starving multiplies the hazard (D21). NH-1: exposure only
  // counts once recovery is over and the day's episode budget is free again.
  let tSick = Infinity;
  if (!c.isSick) {
    const tFrom = Math.max(tCleanBelow, (sick.blockedUntil(c) - c.lastTickedAt) / 1000);
    const exposure = dt - tFrom;
    if (exposure > 0) {
      // `<=` (spec writes `<`): a creature already at hunger 0 is starving even when exposure
      // starts immediately. See DECISIONS S03-1.
      const starving = tHungerZero <= tFrom;
      const lambda = sick.lambda * (starving ? sick.starvingMultiplier : 1);
      const sample = -Math.log(1 - rng.next()) / lambda; // rng.next() in [0, 1)
      if (sample < exposure) tSick = tFrom + sample;
    }
  }
  const onset = tSick <= dt ? sick.onset(c, Math.round(c.lastTickedAt + tSick * 1000)) : {};

  // Growth only while fed, healthy and not yet grown.
  let growthSeconds = 0;
  if (!c.isSick && c.growthProgress < 100) {
    const tToGrown = ((100 - c.growthProgress) * rates.growthSec) / 100;
    growthSeconds = Math.min(dt, tHungerZero, tSick, tToGrown);
  }
  const growthProgress = Math.min(100, c.growthProgress + (growthSeconds * 100) / rates.growthSec);

  return {
    ...c,
    hunger: Math.max(0, c.hunger - rates.hungerPerSec * dt),
    cleanliness: Math.max(0, c.cleanliness - rates.cleanPerSec * dt),
    growthProgress: growthProgress > GROWN_SNAP ? 100 : growthProgress,
    isSick: c.isSick,
    ...onset,
    lastTickedAt: now,
  };
}

/** Constant hazard per second for a chance `p` per interval of `intervalSec` (D5). */
export const hazardPerSec = (p: number, intervalSec: number): number => -Math.log(1 - p) / intervalSec;
