// sellPig = "Xuất chuồng" (spec §8.7, GAME_BALANCE §2.5): from Adult on; the price (pricing.ts) is read after
// advanceWorld, so it is the one the pig has now.
import { BALANCE } from '../config/balance';
import { isPet } from '../bond';
import { penMood } from '../decor';
import { changeGold } from '../gold';
import { sellQuote } from '../pricing';
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
    if (pig.growthProgress < BALANCE.STAGE_ADULT_AT) return { ok: false, error: 'PIG_NOT_MATURE' }; // shipped out from Adult on
    if (pig.pregnancy !== null) return { ok: false, error: 'PIG_IS_PREGNANT' };
    if (isPet(pig)) return { ok: false, error: 'PIG_IS_PET' };

    const bonus = penMood(s);
    const quote = sellQuote(pig, { now: ctx.now, dayOffsetMs: ctx.dayOffsetMs ?? 0, decorBonus: bonus });
    const price = quote.price;
    const removed: FarmGame = { ...s, pigs: s.pigs.filter((p) => p.id !== pig.id) };
    const paid = changeGold(removed, price, 'PIG_SELL', ctx, {
      refId: pig.id,
      note: `${pig.breed} ${quote.quality} ${Math.round(quote.weightKg)} kg`,
    });
    if (!paid.ok) return paid;
    const xp = addXP(paid.state, BALANCE.XP.SELL);
    return ok(xp.state, [{ type: 'PIG_SOLD', pigId: pig.id, gold: price }], xp.events);
  });
}
