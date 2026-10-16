// What the Cloud's shop shows (decision 029), as plain data: one card per line of content/cloud/balance.json `shop`,
// with buy buttons for 1, 10 and 50 that dry-run the real purchase, so a disabled reason is what dispatch would answer.
// Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ErrorCode } from '../../../core/config/errors';
import type { ItemId } from '../../../core/config/ids';
import type { WorldSave } from '../../../core/save/world';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { ShopKind, ShopLineVm } from '../../../ui/components/shopGrid';
import { buyShopItem } from '../logic/actions/shop';
import { flowerBySeed, CB } from '../logic/config/content';
import { probe } from './cloudVm';

/** Counts the buy buttons offer. */
export const SHOP_COUNTS = [1, 10, 50] as const;

const reasonOf = (e: ErrorCode): string => (e === 'INSUFFICIENT_GOLD' ? vi.cloud.noGold : e === 'HYBRID_LOCKED' ? vi.lab.lockedShop : vi.error[e]);

function lineOf(itemId: string): string {
  const flower = flowerBySeed(itemId);
  if (flower) return t(vi.cloud.shopSeedLine, { time: formatDuration(flower.growMs), yield: flower.yield });
  if (itemId === 'item_pure_water') return vi.cloud.shopWaterLine;
  return itemId === 'item_fertilizer' ? vi.cloud.shopFertilizerLine : '';
}

const kindOf = (itemId: string): ShopKind =>
  flowerBySeed(itemId) ? 'seed' : itemId === 'item_fertilizer' ? 'fertilizer' : itemId === 'item_pure_water' ? 'water' : 'item';

export function cloudShopVm(world: WorldSave, now: number): ShopLineVm[] {
  return CB.shop.map((l) => ({
    itemId: l.itemId,
    name: vi.shop[l.itemId as ItemId] ?? l.itemId,
    kind: kindOf(l.itemId),
    line: lineOf(l.itemId),
    art: itemArtId(l.itemId),
    each: t(vi.cloud.shopEach, { gold: formatInt(l.price) }),
    owned: t(vi.cloud.shopOwned, { count: formatInt(world.inventory.items[l.itemId] ?? 0) }),
    buys: SHOP_COUNTS.map((count) => {
      const e = probe(world, (w, c) => buyShopItem(w, { itemId: l.itemId, count }, c), now);
      return { count, label: t(vi.cloud.shopBuy, { count }), price: formatInt(l.price * count), reason: e ? reasonOf(e) : null };
    }),
  }));
}
