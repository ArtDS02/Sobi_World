// Piecewise per-pig time simulation (spec §7.2). Pure: `now` and `rng` are injected.
import { BALANCE } from '../../../core/config/balance';
import { BREEDS } from '../../../core/config/breeds';
import type { Rng } from '../../../core/rng';
import type { Pig } from './types';
import { onsetFields, sickBlockedUntil } from './pigHealth';

/** Snap threshold so float drift cannot leave a grown pig at 99.9999...% (spec §7.2). */
const ADULT_SNAP = 99.999999;

/** Constant hazard rate (per second) for the memoryless sickness model (D5). */
const BASE_SICK_LAMBDA =
  -Math.log(1 - BALANCE.SICK_CHANCE_PER_INTERVAL) / BALANCE.SICK_INTERVAL_SEC;

/** `dayOffsetMs`: local time minus UTC, for the per-day disease limit (NH-1). */
export function advancePig(pig: Pig, now: number, rng: Rng, dayOffsetMs = 0): Pig {
  const dt = (now - pig.lastTickedAt) / 1000;
  if (dt <= 0) return { ...pig, lastTickedAt: now }; // D14

  const cfg = BREEDS[pig.breed];
  const hungerRate = BALANCE.HUNGER_MAX / cfg.hungerFullSec; // D16, per breed
  const cleanRate = BALANCE.CLEAN_MAX / cfg.cleanFullSec; // D16, per breed

  // Seconds from lastTickedAt at which thresholds are crossed.
  const tHungerZero = pig.hunger / hungerRate;
  const tCleanBelow =
    pig.cleanliness > BALANCE.SICK_CLEAN_THRESHOLD
      ? (pig.cleanliness - BALANCE.SICK_CLEAN_THRESHOLD) / cleanRate
      : 0;

  // D5 — memoryless sickness onset; starving doubles the hazard (D21). NH-1: exposure only
  // counts once recovery is over and the day's episode budget is free again.
  let tSick = Infinity;
  if (!pig.isSick) {
    const tFrom = Math.max(
      tCleanBelow,
      (sickBlockedUntil(pig, dayOffsetMs) - pig.lastTickedAt) / 1000,
    );
    const exposure = dt - tFrom;
    if (exposure > 0) {
      // `<=` (spec writes `<`): a pig already at hunger 0 is starving even when exposure
      // starts immediately. See DECISIONS S03-1.
      const starving = tHungerZero <= tFrom;
      const lambda = BASE_SICK_LAMBDA * (starving ? BALANCE.SICK_STARVING_MULTIPLIER : 1);
      const sample = -Math.log(1 - rng.next()) / lambda; // rng.next() in [0, 1)
      if (sample < exposure) tSick = tFrom + sample;
    }
  }
  const onset =
    tSick <= dt ? onsetFields(pig, Math.round(pig.lastTickedAt + tSick * 1000), dayOffsetMs) : {};

  // Growth only while fed, healthy and not yet adult.
  let growthSeconds = 0;
  if (!pig.isSick && pig.growthProgress < 100) {
    const tToAdult = ((100 - pig.growthProgress) * cfg.growthSec) / 100;
    growthSeconds = Math.min(dt, tHungerZero, tSick, tToAdult);
  }

  const growthProgress = Math.min(100, pig.growthProgress + (growthSeconds * 100) / cfg.growthSec);

  return {
    ...pig,
    hunger: Math.max(0, pig.hunger - hungerRate * dt),
    cleanliness: Math.max(0, pig.cleanliness - cleanRate * dt),
    growthProgress: growthProgress > ADULT_SNAP ? 100 : growthProgress,
    isSick: pig.isSick,
    ...onset,
    lastTickedAt: now,
  };
}
