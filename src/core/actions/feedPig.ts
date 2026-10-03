// feedPig (spec §8.2) — manual fallback to the trough.
import { BALANCE } from '../config/balance';
import { addXP } from '../engine/xp';
import type { ActionContext, ActionResult, SaveGame } from '../types';
import { ok, runAction } from './runAction';

export function feedPig(
  state: SaveGame,
  args: { pigId: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (pig.hunger >= BALANCE.HUNGER_MAX) return { ok: false, error: 'ALREADY_FULL' };
    if (s.inventory.FOOD_BASIC < 1) return { ok: false, error: 'INSUFFICIENT_ITEM' };

    const hunger = Math.min(BALANCE.HUNGER_MAX, pig.hunger + BALANCE.FOOD_HUNGER_RESTORE);
    const fed: SaveGame = {
      ...s,
      inventory: { ...s.inventory, FOOD_BASIC: s.inventory.FOOD_BASIC - 1 },
      pigs: s.pigs.map((p) => (p.id === pig.id ? { ...p, hunger, lastFedAt: ctx.now } : p)),
    };
    // D11: XP only when the feed was actually needed.
    const effective = pig.hunger <= BALANCE.XP_EFFECTIVE_FEED_MAX_HUNGER;
    const xp = addXP(fed, effective ? BALANCE.XP.FEED : 0);
    return ok(xp.state, [{ type: 'PIG_FED', pigId: pig.id }], xp.events);
  });
}
