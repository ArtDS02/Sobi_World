// cleanManure ("Dọn cả chuồng", GAME_BALANCE §2.2): rakes every pile out of the pen. Each pile becomes
// one item_manure in the shared bag (it can be sold now, and feeds the garden later); piles that do not
// fit in a full bag are thrown away, the pen is clean either way.
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
    let kept = piles;
    let bag = addToBag(s.inventory, MANURE_ITEM, kept, INVENTORY);
    while (!bag.ok && kept > 0) {
      kept -= 1;
      bag = addToBag(s.inventory, MANURE_ITEM, kept, INVENTORY);
    }
    const raked: FarmGame = { ...s, manure: 0, inventory: bag.ok ? bag.items : s.inventory };
    const xp = addXP(raked, piles * BALANCE.XP.MANURE);
    return ok(xp.state, [{ type: 'MANURE_CLEANED', piles, kept }], xp.events);
  });
}
