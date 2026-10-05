// buyProduct (DECISIONS AD-1): spec §8.10 buyItem for a shop product — `count` packs of the
// product's item at the product's price. Inactive or unknown products are refused.
import { INVENTORY } from '../../../../core/config/inventory';
import { addToBag } from '../../../../core/inventory/bag';
import { BALANCE } from '../../../../core/config/balance';
import { productById } from '../shopProducts';
import { changeGold } from '../gold';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function buyProduct(
  state: FarmGame,
  args: { productId: string; count: number },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const product = productById(args.productId);
    const n = args.count;
    if (!product?.active || !Number.isInteger(n) || n < 1 || n > BALANCE.SHOP_MAX_QUANTITY) {
      return { ok: false, error: 'INVALID_REQUEST' };
    }
    const gold = -product.priceGold * n;
    const paid = changeGold(s, gold, 'SHOP_PURCHASE', ctx, { refId: product.id, note: `x${n}` });
    if (!paid.ok) return paid;
    const units = product.quantity * n;
    const bag = addToBag(paid.state.inventory, product.itemId, units, INVENTORY);
    if (!bag.ok) return bag;
    return ok({ ...paid.state, inventory: bag.items }, [
      { type: 'ITEM_BOUGHT', itemId: product.itemId, quantity: units, gold },
    ]);
  });
}
