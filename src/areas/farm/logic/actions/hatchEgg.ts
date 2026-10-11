// hatchEgg (GĐ11, spec §3.3): an egg from the Adventure's loot hatches into a pig of the rarity the egg says. Which breed is
// drawn by the injected rng among the enabled breeds of that rarity; the baby takes a free slot (a full pen refuses, nothing is lost).
import { ITEMS } from '../../../../core/config/items';
import { takeFromBag } from '../../../../core/inventory/bag';
import { randomId } from '../../../../core/rng';
import { lowestFreeSlot } from '../breeding';
import { discoverBreed } from '../collection';
import { BALANCE } from '../config/balance';
import { BREED_IDS, BREEDS } from '../config/breeds';
import { freeSlots } from '../derived';
import { pickPigName } from '../pigNames';
import type { ActionContext, ActionResult, FarmGame, ItemId, Pig } from '../types';
import { ok, runAction } from './runAction';

export function hatchEgg(state: FarmGame, args: { itemId: ItemId }, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const rarity = ITEMS[args.itemId]?.hatchRarity;
    if (!rarity) return { ok: false, error: 'NOT_AN_EGG' };
    if (freeSlots(s) < 1) return { ok: false, error: 'NO_PIG_SLOT' };
    const bag = takeFromBag(s.inventory, args.itemId, 1);
    if (!bag.ok) return bag;
    const breeds = BREED_IDS.filter((id) => BREEDS[id].enabled && BREEDS[id].rarity === rarity);
    if (breeds.length === 0) return { ok: false, error: 'INVALID_REQUEST' };
    const def = BREEDS[breeds[Math.floor(ctx.rng.next() * breeds.length)]!];
    const pig: Pig = {
      id: randomId(ctx.rng),
      slotIndex: lowestFreeSlot(s.pigs),
      breed: def.id,
      name: pickPigName(ctx.rng, [...s.pigs, ...s.nursery]),
      gender: ctx.rng.next() < 0.5 ? 'FEMALE' : 'MALE',
      growthProgress: 0,
      hunger: BALANCE.HUNGER_MAX,
      cleanliness: BALANCE.CLEAN_MAX,
      isSick: false,
      pregnancy: null,
      lastTickedAt: ctx.now,
      createdAt: ctx.now,
    };
    const found = discoverBreed({ ...s, inventory: bag.items, pigs: [...s.pigs, pig] }, def.id, ctx);
    return ok(found.state, [{ type: 'PIG_HATCHED', pigId: pig.id, breed: def.id, itemId: args.itemId }], found.events);
  });
}
