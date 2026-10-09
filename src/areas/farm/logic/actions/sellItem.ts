// sellItem: sells units of a sellable item (content `sellGold`) from the shared bag for Sobi Coin.
import { takeFromBag } from '../../../../core/inventory/bag';
import type { ItemId } from '../../../../core/config/ids';
import { ITEMS } from '../../../../core/config/items';
import { changeGold } from '../gold';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function sellItem(
  state: FarmGame,
  args: { itemId: ItemId; quantity: number },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const item = Object.hasOwn(ITEMS, args.itemId) ? ITEMS[args.itemId] : undefined;
    const q = args.quantity;
    if (!item || item.sellGold === undefined || !Number.isInteger(q) || q < 1) {
      return { ok: false, error: 'INVALID_REQUEST' };
    }
    const bag = takeFromBag(s.inventory, item.id, q);
    if (!bag.ok) return bag;
    const gold = item.sellGold * q;
    const paid = changeGold({ ...s, inventory: bag.items }, gold, 'ITEM_SELL', ctx, { refId: item.id, note: `x${q}` });
    if (!paid.ok) return paid;
    return ok(paid.state, [{ type: 'ITEM_SOLD', itemId: item.id, quantity: q, gold }]);
  });
}
