// The Aquarium's shop (decision 032): the purchase, its world events and toast, and the cards it shows.
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { aquariumArea } from '../../src/areas/aquarium';
import { aquariumPresentation } from '../../src/areas/aquarium/feedback';
import { buyShopItem } from '../../src/areas/aquarium/logic/actions/shop';
import { releaseFish } from '../../src/areas/aquarium/logic/actions/fishing';
import { AB } from '../../src/areas/aquarium/logic/config/content';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import { aquariumShopVm } from '../../src/areas/aquarium/ui/aquariumShopVm';
import type { ItemId } from '../../src/core/config/ids';
import { ITEMS } from '../../src/core/config/items';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';

const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number): ActionContext => ({ now, rng: mulberry32(5) });
const priceOf = (itemId: string) => AB.shop.find((l) => l.itemId === itemId)!.price;

function base(bag: Record<string, number> = {}, coins = 10_000): WorldSave {
  const opened = aquariumArea.init(SAVE_CODEC.newWorld(ctxAt(T0 - 30 * 86_400_000)), ctxAt(T0));
  const a = aquariumOf(opened);
  return withAquarium({ ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: { ...bag } } }, { ...a, fish: [], lastTickedAt: T0 });
}

describe('the Aquarium shop', () => {
  it('sells its lines at their price, into the bag, and says so in the world and in a toast', () => {
    const r = buyShopItem(base({}, 1_000), { itemId: 'FOOD_FISH', count: 10 }, ctxAt(T0));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.inventory.items.FOOD_FISH).toBe(10);
    expect(r.state.wallet.coins).toBe(1_000 - 10 * priceOf('FOOD_FISH'));
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'AQUARIUM_SHOP_BOUGHT', itemId: 'FOOD_FISH', count: 10 }));
    expect(aquariumArea.toWorldEvents(r.events)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'item.added', itemId: 'FOOD_FISH', quantity: 10 }),
        expect.objectContaining({ type: 'currency.changed', amount: -10 * priceOf('FOOD_FISH') }),
      ]),
    );
    const shown = aquariumPresentation(r.events.find((e) => e.type === 'AQUARIUM_SHOP_BOUGHT')!, 'action');
    expect(shown?.toast).toBe('Đã mua 10 Thức ăn cá');
  });

  it('refuses what it does not sell, a wrong count and an empty purse', () => {
    const w = base();
    expect(buyShopItem(w, { itemId: 'item_pearl', count: 1 }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(buyShopItem(w, { itemId: 'FOOD_FISH', count: 0 }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(buyShopItem(w, { itemId: 'FOOD_FISH', count: 1.5 }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(buyShopItem(base({}, 10), { itemId: 'MEDICINE_COMMON', count: 1 }, ctxAt(T0))).toEqual({ ok: false, error: 'INSUFFICIENT_GOLD' });
  });

  it('a bought young fish can be put in the tank like a caught one', () => {
    const r = buyShopItem(base(), { itemId: 'item_fish_goldfish', count: 1 }, ctxAt(T0));
    if (!r.ok) throw new Error(r.error);
    const put = releaseFish(r.state, { itemId: 'item_fish_goldfish' }, ctxAt(T0 + 1000));
    if (!put.ok) throw new Error(put.error);
    expect(aquariumOf(put.state).fish).toHaveLength(1);
    expect(put.state.inventory.items.item_fish_goldfish ?? 0).toBe(0);
  });

  it('a young fish costs more than its catch fetches (no buy-and-sell loop)', () => {
    for (const l of AB.shop) {
      const sell = ITEMS[l.itemId as ItemId].sellGold;
      if (sell !== undefined) expect(l.price, l.itemId).toBeGreaterThan(sell);
    }
  });

  it('cards tag the goods, say what they do and why a button is off', () => {
    const lines = aquariumShopVm(base({ FOOD_FISH: 3 }, 300), T0);
    expect(lines.map((l) => l.itemId)).toEqual(AB.shop.map((l) => l.itemId));
    const feed = lines.find((l) => l.itemId === 'FOOD_FISH')!;
    expect(feed).toMatchObject({ kind: 'feed', owned: 'Đang có 3', art: 'ui_item_food_fish', line: 'Tăng 50 độ no cho một con cá' });
    expect(feed.buys.map((b) => b.reason)).toEqual([null, null, 'Thiếu Sobi Coin']);
    expect(lines.find((l) => l.itemId === 'MEDICINE_COMMON')).toMatchObject({ kind: 'medicine', art: 'ui_btn_heal' });
    const goldfish = lines.find((l) => l.itemId === 'item_fish_goldfish')!;
    expect(goldfish.kind).toBe('fish');
    expect(goldfish.line).toContain('Thả vào bể');
  });
});
