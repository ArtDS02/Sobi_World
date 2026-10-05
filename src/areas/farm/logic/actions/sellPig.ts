// sellPig (spec §8.7): price uses the happiness multiplier after advanceWorld (D18).
import { BALANCE } from '../../../../core/config/balance';
import { decorBonus } from '../decor';
import { changeGold } from '../gold';
import { happiness } from '../happiness';
import { sellPrice } from '../pricing';
import { addXP } from '../xp';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function sellPig(
  state: FarmGame,
  args: { pigId: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (pig.growthProgress < 100) return { ok: false, error: 'PIG_NOT_MATURE' };
    if (pig.pregnancy !== null) return { ok: false, error: 'PIG_IS_PREGNANT' };

    const bonus = decorBonus(s);
    const price = sellPrice(pig, bonus);
    const removed: FarmGame = { ...s, pigs: s.pigs.filter((p) => p.id !== pig.id) };
    const paid = changeGold(removed, price, 'PIG_SELL', ctx, {
      refId: pig.id,
      note: `${pig.breed} happiness ${happiness(pig, bonus)}`,
    });
    if (!paid.ok) return paid;
    const xp = addXP(paid.state, BALANCE.XP.SELL);
    return ok(xp.state, [{ type: 'PIG_SOLD', pigId: pig.id, gold: price }], xp.events);
  });
}
