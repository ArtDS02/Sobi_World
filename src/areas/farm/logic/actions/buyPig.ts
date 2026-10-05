// buyPig (spec §8.1); species above the player's level stay locked (BreedDef.unlockLevel).
import { BALANCE } from '../../../../core/config/balance';
import { BREEDS } from '../../../../core/config/breeds';
import { levelFromXp } from '../../../../core/config/levels';
import { GENDER_VALUES, type BreedId, type Gender } from '../../../../core/config/ids';
import { discoverBreed } from '../collection';
import { lowestFreeSlot } from '../breeding';
import { freeSlots } from '../derived';
import { changeGold } from '../gold';
import { pickPigName } from '../pigNames';
import { randomId } from '../../../../core/rng';
import type { ActionContext, ActionResult, Pig, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export interface BuyPigArgs {
  breed: BreedId;
  gender: Gender;
}

export function buyPig(state: FarmGame, args: BuyPigArgs, ctx: ActionContext): ActionResult {
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
      slotIndex: lowestFreeSlot(s.pigs),
      breed: def.id,
      name: pickPigName(ctx.rng, [...s.pigs, ...s.nursery]),
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
