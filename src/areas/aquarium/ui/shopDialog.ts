// The Aquarium's shop (decision 032): the shared shop grid in the Aquarium's blue, rebuilt from the world while open.
import { dressShopDialog, guardBuy, shopGrid } from '../../../ui/components/shopGrid';
import { formatInt } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { buyShopItem } from '../logic/actions/shop';
import { aquariumShopVm } from './aquariumShopVm';
import type { DialogKit } from './dialogKit';

export function openShop(kit: DialogKit) {
  const buy = guardBuy((itemId, count) => kit.run((s, c) => buyShopItem(s, { itemId, count }, c)));
  kit.open(
    vi.aquarium.shopTitle,
    (w) => shopGrid(vi.aquarium.shopIntro, aquariumShopVm(w, kit.now(), kit.offset()), buy, { label: vi.areaHud.balance, value: formatInt(w.wallet.coins) }),
    (body) => dressShopDialog(body, 'aquarium'),
    'shop',
  );
}
