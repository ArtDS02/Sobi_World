// Shared pipeline of the Cloud's actions (like the Garden's runGarden): catch the Cloud up to `now`, run the action on the
// caught-up world, then add its XP (and the level-up it earns).
import type { ErrorCode } from '../../../../core/config/errors';
import { INVENTORY } from '../../../../core/config/inventory';
import { changeCurrency } from '../../../../core/economy/ledger';
import { addAllToBag, addToBag, takeFromBag } from '../../../../core/inventory/bag';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { areaXp, worldLevel } from '../../../../core/progression/levels';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../../core/types';
import { CLOUD_AREA_ID } from '../config/content';
import type { CloudEvent } from '../events';
import { advanceCloudWorld } from '../simulate';
import { cloudOf, withCloud } from '../save/lens';
import type { CloudState } from '../state';

export type CloudResult = ActionResultOf<WorldSave>;

/** What an action body returns: the world it made, what happened, and the XP it earned. */
export type Body = { ok: true; world: WorldSave; events: CloudEvent[]; xp?: number } | { ok: false; error: ErrorCode };

export function runCloud(world: WorldSave, ctx: ActionContext, body: (w: WorldSave, g: CloudState) => Body): CloudResult {
  const caught = advanceCloudWorld(world, ctx.now);
  const r = body(caught.state, cloudOf(caught.state));
  if (!r.ok) return r;
  const events: CloudEvent[] = [...caught.events, ...r.events];
  let next = r.world;
  const gain = r.xp ?? 0;
  if (gain > 0) {
    const before = worldLevel(next, WORLD_LEVELS);
    const xp = areaXp(next, CLOUD_AREA_ID) + gain;
    next = { ...next, progression: { ...next.progression, areas: { ...next.progression.areas, [CLOUD_AREA_ID]: { xp } } } };
    // The level is the world's (decision 007): any Area's XP can raise it.
    const level = worldLevel(next, WORLD_LEVELS);
    if (level > before) events.push({ type: 'CLOUD_LEVEL_UP', level });
  }
  return { ok: true, state: { ...next, meta: { ...next.meta, updatedAt: ctx.now } }, events };
}

/** The world with the cloud slice replaced. */
export const put = (w: WorldSave, g: CloudState): WorldSave => withCloud(w, g);

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
