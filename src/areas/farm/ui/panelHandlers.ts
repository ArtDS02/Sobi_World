// What the shop and the bag popups do when clicked: the dialogs they open and the actions they run. Split out of
// app.ts, which only wires them to the shell (store, dialog host, the shell's own tab state).
import type { ItemId } from '../../../core/config/ids';
import { sellItem } from '../logic/actions/sellItem';
import type { NurseryPig } from '../logic/types';
import type { FarmStore } from '../store';
import { troughSpace } from './actionsVm';
import { openAdoptDialog, openBuyItemDialog, type Act } from './dialogs';
import type { ShopHandlers, ShopTab } from './screens/shopScreen';

export interface PanelHandlerDeps {
  store: FarmStore;
  dialogs: HTMLElement;
  now: () => number;
  act: Act;
  /** Runs an action without waiting for its result (a button click). */
  fire: ShopHandlers['act'];
  openTrough: (units?: number) => void;
  setShopTab: (tab: ShopTab) => void;
}

export function panelHandlers(d: PanelHandlerDeps) {
  const save = () => d.store.getSnapshot().save;
  const shop: ShopHandlers = {
    act: d.fire,
    tab: d.setShopTab,
    buyItem: (productId) => {
      const s = save();
      if (s) openBuyItemDialog(d.dialogs, s, productId, d.now(), d.act);
    },
  };
  const inventory = {
    fillTrough: () => {
      const s = save();
      if (s) d.openTrough(Math.min(s.inventory.FOOD_BASIC, troughSpace(s)));
    },
    sellItem: (itemId: ItemId, quantity: number) => d.fire((s, c) => sellItem(s, { itemId, quantity }, c)),
    raise: (baby: NurseryPig) => {
      const s = save();
      if (s) openAdoptDialog(d.dialogs, s, baby, d.act);
    },
  };
  return { shop, inventory };
}
