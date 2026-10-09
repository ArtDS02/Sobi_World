// fillTrough (spec §8.6): inventory first, shortfall bought at shop price in the same action.
import { takeFromBag } from '../../../../core/inventory/bag';
import { ITEMS } from '../../../../core/config/items';
import { changeGold } from '../gold';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function fillTrough(
  state: FarmGame,
  args: { units: number },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const { units } = args;
    if (!Number.isInteger(units) || units < 1) return { ok: false, error: 'INVALID_REQUEST' };
    if (s.trough.food + units > s.trough.capacity) return { ok: false, error: 'TROUGH_FULL' };

    const fromInventory = Math.min(s.inventory.FOOD_BASIC, units);
    const shortfall = units - fromInventory;
    // One TROUGH_FILL transaction for the gold actually spent, 0 when all from inventory.
    const gold = 0 - shortfall * ITEMS.FOOD_BASIC.priceGold; // 0 - x keeps +0 when nothing is bought
    const paid = changeGold(s, gold, 'TROUGH_FILL', ctx, {
      note: `x${units} inventory ${fromInventory} bought ${shortfall}`,
    });
    if (!paid.ok) return paid;
    const bag = takeFromBag(paid.state.inventory, 'FOOD_BASIC', fromInventory);
    if (!bag.ok) return bag;
    return ok(
      {
        ...paid.state,
        inventory: bag.items,
        trough: { ...paid.state.trough, food: s.trough.food + units },
      },
      [{ type: 'TROUGH_FILLED', units, fromInventory, gold }],
    );
  });
}
