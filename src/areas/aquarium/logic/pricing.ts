// Selling price of a fish out of the tank (GAME_BALANCE §2.5 adapted): tank price × growth × quality × health × traits.
// A caught fish still in the bag is worth its item's own `sellGold`; raising it is what makes it worth more.
import { DAY_MS } from '../../../core/clock';
import { CONTENT } from '../../../core/config/content';
import { hashSeed, mulberry32 } from '../../../core/rng';
import { qualityFromMood, QUALITY_RULES, withBond, type Quality } from '../../../systems/quality/quality';
import { needsMood } from '../../../systems/health/risk';
import { healthFactor, valueOf } from '../../../systems/valuation/value';
import { AB, FISH } from './config/content';
import { fishHearts, fishTraitFactor } from './fishLife';
import type { Fish } from './state';

const V = CONTENT.valuation;

export interface FishQuote {
  base: number;
  quality: Quality;
  bondLift: boolean;
  qualityFactor: number;
  /** Share of the tank price a fish of this size fetches. */
  growthFactor: number;
  healthFactor: number;
  traitFactor: number;
  price: number;
}

/** Tier its lifetime average mood earns (a fish with no history yet counts its mood now), before Bond. */
function moodQuality(f: Fish): Quality {
  const avg = (f.moodSec ?? 0) > 0 ? f.moodAvg! : needsMood({ ...f, energy: f.energy ?? 100 });
  return qualityFromMood(avg, QUALITY_RULES);
}

/** Quality of a fish: its mood tier, lifted one tier by Bond; the roll is seeded by its id so quote and sale agree. */
export const fishQuality = (f: Fish): Quality =>
  withBond(moodQuality(f), fishHearts(f), mulberry32(hashSeed(f.id, 'bond-quality')), QUALITY_RULES);

/** Share of the price: `minShare` when it reaches adult size, rising to 1 when it is fully grown. */
export function growthFactor(progress: number): number {
  const { stageAdultAt } = AB.life;
  if (progress >= 100) return 1;
  return AB.sell.minShare + ((1 - AB.sell.minShare) * Math.max(0, progress - stageAdultAt)) / (100 - stageAdultAt);
}

export function fishQuote(f: Fish, now: number): FishQuote {
  const base = FISH[f.breed]!.tankGold;
  const quality = fishQuality(f);
  const daysIll = f.isSick && f.lastSickAt !== undefined ? Math.max(0, (now - f.lastSickAt) / DAY_MS) : 0;
  const factors = {
    quality: QUALITY_RULES.priceFactor[quality],
    growth: growthFactor(f.growthProgress),
    health: healthFactor(daysIll, V.healthPenalty.perDay, V.healthPenalty.floor),
    trait: fishTraitFactor(f, 'sellValue'),
  };
  return {
    base,
    quality,
    bondLift: quality !== moodQuality(f),
    qualityFactor: factors.quality,
    growthFactor: factors.growth,
    healthFactor: factors.health,
    traitFactor: factors.trait,
    price: valueOf(base, factors),
  };
}
