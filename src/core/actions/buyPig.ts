// buyPig (spec §8.1); species above the player's level stay locked (BreedDef.unlockLevel).
import { BALANCE } from '../config/balance';
import { BREEDS } from '../config/breeds';
import { levelFromXp } from '../config/levels';
import { GENDER_VALUES, type BreedId, type Gender } from '../config/ids';
import { discoverBreed } from '../engine/collection';
import { freeSlots } from '../engine/derived';
import { changeGold } from '../engine/gold';
import { pickPigName } from '../engine/pigNames';
import { randomId } from '../rng';
import type { ActionContext, ActionResult, Pig, SaveGame } from '../types';
import { ok, runAction } from './runAction';

export interface BuyPigArgs {
  breed: BreedId;
  gender: Gender;
}

/** Lowest slotIndex in [0, unlockedSlots) not used by a pig. */
function lowestFreeSlot(state: SaveGame): number {
  const used = new Set(state.pigs.map((p) => p.slotIndex));
  let i = 0;
  while (used.has(i)) i += 1;
  return i;
}

export function buyPig(state: SaveGame, args: BuyPigArgs, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const def = BREEDS[args.breed] as (typeof BREEDS)[BreedId] | undefined;
    if (!def || def.buyGold === null || !def.enabled) return { ok: false, error: 'INVALID_REQUEST' };
    if (!GENDER_VALUES.includes(args.gender)) return { ok: false, error: 'INVALID_REQUEST' };
    if (levelFromXp(s.player.xp) < def.unlockLevel) return { ok: false, error: 'LEVEL_TOO_LOW' };
    if (freeSlots(s) < 1) return { ok: false, error: 'NO_PIG_SLOT' };

    const pigId = randomId(ctx.rng);
    const paid = changeGold(s, -def.buyGold, 'PIG_PURCHASE', ctx, { refId: pigId });
    if (!paid.ok) return paid;

    const pig: Pig = {
      id: pigId,
      slotIndex: lowestFreeSlot(s),
      breed: def.id,
      name: pickPigName(ctx.rng, s.pigs),
      gender: args.gender,
      growthProgress: 0,
      hunger: BALANCE.HUNGER_MAX,
      cleanliness: BALANCE.CLEAN_MAX,
      isSick: false,
      pregnancy: null,
      lastTickedAt: ctx.now,
      createdAt: ctx.now,
    };
    const found = discoverBreed({ ...paid.state, pigs: [...paid.state.pigs, pig] }, def.id, ctx);
    return ok(found.state, [{ type: 'PIG_BOUGHT', pigId, breed: def.id }], found.events);
  });
}
