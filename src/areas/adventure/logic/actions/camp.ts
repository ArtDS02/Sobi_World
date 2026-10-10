// What happens between runs: the starter pig, the equipment of the fighters, the loot waiting for room in the bag.
import type { CreatureGift, GiftResult } from '../../../../core/area-registry/registry';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { equipPiece, unequipSlot, type EquipmentSlot } from '../../../../systems/equipment';
import { AB, ADVENTURE_AREA_ID, EQUIPMENT_DEFS } from '../config/content';
import { newFighter } from '../fighters';
import type { Fighter } from '../state';
import { giveSome, put, runAdventure, take, type AdventureResult } from './kit';

/** The gift the starter quest hands out: the Adventure's first pig (raised for the Adventure from the start). */
export const starterGift = (): CreatureGift => ({ kind: 'creature', area: 'sobi_farm', species: AB.starter.breed, purpose: 'ADVENTURE' });

/**
 * The knight's quest (spec §8.5, GĐ10 step 7): a starter pig for the Adventure, with a few pieces of equipment. `give` is the
 * world's way to hand a creature to the Area that keeps it (the app passes the registry's); an Area never reaches another.
 */
export function claimStarter(world: WorldSave, args: { give: (w: WorldSave, gift: CreatureGift, ctx: ActionContext) => GiftResult }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.starterClaimed) return { ok: false, error: 'STARTER_CLAIMED' };
    const gift = args.give(w, starterGift(), ctx);
    if (!gift.ok) return gift;
    // The equipment is a bonus: what the bag cannot hold waits with the loot.
    const items = giveSome(gift.state, AB.starter.items);
    const pending = { ...a.pending };
    for (const [id, n] of Object.entries(items.left)) pending[id] = (pending[id] ?? 0) + n;
    return { ok: true, world: put(items.world, { ...a, starterClaimed: true, pending }), events: [{ type: 'ADVENTURE_STARTER_CLAIMED', breed: AB.starter.breed }] };
  });
}

/** Puts a piece of the bag on a fighter (the piece it replaces goes back to the bag). Not during a run. */
export function equipItem(world: WorldSave, args: { key: string; itemId: string }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const piece = EQUIPMENT_DEFS[args.itemId];
    if (!piece) return { ok: false, error: 'NOT_EQUIPMENT' };
    const taken = take(w, args.itemId, 1);
    if (!taken.ok) return taken;
    const f: Fighter = a.fighters[args.key] ?? newFighter(ctx.now);
    const put1 = equipPiece(f.loadout, piece);
    const back = put1.replaced ? giveSome(taken.world, { [put1.replaced]: 1 }) : { world: taken.world };
    return {
      ok: true,
      world: put(back.world, { ...a, fighters: { ...a.fighters, [args.key]: { ...f, loadout: put1.loadout } } }),
      events: [{ type: 'ADVENTURE_EQUIPPED', key: args.key, itemId: args.itemId }],
    };
  });
}

/** Takes the piece of `slot` off a fighter and into the bag. Not during a run. */
export function unequipSlotOf(world: WorldSave, args: { key: string; slot: EquipmentSlot }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const f = a.fighters[args.key];
    const off = f ? unequipSlot(f.loadout, args.slot) : null;
    if (!f || !off?.removed) return { ok: false, error: 'NOTHING_TO_DO' };
    const back = giveSome(w, { [off.removed]: 1 });
    if (back.left[off.removed]) return { ok: false, error: 'INVENTORY_FULL' };
    return {
      ok: true,
      world: put(back.world, { ...a, fighters: { ...a.fighters, [args.key]: { ...f, loadout: off.loadout } } }),
      events: [{ type: 'ADVENTURE_UNEQUIPPED', key: args.key, itemId: off.removed }],
    };
  });
}

/** Moves the loot waiting into the bag, as much as fits; the rest keeps waiting. */
export function collectLoot(world: WorldSave, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (Object.keys(a.pending).length === 0) return { ok: false, error: 'NOTHING_TO_COLLECT' };
    const r = giveSome(w, a.pending);
    if (Object.keys(r.given).length === 0) return { ok: false, error: 'INVENTORY_FULL' };
    const left = Object.values(r.left).reduce((n, v) => n + v, 0);
    return { ok: true, world: put(r.world, { ...a, pending: r.left }), events: [{ type: 'ADVENTURE_LOOT_COLLECTED', items: r.given, left }] };
  });
}

export const ADVENTURE_ID = ADVENTURE_AREA_ID;
