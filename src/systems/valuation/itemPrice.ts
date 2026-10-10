// What the shop pays for items today: the item's sale price times the day's market of its group (spec V2 §9). Pure.
import { CONTENT } from '../../core/config/content';
import { gameDay } from '../health/disease';
import { dailyMarket, marketGroupOf } from './market';

export interface Sellable {
  category: string;
  sellGold?: number | undefined;
}

/** The market factor of an item today (1 when its category does not move). */
export function itemMarketFactor(item: Pick<Sellable, 'category'>, now: number, dayOffsetMs: number): number {
  const group = marketGroupOf(item.category);
  return group ? dailyMarket(gameDay(now, dayOffsetMs), CONTENT.valuation.market).factors[group] : 1;
}

/** Coins for `quantity` units sold at `now` (whole coins, never rounded up past the market). */
export const itemSalePrice = (item: Sellable, quantity: number, now: number, dayOffsetMs: number): number =>
  Math.floor((item.sellGold ?? 0) * quantity * itemMarketFactor(item, now, dayOffsetMs) + 1e-9);
