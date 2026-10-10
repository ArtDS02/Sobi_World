// Caring for the fish (spec V2 §7): feed, change the water, pet, treat, set a purpose, rename. Each caught the tank
// up first (runAquarium); XP only when the care was needed, as on the farm (D11).
import type { Purpose } from '../../../../../content/schemas/vocab';
import { BOND } from '../../../../core/config/bond';
import type { ItemId } from '../../../../core/config/ids';
import { ITEMS } from '../../../../core/config/items';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { heartsOf, petsLeft, petted, raiseBond, withMoodBoost } from '../../../../systems/bond/bond';
import { gameDay } from '../../../../systems/health/disease';
import { AB, FEED_ITEM, MEDICINE_ITEM } from '../config/content';
import type { AquariumEvent } from '../events';
import { fishFavorite } from '../favorite';
import { fishHearts, fishTraitFactor, isAdult, recoveryMs } from '../fishLife';
import type { Fish } from '../state';
import { mapFish, pay, put, runAquarium, take, type AquariumResult } from './kit';

/** Bond points scaled by the fish's `bondGain` traits, in whole points. */
const bondGainFor = (f: Fish, gain: number): number => Math.round(gain * fishTraitFactor(f, 'bondGain'));

/** The event for a fish whose Bond just crossed the line that opens its hidden trait. */
const revealEvents = (before: Fish, after: Fish): AquariumEvent[] =>
  after.hiddenTrait && fishHearts(before) < 5 && fishHearts(after) >= 5
    ? [{ type: 'AQUARIUM_TRAIT_REVEALED', fishId: after.id, name: after.name, traitId: after.hiddenTrait }]
    : [];

/**
 * Feeds each of `fishIds` once with `itemId` (fish feed by default; a fish's favourite crop too): as many as the bag
 * allows. A full fish is skipped; XP only for the hungry.
 */
export function feedFish(world: WorldSave, args: { fishIds: string[]; itemId?: string }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const itemId = args.itemId ?? FEED_ITEM;
    const ids = [...new Set(args.fishIds)];
    const chosen = ids.map((id) => a.fish.find((f) => f.id === id));
    if (ids.length === 0 || chosen.some((f) => !f)) return { ok: false, error: 'FISH_NOT_FOUND' };
    const hungry = (chosen as Fish[]).filter((f) => f.hunger < 100);
    if (hungry.length === 0) return { ok: false, error: 'ALREADY_FULL' };
    const wanted = hungry.filter((f) => itemId === FEED_ITEM || itemId === fishFavorite(f));
    if (wanted.length === 0) return { ok: false, error: 'INVALID_REQUEST' };
    // Fish feed the bag lacks is bought at its price (like the Garden's seeds): a fish never starves for want of the mill.
    const have = w.inventory.items[itemId] ?? 0;
    const price = ITEMS[itemId as ItemId].priceGold;
    const buyable = itemId === FEED_ITEM && price > 0 ? Math.floor(w.wallet.coins / price) : 0;
    const fed = wanted.slice(0, have + buyable);
    if (fed.length === 0) return { ok: false, error: itemId === FEED_ITEM && price > 0 ? 'INSUFFICIENT_GOLD' : 'INSUFFICIENT_ITEM' };
    const bought = Math.max(0, fed.length - have);
    const paid = bought > 0 ? pay(w, -bought * price, 'AQUARIUM_FEED', ctx, { refId: itemId, note: `x${bought}` }) : { ok: true as const, state: w };
    if (!paid.ok) return paid;
    const taken = take(paid.state, itemId, fed.length - bought);
    if (!taken.ok) return taken;
    const favorite = itemId !== FEED_ITEM;
    let tank = a;
    const events: AquariumEvent[] = [];
    let needed = 0;
    for (const [i, f] of fed.entries()) {
      const hunger = Math.min(100, f.hunger + (favorite ? BOND.favorite.hunger : ITEMS[itemId as ItemId].hungerRestore));
      const eaten = withMoodBoost({ ...f, hunger, lastFedAt: ctx.now }, BOND.moodBoost.byItem[itemId as ItemId] ?? 0, ctx.now, BOND);
      const after: Fish = favorite ? { ...eaten, bond: raiseBond(eaten.bond, bondGainFor(eaten, BOND.favorite.gain), BOND) } : eaten;
      tank = mapFish(tank, f.id, () => after);
      events.push({ type: 'AQUARIUM_FISH_FED', fishId: f.id, itemId, ...(favorite ? { favorite } : {}), ...(i >= fed.length - bought ? { bought: true } : {}) }, ...revealEvents(f, after));
      if (f.hunger <= 80) needed += 1;
    }
    if (bought > 0) events.push({ type: 'AQUARIUM_FEED_BOUGHT', quantity: bought, gold: bought * price });
    return { ok: true, world: put(taken.world, tank), events, xp: needed * AB.xp.feed };
  });
}

/** Changes the water: clarity back to full for the tank and every fish in it. */
export function cleanTank(world: WorldSave, _args: Record<string, never>, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    if (a.tank.water >= 99 && a.fish.every((f) => f.cleanliness >= 99)) return { ok: false, error: 'WATER_CLEAN' };
    const fish = a.fish.map((f) => ({ ...f, cleanliness: 100, lastCleanedAt: ctx.now }));
    return { ok: true, world: put(w, { ...a, tank: { ...a.tank, water: 100 }, fish }), events: [{ type: 'AQUARIUM_WATER_CHANGED' }], xp: AB.xp.clean };
  });
}

/** Pets a fish: +Bond, twice a day per fish. */
export function petFish(world: WorldSave, args: { fishId: string }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const fish = a.fish.find((f) => f.id === args.fishId);
    if (!fish) return { ok: false, error: 'FISH_NOT_FOUND' };
    const day = gameDay(ctx.now, ctx.dayOffsetMs ?? 0);
    if (petsLeft(fish, day, BOND) <= 0) return { ok: false, error: 'PET_LIMIT_REACHED' };
    const after = petted(fish, day, { ...BOND, pet: { ...BOND.pet, gain: bondGainFor(fish, BOND.pet.gain) } });
    return {
      ok: true,
      world: put(w, mapFish(a, fish.id, () => after)),
      events: [{ type: 'AQUARIUM_FISH_PETTED', fishId: fish.id, hearts: heartsOf(after.bond, BOND) }, ...revealEvents(fish, after)],
      xp: AB.xp.pet,
    };
  });
}

/** Medicine cures an ill fish; it is then immune for a while (NH-1) and a little closer to you. */
export function treatFish(world: WorldSave, args: { fishId: string }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const fish = a.fish.find((f) => f.id === args.fishId);
    if (!fish) return { ok: false, error: 'FISH_NOT_FOUND' };
    if (!fish.isSick) return { ok: false, error: 'FISH_NOT_SICK' };
    const taken = take(w, MEDICINE_ITEM, 1);
    if (!taken.ok) return taken;
    const cured: Fish = {
      ...fish,
      isSick: false,
      recoveringUntil: ctx.now + recoveryMs,
      bond: raiseBond(fish.bond, bondGainFor(fish, BOND.care.gain), BOND),
    };
    return {
      ok: true,
      world: put(taken.world, mapFish(a, fish.id, () => cured)),
      events: [{ type: 'AQUARIUM_FISH_TREATED', fishId: fish.id }, ...revealEvents(fish, cured)],
      xp: AB.xp.treat,
    };
  });
}

/**
 * Gives a fish a potion of the Cloud (GĐ9): a healing potion cures an ill fish (even a critical one) like medicine, a potion
 * with a mood lift lifts its mood for some hours. What a potion does is data of its item.
 */
export function useFishPotion(world: WorldSave, args: { fishId: string; itemId: ItemId }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const item = ITEMS[args.itemId];
    if (!item || item.category !== 'POTION' || (!item.curesSickness && (item.moodBoost ?? 0) <= 0)) return { ok: false, error: 'INVALID_REQUEST' };
    const fish = a.fish.find((f) => f.id === args.fishId);
    if (!fish) return { ok: false, error: 'FISH_NOT_FOUND' };
    if (item.curesSickness && !fish.isSick) return { ok: false, error: 'FISH_NOT_SICK' };
    const lifted = withMoodBoost(fish, item.moodBoost ?? 0, ctx.now, { moodBoost: { hours: item.moodHours ?? BOND.moodBoost.hours, byItem: {} } });
    if (!item.curesSickness && lifted === fish) return { ok: false, error: 'NOTHING_TO_DO' };
    const taken = take(w, args.itemId, 1);
    if (!taken.ok) return taken;
    const cured = item.curesSickness && fish.isSick;
    const after: Fish = cured
      ? { ...lifted, isSick: false, recoveringUntil: ctx.now + recoveryMs, bond: raiseBond(lifted.bond, bondGainFor(lifted, BOND.care.gain), BOND) }
      : lifted;
    return {
      ok: true,
      world: put(taken.world, mapFish(a, fish.id, () => after)),
      events: [{ type: 'AQUARIUM_FISH_POTION', fishId: fish.id, itemId: args.itemId, cured }, ...revealEvents(fish, after)],
    };
  });
}

/** Chooses why a fish is kept: sold (SHIP), bred (BREED) or loved (PET, never sold or bred). From adult size on. */
export function setFishPurpose(world: WorldSave, args: { fishId: string; purpose: Purpose }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const fish = a.fish.find((f) => f.id === args.fishId);
    if (!fish) return { ok: false, error: 'FISH_NOT_FOUND' };
    if (args.purpose === 'ADVENTURE') return { ok: false, error: 'PURPOSE_LOCKED' };
    if (!isAdult(fish)) return { ok: false, error: 'FISH_NOT_MATURE' };
    return {
      ok: true,
      world: put(w, mapFish(a, fish.id, (f) => ({ ...f, purpose: args.purpose }))),
      events: [{ type: 'AQUARIUM_PURPOSE_SET', fishId: fish.id, purpose: args.purpose }],
    };
  });
}

/** Renames a fish (1 to `nameMax` characters). */
export function renameFish(world: WorldSave, args: { fishId: string; name: string }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const name = args.name.trim();
    if (name.length < 1 || name.length > AB.life.nameMax) return { ok: false, error: 'INVALID_REQUEST' };
    if (!a.fish.some((f) => f.id === args.fishId)) return { ok: false, error: 'FISH_NOT_FOUND' };
    return { ok: true, world: put(w, mapFish(a, args.fishId, (f) => ({ ...f, name }))), events: [] };
  });
}
