// fulfillOrder (spec §8.14): the pig is sold into the order for rewardGold + rewardXp.
import { changeGold } from '../engine/gold';
import { happiness } from '../engine/happiness';
import { addXP } from '../engine/xp';
import type { ActionContext, ActionResult, Order, Pig, SaveGame } from '../types';
import { ok, runAction } from './runAction';

/** Whether `pig` satisfies every requirement of `order` (ADULT, not pregnant, breed, gender, mood). */
export function pigMeetsOrder(pig: Pig, order: Order): boolean {
  return (
    pig.growthProgress >= 100 &&
    pig.pregnancy === null &&
    pig.breed === order.wantBreed &&
    (order.wantGender === null || pig.gender === order.wantGender) &&
    happiness(pig) >= order.minHappiness
  );
}

export function fulfillOrder(
  state: SaveGame,
  args: { orderId: string; pigId: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const order = s.orders.find((o) => o.id === args.orderId);
    if (!order || order.fulfilledAt !== null) return { ok: false, error: 'ORDER_NOT_FOUND' };
    if (ctx.now >= order.expiresAt) return { ok: false, error: 'ORDER_EXPIRED' };
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (!pigMeetsOrder(pig, order)) return { ok: false, error: 'ORDER_REQUIREMENTS_NOT_MET' };

    const done: SaveGame = {
      ...s,
      pigs: s.pigs.filter((p) => p.id !== pig.id),
      orders: s.orders.map((o) => (o.id === order.id ? { ...o, fulfilledAt: ctx.now } : o)),
    };
    const paid = changeGold(done, order.rewardGold, 'ORDER_REWARD', ctx, {
      refId: order.id,
      note: `${pig.breed} happiness ${happiness(pig)}`,
    });
    if (!paid.ok) return paid;
    const xp = addXP(paid.state, order.rewardXp);
    return ok(
      xp.state,
      [{ type: 'ORDER_FULFILLED', orderId: order.id, gold: order.rewardGold }],
      xp.events,
    );
  });
}
