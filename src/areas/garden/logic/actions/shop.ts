// The Garden's shop (decision 029): seeds and supplies at the prices of content/garden/balance.json `shop`, bought in any
// count up to SHOP_MAX at once. Coins go out through the ledger; the items land in the shared bag (all or nothing).
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { GB } from '../config/content';
import { give, pay, runGarden, type GardenResult } from './kit';

/** Most units of one item bought in one go. */
export const SHOP_MAX = 999;

/** The shop's line for an item, or undefined when it does not sell it. */
export const shopLine = (itemId: string) => GB.shop.find((l) => l.itemId === itemId);

export function buyShopItem(world: WorldSave, args: { itemId: string; count: number }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w) => {
    const line = shopLine(args.itemId);
    const n = args.count;
    if (!line || !Number.isInteger(n) || n < 1 || n > SHOP_MAX) return { ok: false, error: 'INVALID_REQUEST' };
    const gold = line.price * n;
    const paid = pay(w, -gold, 'GARDEN_SHOP', ctx, { refId: line.itemId, note: `x${n}` });
    if (!paid.ok) return paid;
    const bagged = give(paid.state, { [line.itemId]: n });
    if (!bagged.ok) return bagged;
    return { ok: true, world: bagged.world, events: [{ type: 'GARDEN_SHOP_BOUGHT', itemId: line.itemId, count: n, gold }] };
  });
}
