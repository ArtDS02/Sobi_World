// Per-breed care decay rates (spec §6.2, D16), derived from the growth-based budgets in BREEDS.
import { BALANCE } from './balance';
import { BREEDS } from './breeds';
import type { BreedId } from './ids';

export interface CareRates {
  hungerPerSec: number;
  cleanPerSec: number;
  /** Seconds from full cleanliness until the sickness threshold is crossed. */
  sickRiskStartSec: number;
}

export function careRates(breed: BreedId): CareRates {
  const { hungerFullSec, cleanFullSec } = BREEDS[breed];
  const cleanPerSec = BALANCE.CLEAN_MAX / cleanFullSec;
  return {
    hungerPerSec: BALANCE.HUNGER_MAX / hungerFullSec,
    cleanPerSec,
    sickRiskStartSec: (BALANCE.CLEAN_MAX - BALANCE.SICK_CLEAN_THRESHOLD) / cleanPerSec,
  };
}

/** Care levels of hunger / cleanliness (NH-1), best first. */
export const NEED_LEVELS = ['good', 'normal', 'low', 'veryLow', 'critical'] as const;
export type NeedLevel = (typeof NEED_LEVELS)[number];

/** Lowest value (inclusive) of each level. TUNABLE. */
export const NEED_LEVEL_MIN: Record<NeedLevel, number> = {
  good: 80,
  normal: 50, // the trough refills at TROUGH_AUTO_FEED_AT (50): a stocked farm stays here
  low: 25,
  veryLow: 10,
  critical: 0,
};

/** Dropping into this level or a worse one raises PIG_NEED_DROPPED, once per drop. */
export const NEED_NOTIFY_FROM: NeedLevel = 'low';
