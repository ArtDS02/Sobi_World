// claimRelief (DECISIONS PG-1): the neighbour's help, only while the farm is stuck (engine/relief).
import { changeGold } from '../../../../core/engine/gold';
import { reliefNeed } from '../relief';
import type { ActionContext, ActionResult, SaveGame } from '../../../../core/types';
import { ok, runAction } from './runAction';

export function claimRelief(state: SaveGame, _args: object, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const need = reliefNeed(s);
    if (!need) return { ok: false, error: 'NOT_STUCK' };
    let next: SaveGame = {
      ...s,
      inventory: {
        ...s.inventory,
        FOOD_BASIC: s.inventory.FOOD_BASIC + need.food,
        MEDICINE_COMMON: s.inventory.MEDICINE_COMMON + need.medicine,
      },
    };
    if (need.gold > 0) {
      const paid = changeGold(next, need.gold, 'RELIEF', ctx);
      if (!paid.ok) return paid;
      next = paid.state;
    }
    return ok(next, [{ type: 'RELIEF_CLAIMED', ...need }]);
  });
}
