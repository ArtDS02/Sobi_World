// adoptPig (DECISIONS BR-1): raise a newborn from the inventory nursery — it moves onto the farm as
// a baby, keeping its id, name, generation and parents. Needs a free pen slot; when the farm is
// full it fails with NO_PIG_SLOT and the newborn stays in the nursery (never lost).
import { BALANCE } from '../config/balance';
import { lowestFreeSlot } from '../engine/breeding';
import { freeSlots } from '../engine/derived';
import type { ActionContext, ActionResult, Pig, SaveGame } from '../types';
import { ok, runAction } from './runAction';

export interface AdoptPigArgs {
  nurseryId: string;
}

export function adoptPig(state: SaveGame, args: AdoptPigArgs, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const baby = s.nursery.find((p) => p.id === args.nurseryId);
    if (!baby) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (freeSlots(s) < 1) return { ok: false, error: 'NO_PIG_SLOT' };
    const pig: Pig = {
      id: baby.id,
      slotIndex: lowestFreeSlot(s.pigs),
      breed: baby.breed,
      name: baby.name,
      gender: baby.gender,
      // Life starts on the farm: no growth, hunger or dirt while it waited in the nursery.
      growthProgress: 0,
      hunger: BALANCE.HUNGER_MAX,
      cleanliness: BALANCE.CLEAN_MAX,
      isSick: false,
      pregnancy: null,
      lastTickedAt: ctx.now,
      createdAt: ctx.now,
      generation: baby.generation,
      parents: baby.parents,
    };
    const next = {
      ...s,
      pigs: [...s.pigs, pig],
      nursery: s.nursery.filter((p) => p.id !== baby.id),
    };
    return ok(next, [{ type: 'PIG_ADOPTED', pigId: pig.id, breed: pig.breed }]);
  });
}
