// The Farm's right-hand menu (decision 057, B1), the same component the other Areas use: more pens ("Mở rộng ô": the shop's
// pen tab), the shop and the bag. The dock keeps its own buttons (the tutorial and the coach marks point at them).
import { createSideMenu } from '../../../ui/components/sideMenu';
import { el } from '../../../ui/dom';
import { SIDE_MENU_DEFAULT_POS, sideMenuItems } from '../../../ui/world/sideMenuVm';
import { vi } from '../../../i18n/vi';
import type { FarmGame } from '../logic/types';
import { shopSlot } from './actionsVm';

export interface FarmSideMenuDeps {
  now: () => number;
  /** Opens the shop on its pen tab. */
  openSlots: () => void;
  openShop: () => void;
  openBag: () => void;
}

export function farmSideMenu(worldEl: HTMLElement, d: FarmSideMenuDeps) {
  const host = el('div', { class: 'farm-side' });
  worldEl.append(host);
  const menu = createSideMenu(host);
  return {
    /** `save` null = not on the farm (or nothing loaded): no menu. */
    render(save: FarmGame | null) {
      if (!save) return menu.render(null);
      menu.render(
        sideMenuItems('farm', {
          // Off only when every pen is open; otherwise the shop's pen tab says the price and what is missing.
          expand: { reason: shopSlot(save, d.now()) ? null : vi.sideMenu.slotsMax, onClick: d.openSlots },
          shop: { reason: null, onClick: d.openShop },
          bag: { reason: null, onClick: d.openBag },
        }),
        SIDE_MENU_DEFAULT_POS,
      );
    },
  };
}
