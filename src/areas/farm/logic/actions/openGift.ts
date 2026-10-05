// openGift (U06): claims a box once — it leaves the save in the same step that pays it.
import { changeGold } from '../../../../core/engine/gold';
import { addXP } from '../../../../core/engine/xp';
import type { ActionContext, ActionResult, SaveGame } from '../../../../core/types';
import { ok, runAction } from './runAction';

export function openGift(
  state: SaveGame,
  args: { giftId: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const box = s.gifts.boxes.find((b) => b.id === args.giftId);
    if (!box) return { ok: false, error: 'GIFT_NOT_FOUND' };
    const taken: SaveGame = {
      ...s,
      gifts: { ...s.gifts, boxes: s.gifts.boxes.filter((b) => b.id !== box.id) },
    };
    const paid = changeGold(taken, box.gold, 'GIFT_REWARD', ctx, { refId: box.id });
    if (!paid.ok) return paid;
    const xp = addXP(paid.state, box.xp);
    return ok(
      xp.state,
      [{ type: 'GIFT_OPENED', giftId: box.id, gold: box.gold, xp: box.xp }],
      xp.events,
    );
  });
}
