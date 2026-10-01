// Feed trough auto-feeding, closed form (spec §7.3, D17). Pure: `now` and `rng` are injected.
import { BALANCE } from '../config/balance';
import { BREEDS } from '../config/breeds';
import type { Rng } from '../rng';
import type { Pig, SaveGame } from '../types';
import { advancePig } from './advancePig';

export type Trough = SaveGame['trough'];

export interface FarmWindow {
  pigs: Pig[];
  trough: Trough;
}

/** Deterministic processing order: ascending slotIndex (§7.3). */
const bySlot = (pigs: readonly Pig[]): Pig[] => [...pigs].sort((a, b) => a.slotIndex - b.slotIndex);

/**
 * Credits every auto-feed of the window [pig.lastTickedAt, now] as hunger, in slotIndex order.
 *
 * Intentional approximation (DECISIONS Q4): meals are added up front and advancePig then
 * subtracts decay for the same window. Hunger is NOT capped at 100 here (DECISIONS S04A-1):
 * the intermediate value may exceed 100 and is only valid as input to advancePig over the
 * same window — use `advanceWithTrough`, never this function alone.
 */
export function resolveTrough(win: FarmWindow, now: number): FarmWindow {
  if (now < win.trough.lastResolvedAt) {
    return { pigs: win.pigs, trough: { ...win.trough, lastResolvedAt: now } }; // D14
  }

  let food = win.trough.food;
  const fed = new Map<string, number>();

  for (const pig of bySlot(win.pigs)) {
    if (food <= 0) break;
    const dt = Math.max(0, (now - pig.lastTickedAt) / 1000);
    const r = BALANCE.HUNGER_MAX / BREEDS[pig.breed].hungerFullSec; // hunger per second
    const tFirst = Math.max(0, (pig.hunger - BALANCE.TROUGH_AUTO_FEED_AT) / r);
    if (tFirst >= dt) continue; // not hungry enough in this window
    const period = BALANCE.FOOD_HUNGER_RESTORE / r; // seconds between two auto-feeds
    const possible = 1 + Math.floor((dt - tFirst) / period);
    const eaten = Math.min(possible, food);
    food -= eaten;
    fed.set(pig.id, pig.hunger + eaten * BALANCE.FOOD_HUNGER_RESTORE);
  }

  return {
    pigs: win.pigs.map((p) => {
      const hunger = fed.get(p.id);
      return hunger === undefined ? p : { ...p, hunger };
    }),
    trough: { ...win.trough, food, lastResolvedAt: now },
  };
}

/** One window: resolveTrough THEN advancePig for every pig (mandatory order, §7.3). */
export function advanceWithTrough(win: FarmWindow, now: number, rng: Rng): FarmWindow {
  const resolved = resolveTrough(win, now);
  // rng is consumed in slotIndex order so results do not depend on array order.
  const advanced = new Map(
    bySlot(resolved.pigs).map((p) => {
      const next = advancePig(p, now, rng);
      return [p.id, { ...next, hunger: Math.min(BALANCE.HUNGER_MAX, next.hunger) }] as const;
    }),
  );
  return {
    pigs: resolved.pigs.map((p) => advanced.get(p.id) ?? p),
    trough: resolved.trough,
  };
}
