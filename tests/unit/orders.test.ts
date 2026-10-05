import { describe, expect, it } from 'vitest';
import { fulfillOrder } from '../../src/areas/farm/logic/actions/fulfillOrder';
import { BALANCE } from '../../src/core/config/balance';
import { BREEDS } from '../../src/core/config/breeds';
import { BREED_ID_VALUES, type BreedId } from '../../src/core/config/ids';
import { RARITY_ORDER_WEIGHT } from '../../src/core/config/rarity';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { generateOrder, orderWindowIndex, refreshOrders } from '../../src/areas/farm/logic/orders';
import { mulberry32, orderSeed } from '../../src/core/rng';
import type { Order, SaveGame } from '../../src/core/types';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const W = BALANCE.ORDER_WINDOW_MS;
const WIN = 122000; // a realistic window index (Sept 2025)
const T = WIN * W + 1000; // inside window WIN
const PINK_MELON: BreedId[] = ['PIG_EARTH_PINK', 'PIG_STRIPED_MELON'];

const discovered = (breeds: BreedId[], patch: Partial<SaveGame> = {}): SaveGame => {
  const s = farm([], patch);
  return { ...s, collection: { ...s.collection, discoveredBreeds: breeds } };
};

describe('order generation (§8.14, §14.5)', () => {
  it('hash golden values (DECISIONS Q3)', () => {
    expect(orderSeed(0, 0)).toBe(2246822507);
    expect(orderSeed(122000, 1)).toBe(783162182);
    expect(orderSeed(500000, 2)).toBe(1871566945);
  });

  it('golden orders for window 122000 with PINK + MELON discovered', () => {
    const base = { createdAt: WIN * W, expiresAt: WIN * W + BALANCE.ORDER_TTL_MS, rewardXp: 25 };
    expect(generateOrder(WIN, 0, PINK_MELON)).toEqual({
      ...base,
      id: '122000:0',
      wantBreed: 'PIG_STRIPED_MELON',
      wantGender: null,
      minHappiness: 50,
      rewardGold: 5400,
      fulfilledAt: null,
    });
    expect(generateOrder(WIN, 1, PINK_MELON)).toMatchObject({
      wantBreed: 'PIG_EARTH_PINK',
      rewardGold: 2160,
    });
  });

  it('same window → same 3 orders; another window → different ones', () => {
    const a = refreshOrders(discovered(PINK_MELON), T).state.orders;
    const b = refreshOrders(discovered(PINK_MELON), T + W - 2000).state.orders;
    expect(a).toHaveLength(3);
    expect(b).toEqual(a);
    const c = refreshOrders(discovered(PINK_MELON), T + W).state.orders;
    expect(c.map((o) => o.id)).toEqual(['122001:0', '122001:1', '122001:2']);
    expect(c.map(({ id: _id, createdAt: _c, expiresAt: _e, ...o }) => o)).not.toEqual(
      a.map(({ id: _id, createdAt: _c, expiresAt: _e, ...o }) => o),
    );
  });

  it('result does not depend on discovery order', () => {
    const fwd = generateOrder(WIN, 0, PINK_MELON);
    expect(generateOrder(WIN, 0, [...PINK_MELON].reverse())).toEqual(fwd);
  });

  it('only discovered breeds appear; none discovered → no orders', () => {
    for (let w = 0; w < 200; w += 1) {
      for (let slot = 0; slot < 3; slot += 1) {
        expect(PINK_MELON).toContain(generateOrder(WIN + w, slot, PINK_MELON).wantBreed);
      }
    }
    expect(refreshOrders(discovered([]), T)).toEqual({ state: discovered([]), events: [] });
  });

  it('breeds are weighted by rarity (U04-1) and requirements come from the spec sets', () => {
    const counts = new Map<string, number>();
    for (let w = 0; w < 4000; w += 1) {
      const o = generateOrder(w, w % 3, BREED_ID_VALUES);
      counts.set(o.wantBreed, (counts.get(o.wantBreed) ?? 0) + 1);
      expect([0, 50, 75]).toContain(o.minHappiness);
      expect([null, 'MALE', 'FEMALE']).toContain(o.wantGender);
    }
    const weight = (b: BreedId) => RARITY_ORDER_WEIGHT[BREEDS[b].rarity];
    const total = BREED_ID_VALUES.reduce((sum, b) => sum + weight(b), 0);
    for (const b of BREED_ID_VALUES)
      expect(Math.abs((counts.get(b) ?? 0) / 4000 - weight(b) / total), b).toBeLessThan(0.02);
  });

  it('emits ORDER_NEW once and is idempotent for the same now', () => {
    const first = refreshOrders(discovered(PINK_MELON), T);
    expect(first.events.map((e) => e.type)).toEqual(['ORDER_NEW', 'ORDER_NEW', 'ORDER_NEW']);
    const again = refreshOrders(first.state, T);
    expect(again.events).toEqual([]);
    expect(again.state).toBe(first.state);
  });

  it('an existing order is never regenerated, even when discoveries change (Q2)', () => {
    const custom: Order = {
      ...generateOrder(WIN, 1, PINK_MELON),
      wantBreed: 'PIG_MYTHICAL',
      rewardGold: 1,
      fulfilledAt: T,
    };
    const s = discovered(BREED_ID_VALUES.slice(), { orders: [custom] });
    const r = refreshOrders(s, T + 5000);
    expect(r.state.orders.find((o) => o.id === custom.id)).toBe(custom);
    expect(r.state.orders.map((o) => o.id).sort()).toEqual(['122000:0', '122000:1', '122000:2']);
    expect(r.events).toHaveLength(2);
  });

  it('expiry drops the order and emits ORDER_EXPIRED; at most ORDER_MAX_ACTIVE live (C1)', () => {
    const s1 = refreshOrders(discovered(PINK_MELON), T).state;
    const s2 = refreshOrders(s1, T + W).state;
    expect(s2.orders).toHaveLength(6);
    const r = refreshOrders(s2, T + 2 * W);
    expect(
      r.events.filter((e) => e.type === 'ORDER_EXPIRED').map((e) => 'orderId' in e && e.orderId),
    ).toEqual(['122000:0', '122000:1', '122000:2']);
    expect(r.state.orders.length).toBeLessThanOrEqual(BALANCE.ORDER_MAX_ACTIVE);
    expect(r.state.orders.every((o) => o.expiresAt > T + 2 * W)).toBe(true);
  });

  it('advanceWorld runs the orders step', () => {
    const r = advanceWorld(discovered(PINK_MELON), T, mulberry32(1));
    expect(r.state.orders).toHaveLength(3);
    expect(orderWindowIndex(T)).toBe(WIN);
  });
});

describe('fulfillOrder (§8.14, §14.5)', () => {
  const order: Order = {
    id: `${WIN}:0`,
    createdAt: WIN * W,
    expiresAt: WIN * W + BALANCE.ORDER_TTL_MS,
    wantBreed: 'PIG_EARTH_PINK',
    wantGender: 'MALE',
    minHappiness: 50,
    rewardGold: 2160,
    rewardXp: 25,
    fulfilledAt: null,
  };
  const pig = (o = {}) =>
    makePig({ growthProgress: 100, gender: 'MALE', lastTickedAt: T, createdAt: T, ...o });
  const setup = (p = pig()) => {
    const s = discovered(['PIG_EARTH_PINK'], { orders: [order], pigs: [p] });
    return { ...s, trough: { ...s.trough, lastResolvedAt: T } };
  };
  const run = (s: SaveGame, now = T) =>
    fulfillOrder(s, { orderId: order.id, pigId: 'pig-1' }, ctx(now));

  it('removes the pig, pays rewardGold + XP, records ORDER_REWARD, emits ORDER_FULFILLED', () => {
    const s = setup();
    const r = expectOk(run(s));
    expect(r.state.pigs).toEqual([]);
    expect(r.state.player.gold).toBe(s.player.gold + 2160);
    expect(r.state.player.xp).toBe(s.player.xp + 25);
    expect(r.state.transactions.find((x) => x.type === 'ORDER_REWARD')).toMatchObject({
      type: 'ORDER_REWARD',
      amount: 2160,
      refId: order.id,
    });
    expect(r.state.orders.find((o) => o.id === order.id)?.fulfilledAt).toBe(T);
    expect(r.events).toContainEqual({ type: 'ORDER_FULFILLED', orderId: order.id, gold: 2160 });
  });

  it('rejects wrong breed, wrong gender, low happiness, a baby and a pregnant sow', () => {
    const bad = [
      pig({ breed: 'PIG_STRIPED_MELON' }),
      pig({ gender: 'FEMALE' }),
      pig({ hunger: 0, cleanliness: 0 }),
      pig({ growthProgress: 50 }),
      pig({
        pregnancy: {
          fatherId: 'x',
          startedAt: T,
          endsAt: T + 1e9,
          childBreed: 'PIG_EARTH_PINK',
          childGender: 'MALE',
        },
      }),
    ];
    for (const p of bad) expectError((s) => run(s), setup(p), 'ORDER_REQUIREMENTS_NOT_MET');
  });

  it('any gender is accepted when wantGender is null', () => {
    const s = setup(pig({ gender: 'FEMALE' }));
    expectOk(run({ ...s, orders: [{ ...order, wantGender: null }] }));
  });

  it('cannot be claimed twice; unknown order → ORDER_NOT_FOUND; expired order is gone', () => {
    const once = expectOk(run(setup()));
    const twice = { ...once.state, pigs: [pig({ id: 'pig-1' })] };
    expectError((s) => run(s), twice, 'ORDER_NOT_FOUND');
    expectError(
      (s) => fulfillOrder(s, { orderId: 'nope', pigId: 'pig-1' }, ctx(T)),
      setup(),
      'ORDER_NOT_FOUND',
    );
    expectError((s) => run(s, order.expiresAt), setup(), 'ORDER_NOT_FOUND');
  });
});
