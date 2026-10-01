// Inventory (DECISIONS Q7): items, quantities and a quick use. Food quick-use fills the trough.
import { ITEM_IDS } from '../../core/config/items';
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface InventoryHandlers {
  fillTrough: () => void;
}

export function renderInventoryScreen(save: SaveGame, on: InventoryHandlers): HTMLElement {
  return el(
    'section',
    { class: 'inventory', data: { screen: 'inventory' } },
    el('h2', { class: 'inventory__title', text: vi.nav.inventory }),
    el(
      'ul',
      { class: 'inventory__list' },
      ...ITEM_IDS.map((id) =>
        el(
          'li',
          { class: 'inventory__row' },
          el('span', { class: 'inventory__name', text: vi.shop[id] }),
          el('span', { class: 'inventory__qty', text: `x${save.inventory[id]}` }),
          // Medicine is used from the sick pig's panel (it needs a target).
          id === 'FOOD_BASIC'
            ? el('button', {
                class: 'c-button',
                text: vi.action.fillTrough,
                attrs: { type: 'button' },
                on: { click: on.fillTrough },
              })
            : null,
        ),
      ),
    ),
  );
}
