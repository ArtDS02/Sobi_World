// cleanManure ("Dọn cả chuồng", GAME_BALANCE §2.2): rakes every pile out of the pen. Each pile becomes
// one item_manure in the shared bag (it can be sold now, and feeds the garden later). The bag has no limit
// (decision 057), so every pile is kept.
import { INVENTORY } from '../../../../core/config/inventory';
import { addToBag } from '../../../../core/inventory/bag';
import { BALANCE } from '../config/balance';
import { addXP } from '../xp';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export const MANURE_ITEM = 'item_manure';

export function cleanManure(state: FarmGame, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const piles = s.manure ?? 0;
    if (piles === 0) return { ok: false, error: 'NO_MANURE' };
    const kept = piles;
    const bag = addToBag(s.inventory, MANURE_ITEM, kept, INVENTORY);
    const raked: FarmGame = { ...s, manure: 0, inventory: bag.ok ? bag.items : s.inventory };
    const xp = addXP(raked, piles * BALANCE.XP.MANURE);
    return ok(xp.state, [{ type: 'MANURE_CLEANED', piles, kept }], xp.events);
  });
}
