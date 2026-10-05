// Per-breed care decay rates (spec §6.2, D16), derived from the growth-based budgets in BREEDS.
import { NEED_LEVELS, type NeedLevel } from '../../../../../content/schemas/vocab';
import { BALANCE } from './balance';
import { FARM_CONTENT } from './content';
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
export { NEED_LEVELS, type NeedLevel };

/** Lowest value (inclusive) of each level (content/farm/balance.json `care`). The trough refills at
 * TROUGH_AUTO_FEED_AT: a stocked farm stays at `normal`. TUNABLE. */
export const NEED_LEVEL_MIN: Record<NeedLevel, number> = FARM_CONTENT.farmBalance.care.needLevelMin;

/** Dropping into this level or a worse one raises PIG_NEED_DROPPED, once per drop. */
export const NEED_NOTIFY_FROM: NeedLevel = FARM_CONTENT.farmBalance.care.notifyFrom;
