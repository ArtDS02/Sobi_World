// Inventory (DECISIONS Q7): items, quantities and a quick use. Food quick-use fills the trough.
import { ITEMS, ITEM_IDS } from '../../../../core/config/items';
import type { AssetRegistry } from '../../../../core/assets/registry';
import type { NurseryPig, FarmGame } from '../../logic/types';
import { formatInt, t } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';
import type { UiIcon } from '../../../../core/config/assetIds';
import type { ItemId } from '../../../../core/config/ids';
import { itemArtId } from '../../../../core/config/assetIds';
import { art, icon } from '../../../../ui/components/icon';
import { el } from '../../../../ui/dom';
import { renderNursery } from './inventoryNursery';

const ITEM_ICON: Partial<Record<ItemId, UiIcon>> = { FOOD_BASIC: 'fillTrough', MEDICINE_COMMON: 'treat', item_manure: 'cleanAll' };
/** Shown even when the bag holds none: the trough food and the medicine are always at hand. */
const STAPLES: readonly ItemId[] = ['FOOD_BASIC', 'MEDICINE_COMMON'];

export interface InventoryHandlers {
  fillTrough: () => void;
  /** Sell every unit of a sellable item (Sobi Coin). */
  sellItem: (id: ItemId, quantity: number) => void;
  /** A newborn in the nursery was clicked: ask whether to raise it now (BR-1). */
  raise: (baby: NurseryPig) => void;
}

export function renderInventoryScreen(
  save: FarmGame,
  on: InventoryHandlers,
  assets?: AssetRegistry,
): HTMLElement {
  return el(
    'section',
    { class: 'inventory', data: { screen: 'inventory' } },
    renderNursery(save, on.raise, assets),
    el(
      'ul',
      { class: 'inventory__list' },
      ...ITEM_IDS.filter((id) => save.inventory[id] > 0 || STAPLES.includes(id)).map((id) =>
        el(
          'li',
          { class: 'inventory__row' },
          el('span', { class: 'inventory__pic' }, icon(ITEM_ICON[id]) ?? art(itemArtId(id), 'c-icon')),
          el(
            'span',
            { class: 'inventory__text' },
            el('span', { class: 'inventory__name', text: vi.shop[id] }),
            el('span', { class: 'inventory__desc', text: vi.shop[`${id}_desc`] }),
          ),
          el('span', { class: 'inventory__qty', text: `x${save.inventory[id]}` }),
          // Medicine is used from the sick pig's panel (it needs a target).
          id === 'FOOD_BASIC'
            ? el(
                'button',
                { class: 'c-button', attrs: { type: 'button' }, on: { click: on.fillTrough } },
                icon('fillTrough'),
                vi.action.fillTrough,
              )
            : null,
          ITEMS[id].sellGold !== undefined
            ? el(
                'button',
                { class: 'c-button', attrs: { type: 'button' }, on: { click: () => on.sellItem(id, save.inventory[id]) } },
                t(vi.inventory.sellAll, { gold: formatInt(ITEMS[id].sellGold! * save.inventory[id]) }),
              )
            : null,
        ),
      ),
    ),
  );
}
