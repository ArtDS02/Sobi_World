// Piecewise time simulation of one creature (spec §7.2): needs decay, energy and sleep, growth while
// fed and healthy, manure, illness onset. Closed form over [lastTickedAt, now], so one call covers a
// 1 s tick or a 30-day absence alike (ARCHITECTURE §5: one formula for every mode). Pure.
import { episodeThreshold, needsMood, riskOver, type RiskRules } from '../health/risk';
import { GROWN_SNAP } from './growth';
import { energyAfter, type EnergyRates, type SleepRules } from './sleep';
import type { Creature } from './types';

export interface CreatureRates {
  hungerPerSec: number;
  /** Cleanliness lost per second, including whatever the Area adds (the farm: unraked manure). */
  cleanPerSec: number;
  /** Seconds from 0 to grown at full care. */
  growthSec: number;
  energy: EnergyRates;
  /** Growth needs hunger above this. */
  growthMinHunger: number;
  /** A creature at or past this growth progress (%) makes one pile of manure every `poopSec`. */
  poopFromProgress: number;
  poopSec: number;
}

export interface IllnessRules {
  risk: RiskRules;
  /** Nothing falls ill before this time (a new world's first hours). */
  protectedUntil: number;
  /** Earliest epoch ms an episode may start (recovery, per-day limit). */
  blockedUntil(c: Creature): number;
  /** Fields written when an episode starts at `at`. */
  onset(c: Creature, at: number): Partial<Pick<Creature, 'isSick' | 'lastSickAt' | 'sickDay' | 'sickEpisodes'>>;
}

/**
 * `c` simulated up to `now`. Hunger and cleanliness floor at 0; energy follows sleep; growth only
 * while fed (hunger above the minimum) and healthy; manure accrues while Young or older; illness
 * starts when the accumulated risk reaches the creature's episode threshold.
 */
export function advanceCreature<C extends Creature>(c: C, now: number, rates: CreatureRates, health: IllnessRules, sleep: SleepRules): C {
  const dt = (now - c.lastTickedAt) / 1000;
  if (dt <= 0) return { ...c, lastTickedAt: now }; // D14: never backwards

  const hunger = Math.max(0, c.hunger - rates.hungerPerSec * dt);
  const cleanliness = Math.max(0, c.cleanliness - rates.cleanPerSec * dt);
  const energy = energyAfter(c.energy ?? 100, c.lastTickedAt, now, rates.energy, sleep);

  // Illness: exposure counts once protection, recovery and the day's episode budget are over.
  let onsetAt: number | null = null;
  let illRisk = c.illRisk ?? 0;
  if (!c.isSick) {
    const from = Math.max(0, (Math.max(health.blockedUntil(c), health.protectedUntil) - c.lastTickedAt) / 1000);
    const risk = riskOver(
      {
        dt,
        from,
        hunger0: c.hunger,
        hungerPerSec: rates.hungerPerSec,
        clean0: c.cleanliness,
        cleanPerSec: rates.cleanPerSec,
        mood0: needsMood({ ...c, energy: c.energy ?? 100 }),
        mood1: needsMood({ hunger, cleanliness, energy }),
      },
      health.risk,
      Math.max(0, episodeThreshold(c) - illRisk),
    );
    onsetAt = risk.onsetAt;
    illRisk = onsetAt === null ? illRisk + risk.hazard : 0;
  }
  const tSick = onsetAt ?? Infinity;
  const onset = onsetAt === null ? {} : health.onset(c, Math.round(c.lastTickedAt + onsetAt * 1000));

  // Growth only while fed (hunger above the minimum), healthy and not yet grown.
  let growthSeconds = 0;
  if (!c.isSick && c.growthProgress < 100) {
    const tToGrown = ((100 - c.growthProgress) * rates.growthSec) / 100;
    const tFed = c.hunger > rates.growthMinHunger ? (c.hunger - rates.growthMinHunger) / rates.hungerPerSec : 0;
    growthSeconds = Math.min(dt, tFed, tSick, tToGrown);
  }
  const growthProgress = Math.min(100, c.growthProgress + (growthSeconds * 100) / rates.growthSec);

  return {
    ...c,
    hunger,
    cleanliness,
    growthProgress: growthProgress > GROWN_SNAP ? 100 : growthProgress,
    isSick: c.isSick,
    energy,
    poopProgress: (c.poopProgress ?? 0) + (c.growthProgress >= rates.poopFromProgress ? dt / rates.poopSec : 0),
    illRisk,
    ...onset,
    lastTickedAt: now,
  };
}
