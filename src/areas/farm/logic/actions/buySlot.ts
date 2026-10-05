// buySlot (spec §8.11): next slot gated by level and gold, capped at MAX_SLOTS.
import { BALANCE } from '../../../../core/config/balance';
import { levelFromXp, slotUnlock } from '../../../../core/config/levels';
import { changeGold } from '../gold';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function buySlot(state: FarmGame, _args: object, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const slot = s.player.unlockedSlots + 1;
    const unlock = slotUnlock(slot);
    if (slot > BALANCE.MAX_SLOTS || !unlock) return { ok: false, error: 'MAX_SLOTS_REACHED' };
    if (levelFromXp(s.player.xp) < unlock.level) return { ok: false, error: 'LEVEL_TOO_LOW' };
    const paid = changeGold(s, -unlock.cost, 'SLOT_PURCHASE', ctx, { note: `slot ${slot}` });
    if (!paid.ok) return paid;
    const next = { ...paid.state, player: { ...paid.state.player, unlockedSlots: slot } };
    return ok(next, [{ type: 'SLOT_BOUGHT', slots: slot, gold: -unlock.cost }]);
  });
}
