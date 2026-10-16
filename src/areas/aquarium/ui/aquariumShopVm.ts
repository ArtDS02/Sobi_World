// What the Aquarium's shop shows (decision 032), as plain data: one card per line of content/aquarium/balance.json
// `shop`, with buy buttons for 1, 10 and 50 that dry-run the real purchase, so a disabled reason is what dispatch would
// answer. Pure; unit-tested.
import { itemArtId, UI_ICON } from '../../../core/config/assetIds';
import type { ErrorCode } from '../../../core/config/errors';
import type { ItemId } from '../../../core/config/ids';
import { ITEMS } from '../../../core/config/items';
import type { WorldSave } from '../../../core/save/world';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { ShopKind, ShopLineVm } from '../../../ui/components/shopGrid';
import { buyShopItem } from '../logic/actions/shop';
import { AB, FEED_ITEM, fishOfItem, HOUR_MS, MEDICINE_ITEM } from '../logic/config/content';
import { probe } from './vmKit';

/** Counts the buy buttons offer. */
export const SHOP_COUNTS = [1, 10, 50] as const;

const reasonOf = (e: ErrorCode): string => (e === 'INSUFFICIENT_GOLD' ? vi.aquarium.noGold : vi.error[e]);

const kindOf = (itemId: string): ShopKind =>
  itemId === FEED_ITEM ? 'feed' : itemId === MEDICINE_ITEM ? 'medicine' : fishOfItem(itemId) ? 'fish' : 'item';

function lineOf(itemId: string): string {
  const A = vi.aquarium;
  const fish = fishOfItem(itemId);
  // A bought fish starts where a caught one does, so it grows the rest of the way in the tank.
  if (fish) return t(A.shopFishLine, { time: formatDuration(fish.growHours * HOUR_MS * (1 - AB.life.caughtProgress / 100)) });
  if (itemId === FEED_ITEM) return t(A.shopFeedLine, { hunger: ITEMS[itemId as ItemId].hungerRestore });
  return itemId === MEDICINE_ITEM ? A.shopMedicineLine : '';
}

export function aquariumShopVm(world: WorldSave, now: number, dayOffsetMs = 0): ShopLineVm[] {
  const A = vi.aquarium;
  return AB.shop.map((l) => ({
    itemId: l.itemId,
    name: vi.shop[l.itemId as ItemId] ?? l.itemId,
      kind: kindOf(l.itemId),
      line: lineOf(l.itemId),
      art: l.itemId === MEDICINE_ITEM ? UI_ICON.treat : itemArtId(l.itemId),
      each: t(A.shopEach, { gold: formatInt(l.price) }),
      owned: t(A.shopOwned, { count: formatInt(world.inventory.items[l.itemId] ?? 0) }),
      buys: SHOP_COUNTS.map((count) => {
        const e = probe(world, (w, c) => buyShopItem(w, { itemId: l.itemId, count }, c), now, dayOffsetMs);
        return { count, label: t(A.shopBuy, { count }), price: formatInt(l.price * count), reason: e ? reasonOf(e) : null };
      }),
  }));
}
