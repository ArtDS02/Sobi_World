// Inventory (DECISIONS Q7, decision 038): an unlimited bag split by Area tabs, with category chips, a search and a
// sort on top; each card shows the item, its rarity, how many and its quick actions. Food quick-use fills the trough.
import { ITEMS } from '../../../../core/config/items';
import type { AssetRegistry } from '../../../../core/assets/registry';
import type { NurseryPig, FarmGame } from '../../logic/types';
import { formatInt, t } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';
import { AREA_HUD_ART, itemArtId, type UiIcon } from '../../../../core/config/assetIds';
import type { ItemId } from '../../../../core/config/ids';
import { art, icon } from '../../../../ui/components/icon';
import { rarityBadge } from '../../../../ui/components/rarityBadge';
import { el } from '../../../../ui/dom';
import { renderNursery } from './inventoryNursery';
import { localOffsetMs } from '../../../../ui/localDay';
import { itemSalePrice } from '../../../../systems/valuation/itemPrice';
import { INVENTORY_SORTS, inventoryVm, type InventoryArea, type InventoryCategory, type InventorySort, type InventoryView } from './inventoryVm';

const ITEM_ICON: Partial<Record<ItemId, UiIcon>> = { FOOD_BASIC: 'fillTrough', MEDICINE_COMMON: 'treat', item_manure: 'cleanAll' };
/** The picture on each Area tab and category chip: a typical item of it. */
const AREA_ART: Record<Exclude<InventoryArea, 'all'>, ItemId> = {
  sobi_farm: 'FOOD_BASIC',
  sobi_garden: 'item_carrot',
  sobi_aquarium: 'item_fish_goldfish',
  sobi_cloud: 'item_flower_rainbow_rose',
  sobi_adventure: 'item_equip_fire_staff',
};
const CATEGORY_ART: Record<Exclude<InventoryCategory, 'all'>, ItemId> = {
  FOOD: 'FOOD_PREMIUM',
  MEDICINE: 'MEDICINE_COMMON',
  MATERIAL: 'item_pearl',
  SEED: 'item_seed_corn',
  CROP: 'item_corn',
  FISH: 'item_fish_clownfish',
  FLOWER: 'item_flower_star_orchid',
  POTION: 'item_potion_healing',
  EQUIPMENT: 'item_equip_stone_shield',
};

export interface InventoryHandlers {
  fillTrough: () => void;
  /** Sell every unit of a sellable item (Sobi Coin). */
  sellItem: (id: ItemId, quantity: number) => void;
  /** Hatch an egg of the Adventure into a pig (GĐ11). */
  hatch: (id: ItemId) => void;
  /** A newborn in the nursery was clicked: ask whether to raise it now (BR-1). */
  raise: (baby: NurseryPig) => void;
  /** The tab, chip, search or sort changed; `focusSearch` keeps the caret in the search box after the redraw. */
  view: (next: Partial<InventoryView>, focusSearch?: boolean) => void;
}

const itemPic = (id: ItemId) => icon(ITEM_ICON[id]) ?? art(itemArtId(id), 'c-icon');

function areaTabs(vm: ReturnType<typeof inventoryVm>, on: InventoryHandlers) {
  return el(
    'div',
    { class: 'inventory__areas', attrs: { role: 'tablist', 'aria-label': vi.inventory.areasLabel } },
    ...vm.areas.map((a) =>
      el(
        'button',
        {
          class: `inventory__area${a.active ? ' is-active' : ''}${a.kinds === 0 ? ' is-empty' : ''}`,
          data: { area: a.id },
          attrs: { type: 'button', role: 'tab', 'aria-selected': String(a.active) },
          on: { click: () => on.view({ area: a.id, category: 'all' }) },
        },
        el('span', { class: 'inventory__area-pic' }, a.id === 'all' ? art(AREA_HUD_ART.items, 'c-icon') : itemPic(AREA_ART[a.id])),
        el('span', { class: 'inventory__area-name', text: vi.inventory.areas[a.id] }),
        el('span', { class: 'inventory__count', text: formatInt(a.kinds) }),
      ),
    ),
  );
}

function tools(view: InventoryView, on: InventoryHandlers) {
  const search = el('input', {
    class: 'inventory__search-input',
    data: { inventorySearch: '' },
    attrs: { type: 'search', placeholder: vi.inventory.search, 'aria-label': vi.inventory.searchLabel, value: view.query, autocomplete: 'off', spellcheck: 'false' },
    on: {
      input: (e) => on.view({ query: (e.target as HTMLInputElement).value }, true),
      keydown: (e) => {
        if ((e as KeyboardEvent).key === 'Escape' && view.query) {
          e.stopPropagation();
          on.view({ query: '' }, true);
        }
      },
    },
  });
  return el(
    'div',
    { class: 'inventory__tools' },
    el(
      'label',
      { class: 'inventory__search' },
      el('span', { class: 'inventory__search-glass', attrs: { 'aria-hidden': 'true' } }),
      search,
      view.query
        ? el('button', { class: 'inventory__search-clear', text: '×', attrs: { type: 'button', 'aria-label': vi.inventory.clearSearch, title: vi.inventory.clearSearch }, on: { click: () => on.view({ query: '' }, true) } })
        : null,
    ),
    el(
      'label',
      { class: 'inventory__sort' },
      el('span', { text: vi.inventory.sortLabel }),
      el(
        'select',
        { class: 'inventory__sort-select', attrs: { 'aria-label': vi.inventory.sortLabel }, on: { change: (e) => on.view({ sort: (e.target as HTMLSelectElement).value as InventorySort }) } },
        ...INVENTORY_SORTS.map((s) => el('option', { text: vi.inventory.sorts[s], attrs: { value: s, ...(s === view.sort ? { selected: '' } : {}) } })),
      ),
    ),
  );
}

function categoryChips(vm: ReturnType<typeof inventoryVm>, on: InventoryHandlers) {
  return el(
    'div',
    { class: 'inventory__cats', attrs: { role: 'tablist', 'aria-label': vi.inventory.categoriesLabel } },
    ...vm.categories.map((c) =>
      el(
        'button',
        {
          class: `inventory__cat${c.active ? ' is-active' : ''}`,
          data: { category: c.id },
          attrs: { type: 'button', role: 'tab', 'aria-selected': String(c.active) },
          on: { click: () => on.view({ category: c.id }) },
        },
        c.id === 'all' ? null : itemPic(CATEGORY_ART[c.id]),
        el('span', { text: vi.inventory.categories[c.id] }),
        el('span', { class: 'inventory__count', text: formatInt(c.kinds) }),
      ),
    ),
  );
}

function card(save: FarmGame, id: ItemId, on: InventoryHandlers, now: number | undefined) {
  const def = ITEMS[id];
  const qty = save.inventory[id];
  const actions = [
    // Medicine is used from the sick pig's panel (it needs a target).
    id === 'FOOD_BASIC' && qty > 0
      ? el('button', { class: 'c-button inventory__act', attrs: { type: 'button' }, on: { click: on.fillTrough } }, icon('fillTrough'), vi.action.fillTrough)
      : null,
    def.hatchRarity && qty > 0 ? el('button', { class: 'c-button inventory__act', attrs: { type: 'button' }, on: { click: () => on.hatch(id) } }, vi.inventory.hatch) : null,
    def.sellGold !== undefined && qty > 0
      ? el(
          'button',
          { class: 'c-button inventory__act inventory__act--sell', attrs: { type: 'button' }, on: { click: () => on.sellItem(id, qty) } },
          icon('coin'),
          t(vi.inventory.sellAll, { gold: formatInt(now === undefined ? def.sellGold * qty : itemSalePrice(def, qty, now, localOffsetMs(now))) }),
        )
      : null,
  ].filter((b) => b !== null);
  return el(
    'li',
    { class: `inventory__card is-${def.rarity.toLowerCase()}${qty === 0 ? ' is-out' : ''}`, data: { item: id } },
    el('span', { class: 'inventory__pic' }, itemPic(id), el('span', { class: 'inventory__qty', text: `x${formatInt(qty)}`, attrs: { title: t(vi.inventory.owned, { n: formatInt(qty) }) } })),
    el(
      'span',
      { class: 'inventory__text' },
      el('span', { class: 'inventory__name', text: vi.shop[id] }),
      el('span', { class: 'inventory__tags' }, rarityBadge(def.rarity), el('span', { class: 'inventory__tag', text: vi.inventory.categories[def.category] })),
      el('span', { class: 'inventory__desc', text: vi.shop[`${id}_desc`], attrs: { title: vi.shop[`${id}_desc`] } }),
    ),
    actions.length > 0 ? el('span', { class: 'inventory__actions' }, ...actions) : null,
  );
}

export function renderInventoryScreen(
  save: FarmGame,
  on: InventoryHandlers,
  view: InventoryView,
  assets?: AssetRegistry,
  /** When the shop prices the items (the day's market moves them); the plain price when absent. */
  now?: number,
): HTMLElement {
  const vm = inventoryVm(save.inventory, view);
  const filtered = view.query !== '' || vm.categories.some((c) => c.active && c.id !== 'all');
  const showNursery = view.area === 'all' || view.area === 'sobi_farm';
  return el(
    'section',
    { class: 'inventory', data: { screen: 'inventory' } },
    // The tabs, the tools and the chips stay on top while the cards scroll.
    el(
      'div',
      { class: 'inventory__head' },
      areaTabs(vm, on),
      tools(view, on),
      categoryChips(vm, on),
    ),
    el(
      'div',
      { class: 'inventory__summary' },
      el('span', { text: t(vi.inventory.summary, { kinds: formatInt(vm.totalKinds), units: formatInt(vm.totalUnits) }) }),
      el('span', { class: 'inventory__unlimited', text: vi.inventory.unlimited }),
    ),
    showNursery && (save.nursery.length > 0 || view.area === 'sobi_farm') && !filtered ? renderNursery(save, on.raise, assets) : null,
    vm.items.length > 0
      ? el('ul', { class: 'inventory__grid' }, ...vm.items.map((id) => card(save, id, on, now)))
      : el(
          'div',
          { class: 'c-empty inventory__empty' },
          art(AREA_HUD_ART.items, 'inventory__empty-pic'),
          el('p', { text: vm.areaEmpty ? vi.inventory.emptyArea : vi.inventory.emptyFilter }),
          filtered
            ? el('button', { class: 'c-button', attrs: { type: 'button' }, on: { click: () => on.view({ category: 'all', query: '' }) } }, vi.inventory.resetFilter)
            : null,
        ),
  );
}
