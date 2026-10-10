// Shared pipeline of the Adventure's actions (like the Garden's runGarden): run the action on the world, then add its XP (and
// the level-up it earns) and stamp the time.
import type { ErrorCode } from '../../../../core/config/errors';
import { INVENTORY } from '../../../../core/config/inventory';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { changeCurrency } from '../../../../core/economy/ledger';
import { addToBag, takeFromBag } from '../../../../core/inventory/bag';
import { areaXp, worldLevel } from '../../../../core/progression/levels';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../../core/types';
import { ADVENTURE_AREA_ID } from '../config/content';
import type { AdventureEvent } from '../events';
import { adventureOf, withAdventure } from '../save/lens';
import type { AdventureState } from '../state';

export type AdventureResult = ActionResultOf<WorldSave>;

/** What an action body returns: the world it made, what happened, and the XP it earned. */
export type Body = { ok: true; world: WorldSave; events: AdventureEvent[]; xp?: number } | { ok: false; error: ErrorCode };

export function runAdventure(world: WorldSave, ctx: ActionContext, body: (w: WorldSave, a: AdventureState) => Body): AdventureResult {
  const r = body(world, adventureOf(world));
  if (!r.ok) return r;
  const events: AdventureEvent[] = [...r.events];
  let next = r.world;
  const gain = r.xp ?? 0;
  if (gain > 0) {
    const before = worldLevel(next, WORLD_LEVELS);
    const xp = areaXp(next, ADVENTURE_AREA_ID) + gain;
    next = { ...next, progression: { ...next.progression, areas: { ...next.progression.areas, [ADVENTURE_AREA_ID]: { xp } } } };
    const level = worldLevel(next, WORLD_LEVELS);
    if (level > before) events.push({ type: 'ADVENTURE_LEVEL', level });
  }
  return { ok: true, state: { ...next, meta: { ...next.meta, updatedAt: ctx.now } }, events };
}

export const put = (w: WorldSave, a: AdventureState): WorldSave => withAdventure(w, a);

export const countOf = (w: WorldSave, itemId: string): number => w.inventory.items[itemId] ?? 0;

type Step = { ok: true; world: WorldSave } | { ok: false; error: ErrorCode };

/** `qty` of an item taken from the bag, or the error. */
export function take(w: WorldSave, itemId: string, qty: number): Step {
  const bag = takeFromBag(w.inventory.items, itemId, qty);
  return bag.ok ? { ok: true, world: { ...w, inventory: { items: bag.items } } } : bag;
}

/** As many of `items` as fit in the bag go in; what did not fit is returned (nothing is lost). */
export function giveSome(w: WorldSave, items: Readonly<Record<string, number>>): { world: WorldSave; given: Record<string, number>; left: Record<string, number> } {
  let bag = w.inventory.items;
  const given: Record<string, number> = {};
  const left: Record<string, number> = {};
  for (const [id, want] of Object.entries(items)) {
    let n = want;
    while (n > 0 && !addToBag(bag, id, n, INVENTORY).ok) n -= 1;
    if (n > 0) {
      const r = addToBag(bag, id, n, INVENTORY);
      if (r.ok) bag = r.items;
      given[id] = n;
    }
    if (want - n > 0) left[id] = want - n;
  }
  return { world: { ...w, inventory: { items: bag } }, given, left };
}

/** Coins or gems in (positive) through the ledger. */
export function credit(w: WorldSave, currency: 'coins' | 'gems', amount: number, type: string, ctx: ActionContext, note?: string): WorldSave {
  if (amount <= 0) return w;
  const r = changeCurrency(w, currency, amount, { type, ...(note ? { note } : {}) }, ctx);
  return r.ok ? r.state : w;
}
