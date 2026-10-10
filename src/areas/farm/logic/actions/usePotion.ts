// usePotion (GĐ9, spec §8.4): a potion from the Cloud's cauldron, taken by one pig. A healing potion cures an ill pig (even a
// critical one) like medicine does; a potion with a mood lift lifts its mood for some hours (systems/bond withMoodBoost).
// What a potion does is data of its item (content/shared/items.json: curesSickness, moodBoost, moodHours).
import { BOND } from '../../../../core/config/bond';
import { ITEMS } from '../../../../core/config/items';
import { takeFromBag } from '../../../../core/inventory/bag';
import { raiseBond, withMoodBoost } from '../../../../systems/bond/bond';
import { BALANCE } from '../config/balance';
import { bondGainFor, revealEvents } from '../heredity';
import type { ActionContext, ActionResult, FarmGame, ItemId, Pig } from '../types';
import { ok, runAction } from './runAction';

export function usePotion(state: FarmGame, args: { pigId: string; itemId: ItemId }, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const item = ITEMS[args.itemId];
    if (!item || item.category !== 'POTION' || (!item.curesSickness && (item.moodBoost ?? 0) <= 0)) return { ok: false, error: 'INVALID_REQUEST' };
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    // A healing potion is for an ill pig; keeping it for one that needs it is the point.
    if (item.curesSickness && !pig.isSick) return { ok: false, error: 'PIG_NOT_SICK' };
    const lifted = withMoodBoost(pig, item.moodBoost ?? 0, ctx.now, { moodBoost: { hours: item.moodHours ?? BOND.moodBoost.hours, byItem: {} } });
    if (!item.curesSickness && lifted === pig) return { ok: false, error: 'NOTHING_TO_DO' };
    const bag = takeFromBag(s.inventory, args.itemId, 1);
    if (!bag.ok) return bag;
    const cured = item.curesSickness && pig.isSick;
    const next: Pig = cured
      ? { ...lifted, isSick: false, recoveringUntil: ctx.now + BALANCE.SICK_RECOVERY_SEC * 1000, bond: raiseBond(lifted.bond, bondGainFor(lifted, BOND.care.gain), BOND) }
      : lifted;
    return ok(
      { ...s, inventory: bag.items, pigs: s.pigs.map((p) => (p.id === pig.id ? next : p)) },
      [{ type: 'PIG_POTION_USED', pigId: pig.id, itemId: args.itemId, cured }, ...revealEvents(pig, next)],
    );
  });
}
