// treatPig (spec §8.5): medicine cures sickness only; no XP. NH-1: then Recovering (immune).
import { takeFromBag } from '../../../../core/inventory/bag';
import { BALANCE } from '../config/balance';
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
    const bag = takeFromBag(s.inventory, 'MEDICINE_COMMON', 1);
    if (!bag.ok) return bag;
    return ok(
      {
        ...s,
        inventory: bag.items,
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
