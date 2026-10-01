import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../src/core/config/balance';
import type { Order } from '../../src/core/types';
import { vi } from '../../src/i18n/vi';
import { ordersVm } from '../../src/ui/ordersVm';
import { ctx, farm } from './actionKit';
import { makePig } from './pigFactory';

const T = 10 * BALANCE.ORDER_WINDOW_MS;
const order = (o: Partial<Order> = {}): Order => ({
  id: '10:0',
  createdAt: T,
  expiresAt: T + BALANCE.ORDER_TTL_MS,
  wantBreed: 'PIG_EARTH_PINK',
  wantGender: null,
  minHappiness: 0,
  rewardGold: 1500,
  rewardXp: 25,
  fulfilledAt: null,
  ...o,
});

describe('ordersVm', () => {
  it('lists fitting pigs as choices; disabled with a reason when none fit', () => {
    const adult = makePig({ growthProgress: 100, lastTickedAt: T });
    const s = farm([adult, makePig({ id: 'baby', slotIndex: 1 })], {
      orders: [order(), order({ id: '10:1', wantBreed: 'PIG_MYTHICAL' })],
    });
    const [a, b] = ordersVm(s, T);
    expect(a!.choices).toHaveLength(1);
    expect(a!.button.reason).toBeNull();
    expect(b!.choices).toEqual([]);
    expect(b!.button.reason).toBe(vi.order.noMatchingPig);
    const r = a!.choices[0]!.run(s, ctx(T));
    expect(r.ok && r.events.some((e) => e.type === 'ORDER_FULFILLED')).toBe(true);
  });

  it('fulfilled orders show as done; expired ones are hidden', () => {
    const s = farm([], { orders: [order({ fulfilledAt: T }), order({ id: '1:0', expiresAt: T })] });
    const cards = ordersVm(s, T);
    expect(cards.map((c) => [c.id, c.fulfilled])).toEqual([['10:0', true]]);
  });
});
