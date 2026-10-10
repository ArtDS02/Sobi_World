// Money and materials of the tank: selling a raised fish, collecting its scales, upgrading the tank.
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import type { ItemId } from '../../../../core/config/ids';
import { ITEMS } from '../../../../core/config/items';
import { itemSalePrice } from '../../../../systems/valuation/itemPrice';
import { AB, PEARL_ITEM, SCALE_ITEM, fishOfItem } from '../config/content';
import { nextTankLevel } from '../derived';
import { isAdult, isPet } from '../fishLife';
import { fishQuote } from '../pricing';
import { fits, give, pay, put, runAquarium, take, countOf, type AquariumResult } from './kit';

/** Sells a fish out of the tank (adult size on, not a pet): the price is the quote of the moment. */
export function sellFish(world: WorldSave, args: { fishId: string }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const fish = a.fish.find((f) => f.id === args.fishId);
    if (!fish) return { ok: false, error: 'FISH_NOT_FOUND' };
    if (!isAdult(fish)) return { ok: false, error: 'FISH_NOT_MATURE' };
    if (isPet(fish)) return { ok: false, error: 'FISH_IS_PET' };
    const quote = fishQuote(fish, ctx.now);
    const paid = pay(w, quote.price, 'AQUARIUM_FISH_SELL', ctx, { refId: fish.id, note: `${fish.breed} ${quote.quality}` });
    if (!paid.ok) return paid;
    return {
      ok: true,
      world: put(paid.state, { ...a, fish: a.fish.filter((f) => f.id !== fish.id) }),
      events: [{ type: 'AQUARIUM_FISH_SOLD', fishId: fish.id, speciesId: fish.breed, gold: quote.price }],
      xp: AB.xp.sell,
    };
  });
}

/** Sells `quantity` of a caught fish (or any item the shop buys that the Aquarium made) straight from the bag at the item's own price. */
export function sellCatch(world: WorldSave, args: { itemId: string; quantity: number }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w) => {
    const item = ITEMS[args.itemId as ItemId];
    const sellable = fishOfItem(args.itemId) !== undefined || args.itemId === SCALE_ITEM || args.itemId === PEARL_ITEM;
    if (!sellable || item?.sellGold === undefined || !Number.isInteger(args.quantity) || args.quantity < 1) return { ok: false, error: 'INVALID_REQUEST' };
    const taken = take(w, args.itemId, args.quantity);
    if (!taken.ok) return taken;
    // The same price the shop pays for the item today (its market group, if it has one).
    const gold = itemSalePrice(item, args.quantity, ctx.now, ctx.dayOffsetMs ?? 0);
    const paid = pay(taken.world, gold, 'AQUARIUM_CATCH_SELL', ctx, { refId: args.itemId, note: `x${args.quantity}` });
    if (!paid.ok) return paid;
    return { ok: true, world: paid.state, events: [{ type: 'AQUARIUM_CATCH_SOLD', itemId: args.itemId, quantity: args.quantity, gold }] };
  });
}

/** Moves the scales of the tank into the bag (what fits; the rest waits in the tank). */
export function collectScales(world: WorldSave, _args: Record<string, never>, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    if (a.tank.scales <= 0) return { ok: false, error: 'NOTHING_TO_COLLECT' };
    let n = a.tank.scales;
    while (n > 0 && !fits(w, SCALE_ITEM, n)) n -= 1;
    if (n === 0) return { ok: false, error: 'INVENTORY_FULL' };
    const bag = give(w, { [SCALE_ITEM]: n });
    if (!bag.ok) return bag;
    const left = a.tank.scales - n;
    return {
      ok: true,
      world: put(bag.world, { ...a, tank: { ...a.tank, scales: left } }),
      events: [{ type: 'AQUARIUM_SCALES_COLLECTED', quantity: n, left }],
      xp: AB.xp.collect,
    };
  });
}

/** Buys the next tank level: coins and materials (scales, pearls) from the bag. */
export function upgradeTank(world: WorldSave, _args: Record<string, never>, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const next = nextTankLevel(a);
    if (!next) return { ok: false, error: 'TANK_MAX_LEVEL' };
    const needs = Object.entries(next.materials).filter((e): e is [string, number] => (e[1] ?? 0) > 0);
    if (needs.some(([id, n]) => countOf(w, id) < n)) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    const paid = next.price > 0 ? pay(w, -next.price, 'AQUARIUM_TANK', ctx, { refId: `level_${next.level}` }) : { ok: true as const, state: w };
    if (!paid.ok) return paid;
    let bag = paid.state;
    for (const [id, n] of needs) {
      const taken = take(bag, id, n);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    return {
      ok: true,
      world: put(bag, { ...a, tank: { ...a.tank, level: next.level } }),
      events: [{ type: 'AQUARIUM_TANK_UPGRADED', level: next.level, gold: next.price }],
      xp: AB.xp.upgrade,
    };
  });
}
