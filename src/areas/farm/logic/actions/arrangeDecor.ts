// arrangeDecor (GĐ6, spec V2 §9): put a decoration on the farm, store it, or move it to its next spot. A stored
// decoration gives no mood and is not drawn; a placed one lifts every pig of the pen (decor.ts). Free of charge.
import { DECORS } from '../config/decor';
import type { DecorId } from '../config/ids';
import { planOf } from '../decor';
import type { ActionContext, ActionResult, DecorPlan, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export type DecorOp = 'place' | 'store' | 'move';

export function arrangeDecor(state: FarmGame, args: { decorId: DecorId; op: DecorOp }, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const def = DECORS[args.decorId] as (typeof DECORS)[DecorId] | undefined;
    if (!def || !s.decor.includes(def.id)) return { ok: false, error: 'INVALID_REQUEST' };
    const now = planOf(s, def.id);
    let next: DecorPlan;
    if (args.op === 'store') next = { ...now, stored: true };
    else if (args.op === 'place') next = { ...now, stored: false };
    else if (def.spots < 2 || now.stored) return { ok: false, error: 'NOTHING_TO_DO' };
    else next = { spot: (now.spot + 1) % def.spots, stored: false };
    if (next.spot === now.spot && next.stored === now.stored) return { ok: false, error: 'NOTHING_TO_DO' };
    return ok({ ...s, decorPlan: { ...s.decorPlan, [def.id]: next } }, [{ type: 'DECOR_ARRANGED', decorId: def.id, op: args.op }]);
  });
}
