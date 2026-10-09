// NPC orders (spec §8.14, D20): derived from the clock, so the same window always yields the same
// orders and no seed is stored. DECISIONS C1 (cap 6), U04-1 (breed weighted by rarity, was Q1),
// Q2 (no regen), Q3 (hash).
import { BALANCE, RARITY_ORDER_WEIGHT } from './config/balance';
import { BREEDS } from './config/breeds';
import { GENDER_VALUES } from '../../../core/config/ids';
import { BREED_ID_VALUES, type BreedId } from './config/ids';
import type { GameEvent } from './events';
import { mulberry32, orderSeed, pick } from '../../../core/rng';
import type { Order, FarmGame } from './types';
import { weightedPick } from './breeding';

const MIN_HAPPINESS = [0, 50, 75] as const;
const GENDER_CHANCE = 0.4;

export const orderWindowIndex = (now: number): number => Math.floor(now / BALANCE.ORDER_WINDOW_MS);

/**
 * The order for one slot of one window. `breeds` must be non-empty; it is sorted into config order
 * so the result does not depend on the order in which breeds were discovered.
 */
export function generateOrder(
  windowIndex: number,
  slot: number,
  breeds: readonly BreedId[],
): Order {
  const rng = mulberry32(orderSeed(windowIndex, slot));
  const pool = BREED_ID_VALUES.filter((b) => breeds.includes(b)).map((breed) => ({
    breed,
    weight: RARITY_ORDER_WEIGHT[BREEDS[breed].rarity],
  }));
  const createdAt = windowIndex * BALANCE.ORDER_WINDOW_MS;
  const wantBreed = weightedPick(rng, pool);
  const wantGender = rng.next() < GENDER_CHANCE ? pick(rng, GENDER_VALUES) : null;
  const minHappiness = pick(rng, MIN_HAPPINESS);
  return {
    id: `${windowIndex}:${slot}`,
    createdAt,
    expiresAt: createdAt + BALANCE.ORDER_TTL_MS,
    wantBreed,
    wantGender,
    minHappiness,
    rewardGold: Math.round(BREEDS[wantBreed].sellGold * BALANCE.ORDER_REWARD_MULT[minHappiness]),
    rewardXp: BALANCE.XP.ORDER,
    fulfilledAt: null,
  };
}

/**
 * advanceWorld step 4: drop expired orders (ORDER_EXPIRED), add the current window's missing
 * orders (ORDER_NEW). An id already in state is never generated again (Q2). Idempotent for `now`.
 */
export function refreshOrders(
  state: FarmGame,
  now: number,
): { state: FarmGame; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const kept = state.orders.filter((o) => {
    if (o.expiresAt > now) return true;
    events.push({ type: 'ORDER_EXPIRED', orderId: o.id });
    return false;
  });
  const breeds = state.collection.discoveredBreeds;
  const windowIndex = orderWindowIndex(now);
  const added: Order[] = [];
  if (breeds.length > 0) {
    for (let slot = 0; slot < BALANCE.ORDER_SLOTS_PER_WINDOW; slot += 1) {
      const id = `${windowIndex}:${slot}`;
      if (kept.some((o) => o.id === id)) continue;
      if (kept.length + added.length >= BALANCE.ORDER_MAX_ACTIVE) break;
      added.push(generateOrder(windowIndex, slot, breeds));
      events.push({ type: 'ORDER_NEW', orderId: id });
    }
  }
  if (events.length === 0) return { state, events };
  return { state: { ...state, orders: [...kept, ...added] }, events };
}
