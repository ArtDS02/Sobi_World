// Shipping price of a pig (GAME_BALANCE §2.5):
//   price = species base × quality × weight × health × market
// The species' own base (content `sellGold`, set per rarity tier) already carries the rarity step of the
// 69 species, so the rarity multiplier of the spec is not applied a second time (decision 009).
import { gameDay } from '../../../systems/health/disease';
import { BOND } from '../../../core/config/bond';
import { hashSeed, mulberry32 } from '../../../core/rng';
import { heartsOf } from '../../../systems/bond/bond';
import { qualityFromMood, QUALITY_RULES, withBond, type Quality } from '../../../systems/quality/quality';
import { needsMood } from '../../../systems/health/risk';
import { marketFactor } from '../../../systems/valuation/market';
import { healthFactor, valueOf, weightFactor } from '../../../systems/valuation/value';
import { CONTENT } from '../../../core/config/content';
import { DAY_MS } from '../../../core/clock';
import { BREEDS } from './config/breeds';
import { weight } from './derived';
import type { Pig } from './types';

const V = CONTENT.valuation;

/** What the price depends on besides the pig: the day (market) and the farm's decorations (mood). */
export interface PriceContext {
  now: number;
  dayOffsetMs: number;
  decorBonus: number;
}

export interface Quote {
  base: number;
  quality: Quality;
  /** Bond raised the quality one tier. */
  bondLift: boolean;
  qualityFactor: number;
  weightKg: number;
  weightFactor: number;
  /** 1 unless the pig is ill right now. */
  healthFactor: number;
  marketFactor: number;
  price: number;
}

type Priced = Pick<Pig, 'breed' | 'growthProgress' | 'hunger' | 'cleanliness' | 'isSick'> &
  Partial<Pick<Pig, 'id' | 'bond' | 'energy' | 'moodAvg' | 'moodSec' | 'lastSickAt'>>;

/** Tier its lifetime average mood earns (a pig with no history yet counts its mood now), before Bond. */
function moodQuality(pig: Priced, decorBonus: number): Quality {
  const avg = (pig.moodSec ?? 0) > 0 ? pig.moodAvg! : Math.min(100, needsMood(pig) + decorBonus);
  return qualityFromMood(avg, QUALITY_RULES);
}

/**
 * Quality of a pig: its mood tier, lifted one tier by Bond (3 hearts: 20% chance, GAME_BALANCE §2.5). The roll is seeded
 * by the pig's id, so the pig either has the lift or not for good: the quote and the sale always agree.
 */
export function pigQuality(pig: Priced, decorBonus = 0): Quality {
  const q = moodQuality(pig, decorBonus);
  return withBond(q, heartsOf(pig.bond, BOND), mulberry32(hashSeed(pig.id ?? '', 'bond-quality')), QUALITY_RULES);
}

/** Whether Bond lifted the pig's Quality by a tier (the sale dialog says so). */
export const bondLifted = (pig: Priced, decorBonus = 0): boolean => pigQuality(pig, decorBonus) !== moodQuality(pig, decorBonus);

export function sellQuote(pig: Priced, ctx: PriceContext): Quote {
  const base = BREEDS[pig.breed].sellGold;
  const quality = pigQuality(pig, ctx.decorBonus);
  const kg = weight(pig);
  const daysIll = pig.isSick && pig.lastSickAt !== undefined ? Math.max(0, (ctx.now - pig.lastSickAt) / DAY_MS) : 0;
  const factors = {
    quality: QUALITY_RULES.priceFactor[quality],
    weight: weightFactor(kg, BREEDS[pig.breed].maxWeight, V.weightCap),
    health: healthFactor(daysIll, V.healthPenalty.perDay, V.healthPenalty.floor),
    market: marketFactor(gameDay(ctx.now, ctx.dayOffsetMs), V.market),
  };
  return {
    base,
    quality,
    bondLift: bondLifted(pig, ctx.decorBonus),
    qualityFactor: factors.quality,
    weightKg: kg,
    weightFactor: factors.weight,
    healthFactor: factors.health,
    marketFactor: factors.market,
    price: valueOf(base, factors),
  };
}

export const sellPrice = (pig: Priced, ctx: PriceContext): number => sellQuote(pig, ctx).price;
