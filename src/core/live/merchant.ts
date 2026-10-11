// The visiting merchant (spec V2 §9, GĐ12): on some days he is in the plaza with a few special orders that pay better than the
// board's, and the group of goods he wants pays extra at the market that day (systems/valuation/market). His orders are made once
// when the day starts and kept in `live.merchant`, so they do not change under the player's hands. Pure.
import type { z } from 'zod';
import type { merchantFileSchema } from '../../../content/schemas/shared/merchant';
import { DAY_MS } from '../clock';
import { INVENTORY } from '../config/inventory';
import { changeCurrency } from '../economy/ledger';
import { addAllToBag, takeFromBag } from '../inventory/bag';
import { makeOrder, type BoardWorld, type ItemValue, type OrderRules } from '../goals/orders';
import type { WorldLevelUp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';
import type { LiveState } from './state';
import { merchantVisits } from './visit';

export type MerchantRules = z.infer<typeof merchantFileSchema>;

export type MerchantEvent = { type: 'MERCHANT_DELIVERED'; offerId: string; coins: number; xp: number; tokens: number };

/** His orders are seeded apart from the board's: a serial the board never reaches. */
const SERIAL_BASE = 1_000_000;

const dayOf = (ctx: ActionContext): number => Math.floor((ctx.now + (ctx.dayOffsetMs ?? 0)) / DAY_MS);

/** The merchant's state for game day `day`: the same object while it already belongs to the day. */
export function advanceMerchant(
  live: LiveState,
  day: number,
  now: number,
  world: BoardWorld,
  orders: OrderRules,
  value: ItemValue,
  rules: MerchantRules,
): LiveState {
  const present = merchantVisits(day, rules, live.dev.merchant);
  if (live.merchant.day === day && live.merchant.present === present) return live;
  const paying: OrderRules = { ...orders, rewardMultiplier: rules.offers.rewardMultiplier };
  const offers = present
    ? Array.from({ length: rules.offers.count }, (_, i) => ({ ...makeOrder(SERIAL_BASE + day * 10 + i, now, world, paying, value), id: `merchant_${day}_${i}` }))
    : [];
  return { ...live, merchant: { day, present, offers, done: offers.map(() => false) } };
}

/** Delivers one of today's special orders: the items go, coins, XP and Event Tokens come. */
export function deliverOffer(
  world: WorldSave,
  args: { index: number },
  ctx: ActionContext,
  rules: MerchantRules,
  addXp: (w: WorldSave, xp: number) => { state: WorldSave; events: WorldLevelUp[] },
): ActionResultOf<WorldSave, MerchantEvent | WorldLevelUp> {
  const m = world.live.merchant;
  if (!m.present || m.day !== dayOf(ctx)) return { ok: false, error: 'MERCHANT_AWAY' };
  const offer = m.offers[args.index];
  if (!offer) return { ok: false, error: 'ORDER_NOT_FOUND' };
  if (m.done[args.index]) return { ok: false, error: 'ALREADY_CLAIMED' };
  let items = world.inventory.items;
  for (const line of offer.lines) {
    const taken = takeFromBag(items, line.itemId, line.qty);
    if (!taken.ok) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    items = taken.items;
  }
  if (offer.bonus) {
    const bonus = addAllToBag(items, { [offer.bonus.itemId]: offer.bonus.qty }, INVENTORY);
    if (!bonus.ok) return bonus;
    items = bonus.items;
  }
  let state: WorldSave = { ...world, inventory: { items } };
  const paid = changeCurrency(state, 'coins', offer.coins, { type: 'MERCHANT_ORDER', refId: offer.id }, ctx);
  if (!paid.ok) return paid;
  state = paid.state;
  if (rules.offers.tokens > 0) {
    const tokens = changeCurrency(state, 'eventTokens', rules.offers.tokens, { type: 'MERCHANT_ORDER', refId: offer.id }, ctx);
    if (!tokens.ok) return tokens;
    state = tokens.state;
  }
  state = { ...state, live: { ...state.live, merchant: { ...m, done: m.done.map((d, i) => d || i === args.index) } } };
  const xp = addXp(state, offer.xp);
  return {
    ok: true,
    state: xp.state,
    events: [{ type: 'MERCHANT_DELIVERED', offerId: offer.id, coins: offer.coins, xp: offer.xp, tokens: rules.offers.tokens }, ...xp.events],
  };
}
