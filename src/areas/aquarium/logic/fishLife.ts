// One fish over time (spec V2 §7): the shared creature simulation (systems/creature) with the tank's rates. Fish do
// not sleep; their cleanliness is the water's; an adult sheds a scale instead of dropping manure. Pure.
import { HEALTH } from '../../../core/config/health';
import { BOND } from '../../../core/config/bond';
import { heartsOf } from '../../../systems/bond/bond';
import { advanceCreature } from '../../../systems/creature/advance';
import { growthStage } from '../../../systems/creature/growth';
import type { GrowthStage } from '../../../systems/creature/types';
import { onsetFields, sickBlockedUntil, healthStage, type HealthStage } from '../../../systems/health/disease';
import { TRAITS, traitMultiplier, type Heredity } from '../../../systems/breeding';
import { AB, FISH, HOUR_MS } from './config/content';
import type { Fish } from './state';

const perSec = (perHour: number): number => perHour / 3600;

/** Fish never sleep and never tire. */
const AWAKE = { asleepAt: () => false, nextChange: () => Infinity };

export const fishHearts = (f: Pick<Fish, 'bond'>): number => heartsOf(f.bond, BOND);

/** Multiplier of one trait effect on this fish (hidden traits count from 5 hearts of Bond); 1 without. */
export const fishTraitFactor = (f: Heredity & Pick<Fish, 'bond'>, effect: 'growth' | 'sellValue' | 'bondGain'): number =>
  traitMultiplier(TRAITS, f, fishHearts(f), effect);

export const fishStage = (f: Pick<Fish, 'growthProgress'>): GrowthStage =>
  growthStage(f.growthProgress, AB.life.stageYoungAt, AB.life.stageAdultAt);

/** Adult and past: it can be sold, it sheds scales from MATURE on, it can breed when Mature. */
export const isAdult = (f: Pick<Fish, 'growthProgress'>): boolean => f.growthProgress >= AB.life.stageAdultAt;
export const isGrown = (f: Pick<Fish, 'growthProgress'>): boolean => f.growthProgress >= 100;
export const isPet = (f: Pick<Fish, 'purpose'>): boolean => f.purpose === 'PET';

const RULES = { criticalAfterMs: HEALTH.criticalAfterMs, deathAfterMs: HEALTH.deathAfterMs };
/** How far an illness has come at `at`: ill → critical → dead. */
export const fishHealth = (f: Fish, at: number): HealthStage => healthStage(f, at, RULES);

/**
 * `f` simulated up to `now` in a tank losing `waterPerHour` points of clarity an hour (its cleanliness falls at the
 * same rate, so a fish always has the water's cleanliness). `createdAt` is the world's, for the new-world protection.
 */
export function advanceFish(f: Fish, now: number, waterPerHour: number, dayOffsetMs: number, createdAt: number): Fish {
  const species = FISH[f.breed]!;
  return advanceCreature(
    f,
    now,
    {
      hungerPerSec: perSec(AB.life.hungerPerHour),
      cleanPerSec: perSec(waterPerHour),
      growthSec: (species.growHours * 3600) / fishTraitFactor(f, 'growth'),
      energy: { awakePerSec: 0, asleepPerSec: 0 },
      growthMinHunger: AB.life.growthMinHunger,
      poopFromProgress: 100,
      poopSec: species.scaleHours * 3600,
      moodBonus: 0,
    },
    {
      risk: HEALTH.risk,
      protectedUntil: createdAt + HEALTH.newPlayerProtectionMs,
      blockedUntil: (c) => sickBlockedUntil(c, dayOffsetMs, AB.life.sickMaxPerDay),
      onset: (c, at) => onsetFields(c, at, dayOffsetMs),
    },
    AWAKE,
  ) as Fish;
}

/** Water clarity lost per hour with `count` fish in a tank of this level's filter. */
export const waterLossPerHour = (count: number, waterFactor: number): number =>
  (AB.tank.waterPerHour + AB.tank.waterPerFishPerHour * count) * waterFactor;

export const recoveryMs = AB.life.recoverHours * HOUR_MS;
