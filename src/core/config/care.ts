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
