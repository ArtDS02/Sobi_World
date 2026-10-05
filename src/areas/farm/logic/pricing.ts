// Sell price (spec §5.4, D18): base sell scaled by a happiness multiplier in [0.7, 1.2].
import { BALANCE } from './config/balance';
import { BREEDS } from './config/breeds';
import type { Pig } from './types';
import { happiness } from './happiness';

/** Price multiplier for an integer happiness 0..100. */
export const sellMultiplier = (happy: number): number =>
  BALANCE.SELL_MULT_MIN + (BALANCE.SELL_MULT_SPAN * happy) / 100;

// Guards floor() against binary float error (e.g. 1200 * 0.95 landing at 1139.999...).
const FLOOR_EPSILON = 1e-9;

export function sellPrice(
  pig: Pick<Pig, 'breed' | 'cleanliness' | 'hunger' | 'isSick'>,
  decorBonus = 0,
): number {
  const raw = BREEDS[pig.breed].sellGold * sellMultiplier(happiness(pig, decorBonus));
  return Math.floor(raw + FLOOR_EPSILON);
}
