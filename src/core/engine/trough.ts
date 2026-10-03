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

/** Timing facts for the away summary (§9.5). Times are epoch ms. */
export interface TroughReport {
  /** When the last unit was eaten, if the trough ran dry this window with a pig still hungry. */
  emptiedAt: number | null;
  /** Pigs whose hunger reached 0 during this window, with the crossing time. */
  hungerZeroAt: Record<string, number>;
  /** Pigs that ate from the trough this window: meals and hunger just before the first (PL-1). */
  meals: Record<string, { meals: number; hungerBefore: number }>;
}

export interface ResolvedWindow extends FarmWindow {
  report: TroughReport;
}

/** Deterministic processing order: ascending slotIndex (§7.3). */
const bySlot = (pigs: readonly Pig[]): Pig[] => [...pigs].sort((a, b) => a.slotIndex - b.slotIndex);

const hungerRate = (pig: Pig): number => BALANCE.HUNGER_MAX / BREEDS[pig.breed].hungerFullSec;

/**
 * Credits every auto-feed of the window [pig.lastTickedAt, now] as hunger, in slotIndex order.
 *
 * Intentional approximation (DECISIONS Q4): meals are added up front and advancePig then
 * subtracts decay for the same interval. Hunger is NOT capped at 100 here (DECISIONS S04A-1):
 * the intermediate value may exceed 100 and is only valid as input to advancePig over the
 * same window — use `advanceWithTrough`, never this function alone.
 */
export function resolveTrough(win: FarmWindow, now: number): ResolvedWindow {
  const noReport: TroughReport = { emptiedAt: null, hungerZeroAt: {}, meals: {} };
  if (now < win.trough.lastResolvedAt) {
    return { pigs: win.pigs, trough: { ...win.trough, lastResolvedAt: now }, report: noReport }; // D14
  }

  const startFood = win.trough.food;
  let food = startFood;
  let deprived = false; // some pig wanted a meal the trough could not give
  let lastMealAt = -Infinity;
  const fed = new Map<string, number>();
  const meals: TroughReport['meals'] = {};

  for (const pig of bySlot(win.pigs)) {
    const dt = Math.max(0, (now - pig.lastTickedAt) / 1000);
    const r = hungerRate(pig); // hunger per second
    const tFirst = Math.max(0, (pig.hunger - BALANCE.TROUGH_AUTO_FEED_AT) / r);
    if (tFirst >= dt) continue; // not hungry enough in this window
    if (food <= 0) {
      deprived = true;
      continue;
    }
    const period = BALANCE.FOOD_HUNGER_RESTORE / r; // seconds between two auto-feeds
    const possible = 1 + Math.floor((dt - tFirst) / period);
    const eaten = Math.min(possible, food);
    if (eaten < possible) deprived = true;
    food -= eaten;
    fed.set(pig.id, pig.hunger + eaten * BALANCE.FOOD_HUNGER_RESTORE);
    meals[pig.id] = { meals: eaten, hungerBefore: Math.max(0, pig.hunger - r * tFirst) };
    lastMealAt = Math.max(lastMealAt, pig.lastTickedAt + (tFirst + (eaten - 1) * period) * 1000);
  }

  const emptiedAt = startFood > 0 && food === 0 && deprived ? Math.round(lastMealAt) : null;
  return {
    pigs: win.pigs.map((p) => {
      const hunger = fed.get(p.id);
      return hunger === undefined ? p : { ...p, hunger };
    }),
    trough: { ...win.trough, food, lastResolvedAt: now },
    report: { emptiedAt, hungerZeroAt: {}, meals },
  };
}

/** One window: resolveTrough THEN advancePig for every pig (mandatory order, §7.3). */
export function advanceWithTrough(
  win: FarmWindow,
  now: number,
  rng: Rng,
  dayOffsetMs = 0,
): ResolvedWindow {
  const resolved = resolveTrough(win, now);
  const hungerZeroAt: Record<string, number> = {};
  // rng is consumed in slotIndex order so results do not depend on array order.
  const advanced = new Map(
    bySlot(resolved.pigs).map((p) => {
      const next = advancePig(p, now, rng, dayOffsetMs);
      if (p.hunger > 0 && next.hunger === 0 && now > p.lastTickedAt) {
        hungerZeroAt[p.id] = Math.round(p.lastTickedAt + (p.hunger / hungerRate(p)) * 1000);
      }
      return [p.id, { ...next, hunger: Math.min(BALANCE.HUNGER_MAX, next.hunger) }] as const;
    }),
  );
  return {
    pigs: resolved.pigs.map((p) => advanced.get(p.id) ?? p),
    trough: resolved.trough,
    report: { ...resolved.report, hungerZeroAt },
  };
}
