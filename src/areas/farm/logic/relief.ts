// Neighbour's help (DECISIONS PG-1): what the farm needs to get unstuck, or null when it can still
// progress on its own (something to sell, a litter or a gift coming, or money for food / a pig).
import { BREEDS, BREED_IDS } from '../../../core/config/breeds';
import { ITEMS } from '../../../core/config/items';
import { levelFromXp } from '../../../core/config/levels';
import { RELIEF } from '../../../core/config/relief';
import type { FarmGame } from './types';

export interface ReliefNeed {
  gold: number;
  food: number;
  medicine: number;
}

/** Cheapest pig the shop sells at the player's level (null: none). */
function cheapestPig(state: FarmGame): number | null {
  const level = levelFromXp(state.player.xp);
  const prices = BREED_IDS.map((id) => BREEDS[id])
    .filter((b) => b.enabled && b.buyGold !== null && b.unlockLevel <= level)
    .map((b) => b.buyGold!);
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function reliefNeed(state: FarmGame): ReliefNeed | null {
  const { gold } = state.player;
  const coming =
    state.gifts.boxes.length > 0 ||
    state.nursery.length > 0 || // a newborn to raise (BR-1)
    state.pigs.some((p) => p.pregnancy !== null || p.growthProgress >= 100);
  if (coming) return null;

  if (state.pigs.length === 0) {
    const price = cheapestPig(state);
    if (price === null || gold >= price) return null;
    const want = price + RELIEF.START_FOOD * ITEMS.FOOD_BASIC.priceGold;
    return { gold: want - gold, food: 0, medicine: 0 };
  }

  const noFood =
    state.trough.food === 0 &&
    state.inventory.FOOD_BASIC === 0 &&
    gold < ITEMS.FOOD_BASIC.priceGold;
  const sick = state.pigs.filter((p) => p.isSick).length;
  const noMedicine =
    sick > 0 && state.inventory.MEDICINE_COMMON === 0 && gold < ITEMS.MEDICINE_COMMON.priceGold;
  if (!noFood && !noMedicine) return null;
  return {
    gold: 0,
    food: noFood ? RELIEF.FOOD : 0,
    medicine: noMedicine ? Math.min(sick, RELIEF.MEDICINE_MAX) : 0,
  };
}
