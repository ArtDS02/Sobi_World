// feedPig (spec §8.2) — manual fallback to the trough. Besides the plain feed, a pig eats the Garden's
// premium feed and grass snack (GAME_BALANCE §2.3); each restores what its item says (content/shared/items.json).
import { ITEMS } from '../../../../core/config/items';
import { takeFromBag } from '../../../../core/inventory/bag';
import { BALANCE } from '../config/balance';
import type { ItemId } from '../types';
import { addXP } from '../xp';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

/** What a pig can be hand-fed: the plain feed, the premium feed and grass (an item that restores hunger). */
export const FEED_ITEMS = ['FOOD_BASIC', 'FOOD_PREMIUM', 'item_grass'] as const satisfies readonly ItemId[];
export type FeedItem = (typeof FEED_ITEMS)[number];

export function feedPig(
  state: FarmGame,
  args: { pigId: string; itemId?: FeedItem },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (pig.hunger >= BALANCE.HUNGER_MAX) return { ok: false, error: 'ALREADY_FULL' };
    const itemId = args.itemId ?? 'FOOD_BASIC';
    if (!FEED_ITEMS.includes(itemId)) return { ok: false, error: 'INVALID_REQUEST' };
    const bag = takeFromBag(s.inventory, itemId, 1);
    if (!bag.ok) return bag;

    const hunger = Math.min(BALANCE.HUNGER_MAX, pig.hunger + ITEMS[itemId].hungerRestore);
    const fed: FarmGame = {
      ...s,
      inventory: bag.items,
      pigs: s.pigs.map((p) => (p.id === pig.id ? { ...p, hunger, lastFedAt: ctx.now } : p)),
    };
    // D11: XP only when the feed was actually needed.
    const effective = pig.hunger <= BALANCE.XP_EFFECTIVE_FEED_MAX_HUNGER;
    const xp = addXP(fed, effective ? BALANCE.XP.FEED : 0);
    return ok(xp.state, [{ type: 'PIG_FED', pigId: pig.id, itemId }], xp.events);
  });
}
