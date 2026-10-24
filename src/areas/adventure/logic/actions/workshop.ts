// How a fighter grows besides battles (adventure-big-update-1 §17): the Adventure Shop sells books and battle potions for Sobi Coin, the
// Forge turns materials from every Area into them at once, and an experience book used on a fighter outside a battle gives it
// experience (with its level-ups and their SP, as in battle). Coins go out through the ledger; items leave and enter the shared bag
// all or nothing. Content: content/adventure/workshop.json.
import type { RosterEntry } from '../../../../core/area-registry/registry';
import { INVENTORY } from '../../../../core/config/inventory';
import { addToBag } from '../../../../core/inventory/bag';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { addExp } from '../../../../systems/combat/stats';
import { AB, LEVEL_RULES, TOMES, WORKSHOP, identityOf } from '../config/content';
import type { AdventureEvent } from '../events';
import { fighterOf } from './camp';
import { countOf, put, runAdventure, spend, take, type AdventureResult, type Body } from './kit';

/** Most of one line bought, or one recipe made, in one go. */
export const WORKSHOP_MAX = 99;

const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= WORKSHOP_MAX;

/** Items into the bag, all of them or none. */
function bagAll(w: WorldSave, items: Readonly<Record<string, number>>): { ok: true; world: WorldSave } | { ok: false; error: 'INVENTORY_FULL' } {
  let bag = w.inventory.items;
  for (const [id, n] of Object.entries(items)) {
    const r = addToBag(bag, id, n, INVENTORY);
    if (!r.ok) return { ok: false, error: 'INVENTORY_FULL' };
    bag = r.items;
  }
  return { ok: true, world: { ...w, inventory: { items: bag } } };
}

/** `count` of a shop line for its price each. */
export function buyWorkshopItem(world: WorldSave, args: { itemId: string; count: number }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w): Body => {
    const line = WORKSHOP.shop.find((l) => l.itemId === args.itemId);
    if (!line || !valid(args.count)) return { ok: false, error: 'INVALID_REQUEST' };
    const coins = line.price * args.count;
    const paid = spend(w, 'coins', coins, 'ADVENTURE_SHOP', ctx, `${line.itemId} x${args.count}`);
    if (!paid.ok) return paid;
    const bagged = bagAll(paid.world, { [line.itemId]: args.count });
    if (!bagged.ok) return bagged;
    return { ok: true, world: bagged.world, events: [{ type: 'ADVENTURE_SHOP_BOUGHT', itemId: line.itemId, count: args.count, coins }] };
  });
}

/** What a recipe still lacks in the bag for `times` makes (item → missing count); empty = it can be made. */
export function missingFor(w: WorldSave, recipeId: string, times = 1): Record<string, number> {
  const r = WORKSHOP.recipes.find((x) => x.id === recipeId);
  if (!r) return {};
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(r.inputs)) {
    const short = (n ?? 0) * times - countOf(w, id);
    if (short > 0) out[id] = short;
  }
  return out;
}

/** The Forge makes a recipe `times` times at once from the bag. */
export function forge(world: WorldSave, args: { recipeId: string; times: number }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w): Body => {
    const r = WORKSHOP.recipes.find((x) => x.id === args.recipeId);
    if (!r || !valid(args.times)) return { ok: false, error: 'INVALID_REQUEST' };
    if (Object.keys(missingFor(w, r.id, args.times)).length > 0) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    let next = w;
    for (const [id, n] of Object.entries(r.inputs)) {
      const taken = take(next, id, (n ?? 0) * args.times);
      if (!taken.ok) return taken;
      next = taken.world;
    }
    const made = Object.fromEntries(Object.entries(r.outputs).map(([id, n]) => [id, (n ?? 0) * args.times]));
    const bagged = bagAll(next, made);
    if (!bagged.ok) return bagged;
    return { ok: true, world: bagged.world, events: [{ type: 'ADVENTURE_FORGED', recipeId: r.id, times: args.times, items: made }] };
  });
}

/** An experience book used on one fighter (never during a battle): its experience lands as in battle, level-ups give their SP. */
export function useTome(world: WorldSave, args: { key: string; itemId: string; count: number; roster: readonly RosterEntry[] }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    const per = TOMES[args.itemId];
    if (!per || !valid(args.count)) return { ok: false, error: 'INVALID_REQUEST' };
    if (a.run?.phase === 'battle') return { ok: false, error: 'IN_BATTLE' };
    const entry = args.roster.find((r) => r.key === args.key);
    if (!entry || !identityOf(entry)) return { ok: false, error: 'NOT_A_FIGHTER' };
    const f = fighterOf(a, args.key, ctx.now);
    if (f.level >= LEVEL_RULES.maxLevel) return { ok: false, error: 'NOTHING_TO_DO' };
    const taken = take(w, args.itemId, args.count);
    if (!taken.ok) return taken;
    const exp = per * args.count;
    const next = addExp(f.level, f.exp, exp, LEVEL_RULES);
    const events: AdventureEvent[] = [{ type: 'ADVENTURE_ITEM_USED', itemId: args.itemId }, { type: 'ADVENTURE_TOME_USED', key: args.key, name: entry.name, itemId: args.itemId, exp }];
    if (next.levelsGained > 0) events.push({ type: 'ADVENTURE_LEVEL_UP', key: args.key, name: entry.name, level: next.level });
    const grown = { ...f, level: next.level, exp: next.exp, sp: f.sp + next.levelsGained * AB.sp.perLevel };
    return { ok: true, world: put(taken.world, { ...a, fighters: { ...a.fighters, [args.key]: grown } }), events };
  });
}
