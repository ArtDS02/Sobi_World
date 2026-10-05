// buyItem (spec §8.10).
import { INVENTORY } from '../../../../core/config/inventory';
import { addToBag } from '../../../../core/inventory/bag';
import { BALANCE } from '../../../../core/config/balance';
import type { ItemId } from '../../../../core/config/ids';
import { ITEMS } from '../../../../core/config/items';
import { changeGold } from '../gold';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function buyItem(
  state: FarmGame,
  args: { itemId: ItemId; quantity: number },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const item = Object.hasOwn(ITEMS, args.itemId) ? ITEMS[args.itemId] : undefined;
    const q = args.quantity;
    if (!item || !Number.isInteger(q) || q < 1 || q > BALANCE.SHOP_MAX_QUANTITY) {
      return { ok: false, error: 'INVALID_REQUEST' };
    }
    const gold = -item.priceGold * q;
    const paid = changeGold(s, gold, 'SHOP_PURCHASE', ctx, {
      refId: item.id,
      note: `x${q}`,
    });
    if (!paid.ok) return paid;
    const bag = addToBag(paid.state.inventory, item.id, q, INVENTORY);
    if (!bag.ok) return bag;
    return ok({ ...paid.state, inventory: bag.items }, [
      { type: 'ITEM_BOUGHT', itemId: item.id, quantity: q, gold },
    ]);
  });
}
