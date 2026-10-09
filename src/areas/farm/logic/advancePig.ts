// One pig over time (spec §7.2): the shared creature simulation (systems/creature) with its species'
// rates and the farm's sickness rules. Pure: `now` and `rng` are injected.
import type { Rng } from '../../../core/rng';
import { advanceCreature, hazardPerSec } from '../../../systems/creature/advance';
import { BALANCE } from './config/balance';
import { BREEDS } from './config/breeds';
import { onsetFields, sickBlockedUntil } from './pigHealth';
import type { Pig } from './types';

/** Constant hazard rate (per second) for the memoryless sickness model (D5). */
const BASE_SICK_LAMBDA = hazardPerSec(BALANCE.SICK_CHANCE_PER_INTERVAL, BALANCE.SICK_INTERVAL_SEC);

/** `dayOffsetMs`: local time minus UTC, for the per-day disease limit (NH-1). */
export function advancePig(pig: Pig, now: number, rng: Rng, dayOffsetMs = 0): Pig {
  const cfg = BREEDS[pig.breed];
  return advanceCreature(
    pig,
    now,
    rng,
    {
      hungerPerSec: BALANCE.HUNGER_MAX / cfg.hungerFullSec, // D16, per breed
      cleanPerSec: BALANCE.CLEAN_MAX / cfg.cleanFullSec,
      growthSec: cfg.growthSec,
    },
    {
      cleanThreshold: BALANCE.SICK_CLEAN_THRESHOLD,
      lambda: BASE_SICK_LAMBDA,
      starvingMultiplier: BALANCE.SICK_STARVING_MULTIPLIER, // D21
      blockedUntil: (c) => sickBlockedUntil(c as Pig, dayOffsetMs),
      onset: (c, at) => onsetFields(c as Pig, at, dayOffsetMs),
    },
  );
}
