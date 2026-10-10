// One pig over time (spec §7.2): the shared creature simulation (systems/creature) with the farm's
// rates, its sleep (the night period) and the world's health rules. Pure.
import { isNight, nextPeriodStart } from '../../../core/clock';
import { HEALTH } from '../../../core/config/health';
import { TIME } from '../../../core/config/time';
import type { Rng } from '../../../core/rng';
import { advanceCreature } from '../../../systems/creature/advance';
import type { SleepRules } from '../../../systems/creature/sleep';
import { BALANCE } from './config/balance';
import { BREEDS } from './config/breeds';
import { pigTraitFactor } from './heredity';
import { onsetFields, sickBlockedUntil } from './pigHealth';
import type { Pig } from './types';

const perSec = (perHour: number): number => perHour / 3600;

/** Pigs sleep in the night period (GAME_BALANCE §2.2). */
export const farmSleep = (dayOffsetMs: number): SleepRules => ({
  asleepAt: (t) => isNight(t, dayOffsetMs, TIME),
  nextChange: (t) => nextPeriodStart(t, dayOffsetMs, TIME),
});

/**
 * `dayOffsetMs`: local time minus UTC, for the day periods and the per-day disease limit (NH-1).
 * `piles`: piles of manure in the pen at the start of the window; each one makes the pen dirtier.
 * `createdAt`: when the world began, for the new-world protection from illness.
 * `moodBonus`: the farm's decoration bonus, which lifts the mood that decides Quality.
 * `_rng`: sickness is seeded per pig and episode (systems/health/risk), not drawn from the stream;
 * the parameter stays so that every caller keeps one signature.
 */
export function advancePig(pig: Pig, now: number, _rng: Rng, dayOffsetMs = 0, piles = 0, createdAt = 0, moodBonus = 0): Pig {
  const counted = Math.min(piles, BALANCE.CLEAN_PILES_COUNTED);
  return advanceCreature(
    pig,
    now,
    {
      hungerPerSec: perSec(BALANCE.HUNGER_PER_HOUR),
      cleanPerSec: perSec(BALANCE.CLEAN_PER_HOUR + counted * BALANCE.CLEAN_PER_PILE_PER_HOUR),
      growthSec: BREEDS[pig.breed].growthSec / pigTraitFactor(pig, 'growth'),
      energy: { awakePerSec: perSec(BALANCE.ENERGY_AWAKE_PER_HOUR), asleepPerSec: perSec(BALANCE.ENERGY_ASLEEP_PER_HOUR) },
      growthMinHunger: BALANCE.GROWTH_MIN_HUNGER,
      poopFromProgress: BALANCE.STAGE_YOUNG_AT,
      poopSec: BALANCE.POOP_INTERVAL_SEC,
      moodBonus,
    },
    {
      risk: HEALTH.risk,
      protectedUntil: createdAt + HEALTH.newPlayerProtectionMs,
      blockedUntil: (c) => sickBlockedUntil(c as Pig, dayOffsetMs),
      onset: (c, at) => onsetFields(c as Pig, at, dayOffsetMs),
    },
    farmSleep(dayOffsetMs),
  );
}
