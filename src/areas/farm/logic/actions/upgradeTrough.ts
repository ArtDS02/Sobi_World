// upgradeTrough (GAME_BALANCE §2.6): the trough goes up one level for Sobi Coin and holds more food.
import { changeGold } from '../gold';
import { nextTroughLevel } from '../troughLevel';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function upgradeTrough(state: FarmGame, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const next = nextTroughLevel(s.trough);
    if (!next) return { ok: false, error: 'TROUGH_MAX_LEVEL' };
    const paid = changeGold(s, -next.cost, 'TROUGH_UPGRADE', ctx, { note: `level ${next.level}` });
    if (!paid.ok) return paid;
    return ok(
      { ...paid.state, trough: { ...paid.state.trough, capacity: next.capacity, level: next.level } },
      [{ type: 'TROUGH_UPGRADED', level: next.level, capacity: next.capacity, gold: -next.cost }],
    );
  });
}
