// Game side of the admin-edited data (DECISIONS AD-1): shop products, the breeding pair table and
// the layout editor's placement fields are what the game actually plays.
import { describe, expect, it } from 'vitest';
import { buyProduct } from '../../src/core/actions/buyProduct';
import { BREEDS } from '../../src/core/config/breeds';
import { ITEMS } from '../../src/core/config/items';
import { PRODUCTS, type ProductDef } from '../../src/core/config/products';
import type { PairRule } from '../../src/core/config/breedingPairs';
import { breedingOutcomes, pairRuleFor } from '../../src/core/engine/breedingOdds';
import { shopProducts } from '../../src/core/engine/shopProducts';
import { placementTransform, visibleLayout } from '../../src/game/view/sceneLayout';
import { ctx, expectError, expectOk, farm } from './actionKit';

describe('shop products', () => {
  it('the shipped products sell exactly what the old item tab sold, at the item price', () => {
    expect(shopProducts().map((p) => [p.itemId, p.quantity, p.priceGold])).toEqual([
      ['FOOD_BASIC', 1, ITEMS.FOOD_BASIC.priceGold],
      ['MEDICINE_COMMON', 1, ITEMS.MEDICINE_COMMON.priceGold],
    ]);
  });

  it('lists active products by sortOrder, then table order', () => {
    const p = (id: string, sortOrder: number, active = true) => ({ ...PRODUCTS[0]!, id, sortOrder, active }) as ProductDef;
    expect(shopProducts([p('A', 20), p('B', 10), p('C', 10), p('D', 1, false)]).map((x) => x.id)).toEqual(['B', 'C', 'A']);
  });

  it('buyProduct charges the product price per pack and adds quantity × packs', () => {
    const s = farm();
    const r = expectOk(buyProduct(s, { productId: 'FOOD_BASIC', count: 3 }, ctx()));
    expect(r.state.player.gold).toBe(s.player.gold - 3 * ITEMS.FOOD_BASIC.priceGold);
    expect(r.state.inventory.FOOD_BASIC).toBe(s.inventory.FOOD_BASIC + 3);
    expect(r.state.transactions[0]).toMatchObject({ type: 'SHOP_PURCHASE', refId: 'FOOD_BASIC', note: 'x3' });
    expect(r.events).toContainEqual({ type: 'ITEM_BOUGHT', itemId: 'FOOD_BASIC', quantity: 3, gold: -3 * ITEMS.FOOD_BASIC.priceGold });
  });

  it('refuses unknown products and bad counts without side effects', () => {
    const s = farm();
    expectError((x) => buyProduct(x, { productId: 'NOPE', count: 1 }, ctx()), s, 'INVALID_REQUEST');
    expectError((x) => buyProduct(x, { productId: 'FOOD_BASIC', count: 0 }, ctx()), s, 'INVALID_REQUEST');
    const broke = { ...s, player: { ...s.player, gold: 0 } };
    expectError((x) => buyProduct(x, { productId: 'MEDICINE_COMMON', count: 1 }, ctx()), broke, 'INSUFFICIENT_GOLD');
  });
});

describe('breeding pair table', () => {
  const rule: PairRule = {
    id: 'PAIR_001',
    parents: ['PIG_BLACK', 'PIG_EARTH_PINK'],
    outcomes: [
      { breed: 'PIG_EARTH_PINK', percent: 60 },
      { breed: 'PIG_BLACK', percent: 25 },
      { breed: 'PIG_PANDA', percent: 15 },
    ],
    active: true,
  };

  it('an active rule IS the odds of the pair, in either parent order', () => {
    const odds = breedingOutcomes('PIG_EARTH_PINK', 'PIG_BLACK', [rule])!;
    expect(odds.map((o) => [o.breed, o.weight])).toEqual([['PIG_EARTH_PINK', 60], ['PIG_BLACK', 25], ['PIG_PANDA', 15]]);
    expect(breedingOutcomes('PIG_BLACK', 'PIG_EARTH_PINK', [rule])).toEqual(odds);
    expect(pairRuleFor('PIG_EARTH_PINK', 'PIG_BLACK', [rule])?.id).toBe('PAIR_001');
  });

  it('inactive rules and other pairs keep the rule system', () => {
    expect(breedingOutcomes('PIG_EARTH_PINK', 'PIG_BLACK', [{ ...rule, active: false }])).toEqual(breedingOutcomes('PIG_EARTH_PINK', 'PIG_BLACK', []));
    expect(breedingOutcomes('PIG_WHITE', 'PIG_BLACK', [rule])).toEqual(breedingOutcomes('PIG_WHITE', 'PIG_BLACK', []));
  });

  it('a pair that cannot breed stays refused even with a rule', () => {
    const legendary = Object.values(BREEDS).find((b) => !b.breedable)!;
    expect(breedingOutcomes(legendary.id, 'PIG_BLACK', [{ ...rule, parents: [legendary.id, 'PIG_BLACK'] }])).toBeUndefined();
  });
});

describe('layout editor fields in the scene', () => {
  const base = { id: 'prop_rock', layer: 4, x: 0.5, y: 0.5 };
  it('width alone keeps the aspect ratio (unchanged behaviour), height stretches, rotation and mirror pass through', () => {
    expect(placementTransform({ ...base, width: 100 }, 200, 100)).toEqual({ scaleX: 0.5, scaleY: 0.5, angle: 0, flipX: false });
    expect(placementTransform({ ...base, height: 50 }, 200, 100)).toEqual({ scaleX: 0.5, scaleY: 0.5, angle: 0, flipX: false });
    expect(placementTransform({ ...base, width: 100, height: 100, rotation: 15, flipX: true }, 200, 100)).toEqual({ scaleX: 0.5, scaleY: 1, angle: 15, flipX: true });
    expect(placementTransform(base, 200, 100)).toEqual({ scaleX: 1, scaleY: 1, angle: 0, flipX: false });
  });

  it('hidden placements are not drawn', () => {
    const layout = { designSize: { width: 1600, height: 900 }, walkArea: { x: 0, y: 0, width: 1, height: 1 }, pigScaleByY: { min: 1, max: 1 },
      placements: [base, { ...base, visible: false }, { ...base, visible: true }] };
    expect(visibleLayout(layout).placements).toHaveLength(2);
  });
});
