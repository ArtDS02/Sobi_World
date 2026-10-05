// treatPig (spec §8.5): medicine cures sickness only; no XP. NH-1: then Recovering (immune).
import { BALANCE } from '../../../../core/config/balance';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function treatPig(
  state: FarmGame,
  args: { pigId: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (!pig.isSick) return { ok: false, error: 'PIG_NOT_SICK' };
    if (s.inventory.MEDICINE_COMMON < 1) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    return ok(
      {
        ...s,
        inventory: { ...s.inventory, MEDICINE_COMMON: s.inventory.MEDICINE_COMMON - 1 },
        pigs: s.pigs.map((p) =>
          p.id === pig.id
            ? { ...p, isSick: false, recoveringUntil: ctx.now + BALANCE.SICK_RECOVERY_SEC * 1000 }
            : p,
        ),
      },
      [{ type: 'PIG_TREATED', pigId: pig.id }],
    );
  });
}
