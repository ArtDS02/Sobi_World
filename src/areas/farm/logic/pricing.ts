// Sell price (spec §5.4, D18): the species' base price times a care factor in [0.7, 1.2] from
// happiness (systems/valuation). GĐ2 adds the Sobi World factors (rarity, quality, weight, health,
// market) here.
import { linearFactor, valueOf } from '../../../systems/valuation/value';
import { BALANCE } from './config/balance';
import { BREEDS } from './config/breeds';
import type { Pig } from './types';
import { happiness } from './happiness';

/** Price multiplier for an integer happiness 0..100. */
export const sellMultiplier = (happy: number): number =>
  linearFactor(happy, BALANCE.SELL_MULT_MIN, BALANCE.SELL_MULT_SPAN);

export function sellPrice(
  pig: Pick<Pig, 'breed' | 'cleanliness' | 'hunger' | 'isSick'>,
  decorBonus = 0,
): number {
  return valueOf(BREEDS[pig.breed].sellGold, { care: sellMultiplier(happiness(pig, decorBonus)) });
}
