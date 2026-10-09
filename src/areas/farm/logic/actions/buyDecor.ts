// buyDecor (spec §20.2, DECISIONS PG-3): a one-time purchase; it shows on the farm and adds its
// happiness bonus to every pig (engine/decor.ts).
import { DECORS } from '../config/decor';
import type { DecorId } from '../config/ids';
import { levelFromXp } from '../config/levels';
import { changeGold } from '../gold';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function buyDecor(
  state: FarmGame,
  args: { decorId: DecorId },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const def = DECORS[args.decorId] as (typeof DECORS)[DecorId] | undefined;
    if (!def) return { ok: false, error: 'INVALID_REQUEST' };
    if (s.decor.includes(def.id)) return { ok: false, error: 'ALREADY_OWNED' };
    if (levelFromXp(s.player.xp) < def.unlockLevel) return { ok: false, error: 'LEVEL_TOO_LOW' };
    const paid = changeGold(s, -def.priceGold, 'DECOR_PURCHASE', ctx, { refId: def.id });
    if (!paid.ok) return paid;
    const next: FarmGame = { ...paid.state, decor: [...paid.state.decor, def.id] };
    return ok(next, [{ type: 'DECOR_BOUGHT', decorId: def.id, gold: -def.priceGold }]);
  });
}
