// The merchant's calendar (GĐ12): which game days he is in the plaza and which group of goods he wants. A pure function of the
// day, so the market (systems/valuation) and the merchant's own screen agree without sharing any state.
import type { MarketGroup } from '../../../content/schemas/vocab';
import { MARKET_GROUP_VALUES } from '../../../content/schemas/vocab';
import { hashSeed, mulberry32 } from '../rng';

export interface MerchantCalendar {
  visitChance: number;
}

/** The merchant is in the plaza on game day `day`; `forced` (the Admin's switch) wins when set. */
export const merchantVisits = (day: number, rules: MerchantCalendar, forced: boolean | null = null): boolean =>
  forced ?? mulberry32(hashSeed('merchant-visit', day)).next() < rules.visitChance;

/** The group of goods he pays extra for on game day `day`. */
export const merchantWants = (day: number): MarketGroup =>
  MARKET_GROUP_VALUES[Math.floor(mulberry32(hashSeed('merchant-wants', day)).next() * MARKET_GROUP_VALUES.length)]!;
