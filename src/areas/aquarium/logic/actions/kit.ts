// Shared pipeline of the Aquarium's actions (like the Garden's runGarden): catch the tank up to `now`, run the action
// on the caught-up world, then add its XP (and the level-up it earns).
import type { ErrorCode } from '../../../../core/config/errors';
import { INVENTORY } from '../../../../core/config/inventory';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { changeCurrency } from '../../../../core/economy/ledger';
import { addAllToBag, addToBag, takeFromBag } from '../../../../core/inventory/bag';
import { areaXp, worldLevel } from '../../../../core/progression/levels';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../../core/types';
import { AQUARIUM_AREA_ID } from '../config/content';
import type { AquariumEvent } from '../events';
import { advanceAquariumWorld } from '../simulate';
import { aquariumOf, withAquarium } from '../save/lens';
import type { AquariumState } from '../state';

export type AquariumResult = ActionResultOf<WorldSave>;

/** What an action body returns: the world it made, what happened, and the XP it earned. */
export type Body = { ok: true; world: WorldSave; events: AquariumEvent[]; xp?: number } | { ok: false; error: ErrorCode };

export function runAquarium(world: WorldSave, ctx: ActionContext, body: (w: WorldSave, a: AquariumState) => Body): AquariumResult {
  const caught = advanceAquariumWorld(world, ctx.now, ctx.dayOffsetMs ?? 0, 'online');
  const r = body(caught.state, aquariumOf(caught.state));
  if (!r.ok) return r;
  const events: AquariumEvent[] = [...caught.events, ...r.events];
  let next = r.world;
  const gain = r.xp ?? 0;
  if (gain > 0) {
    const before = worldLevel(next, WORLD_LEVELS);
    const xp = areaXp(next, AQUARIUM_AREA_ID) + gain;
    next = { ...next, progression: { ...next.progression, areas: { ...next.progression.areas, [AQUARIUM_AREA_ID]: { xp } } } };
    // The level is the world's (decision 007): any Area's XP can raise it.
    const level = worldLevel(next, WORLD_LEVELS);
    if (level > before) events.push({ type: 'AQUARIUM_LEVEL_UP', level });
  }
  return { ok: true, state: { ...next, meta: { ...next.meta, updatedAt: ctx.now } }, events };
}

/** The world with the aquarium slice replaced. */
export const put = (w: WorldSave, a: AquariumState): WorldSave => withAquarium(w, a);

export const countOf = (w: WorldSave, itemId: string): number => w.inventory.items[itemId] ?? 0;

type Step = { ok: true; world: WorldSave } | { ok: false; error: ErrorCode };

/** The world with `qty` of an item taken from the bag, or the error. */
export function take(w: WorldSave, itemId: string, qty: number): Step {
  const bag = takeFromBag(w.inventory.items, itemId, qty);
  return bag.ok ? { ok: true, world: { ...w, inventory: { items: bag.items } } } : bag;
}

/** The world with items added to the bag (all or nothing), or INVENTORY_FULL. */
export function give(w: WorldSave, gains: Readonly<Record<string, number>>): Step {
  const bag = addAllToBag(w.inventory.items, gains, INVENTORY);
  return bag.ok ? { ok: true, world: { ...w, inventory: { items: bag.items } } } : bag;
}

export const fits = (w: WorldSave, itemId: string, qty: number): boolean => addToBag(w.inventory.items, itemId, qty, INVENTORY).ok;

/** Coins out (negative) or in, through the ledger. */
export function pay(w: WorldSave, amount: number, type: string, ctx: ActionContext, ref: { refId?: string; note?: string } = {}) {
  return changeCurrency(w, 'coins', amount, { type, ...ref }, ctx);
}

/** Replaces one fish of the tank. */
export const mapFish = (a: AquariumState, id: string, f: (fish: AquariumState['fish'][number]) => AquariumState['fish'][number]): AquariumState => ({
  ...a,
  fish: a.fish.map((x) => (x.id === id ? f(x) : x)),
});
