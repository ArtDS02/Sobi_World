// claimRelief (DECISIONS PG-1): the neighbour's help, only while the farm is stuck (engine/relief).
import { INVENTORY } from '../../../../core/config/inventory';
import { addAllToBag } from '../../../../core/inventory/bag';
import { changeGold } from '../gold';
import { reliefNeed } from '../relief';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function claimRelief(state: FarmGame, _args: object, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const need = reliefNeed(s);
    if (!need) return { ok: false, error: 'NOT_STUCK' };
    const bag = addAllToBag(s.inventory, { FOOD_BASIC: need.food, MEDICINE_COMMON: need.medicine }, INVENTORY);
    if (!bag.ok) return bag;
    let next: FarmGame = { ...s, inventory: bag.items };
    if (need.gold > 0) {
      const paid = changeGold(next, need.gold, 'RELIEF', ctx);
      if (!paid.ok) return paid;
      next = paid.state;
    }
    return ok(next, [{ type: 'RELIEF_CLAIMED', ...need }]);
  });
}
