// The bag's view (decision 038): what the Area tab, the category chips, the search and the sort leave on screen.
// `inventoryVm` is pure over the item counts so it can be tested without the DOM.
import { ITEMS, ITEM_IDS } from '../../../../core/config/items';
import type { ItemId } from '../../../../core/config/ids';
import { RARITY_VALUES, ITEM_AREA_VALUES, ITEM_CATEGORY_VALUES, type ItemArea, type ItemCategory } from '../../../../../content/schemas/vocab';
import { vi } from '../../../../i18n/vi';
import type { Place } from '../appTypes';

export type InventoryArea = ItemArea | 'all';
export type InventoryCategory = ItemCategory | 'all';
export const INVENTORY_SORTS = ['default', 'qty', 'rarity', 'name'] as const;
export type InventorySort = (typeof INVENTORY_SORTS)[number];

export interface InventoryView {
  area: InventoryArea;
  category: InventoryCategory;
  query: string;
  sort: InventorySort;
}

export const INVENTORY_AREAS: readonly InventoryArea[] = ['all', ...ITEM_AREA_VALUES];

/** Shown even when the bag holds none: the trough food and the medicine are always at hand. */
export const STAPLES: readonly ItemId[] = ['FOOD_BASIC', 'MEDICINE_COMMON'];

/** The bag opens on the tab of the place on screen; the plaza shows everything. */
export const PLACE_BAG_TAB: Record<Place, InventoryArea> = {
  plaza: 'all',
  area: 'sobi_farm',
  garden: 'sobi_garden',
  aquarium: 'sobi_aquarium',
  cloud: 'sobi_cloud',
  adventure: 'sobi_adventure',
};

/** The shell's handler for a view change: keep it, redraw, and put the caret back at the end of the new search box. */
export const bagViewHandler =
  (ui: { inventory: InventoryView }, rerender: () => void, host: ParentNode) =>
  (next: Partial<InventoryView>, focusSearch = false) => {
    ui.inventory = { ...ui.inventory, ...next };
    rerender();
    if (!focusSearch) return;
    const input = host.querySelector<HTMLInputElement>('[data-inventory-search]');
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  };

export const defaultInventoryView = (area: InventoryArea = 'all'): InventoryView => ({ area, category: 'all', query: '', sort: 'default' });

/** Lowercase without Vietnamese marks, so "ca vang" finds "Cá vàng". */
export const foldText = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();

export interface InventoryTabVm<K extends string> {
  id: K;
  /** Kinds of items held under it. */
  kinds: number;
  active: boolean;
}

export interface InventoryVm {
  areas: InventoryTabVm<InventoryArea>[];
  /** Only the categories the Area tab holds (plus "all"). */
  categories: InventoryTabVm<InventoryCategory>[];
  items: ItemId[];
  /** Kinds and units in the Area tab (before the chips and the search). */
  totalKinds: number;
  totalUnits: number;
  /** The Area tab holds nothing at all (as opposed to a filter that hides everything). */
  areaEmpty: boolean;
}

const held = (counts: Readonly<Record<string, number>>, id: ItemId) => (counts[id] ?? 0) > 0 || STAPLES.includes(id);
const inArea = (id: ItemId, area: InventoryArea) => area === 'all' || ITEMS[id].area === area;
const RARITY_RANK = Object.fromEntries(RARITY_VALUES.map((r, i) => [r, i])) as Record<string, number>;

export function inventoryVm(counts: Readonly<Record<string, number>>, view: InventoryView): InventoryVm {
  const shown = ITEM_IDS.filter((id) => held(counts, id));
  const areaItems = shown.filter((id) => inArea(id, view.area));
  const category = view.category !== 'all' && !areaItems.some((id) => ITEMS[id].category === view.category) ? 'all' : view.category;
  const q = foldText(view.query);
  const items = areaItems
    .filter((id) => category === 'all' || ITEMS[id].category === category)
    .filter((id) => !q || foldText(vi.shop[id]).includes(q) || foldText(vi.shop[`${id}_desc`]).includes(q));
  const name = (id: ItemId) => vi.shop[id];
  const order = ITEM_IDS.indexOf.bind(ITEM_IDS);
  const sorted =
    view.sort === 'qty'
      ? items.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || order(a) - order(b))
      : view.sort === 'rarity'
        ? items.sort((a, b) => RARITY_RANK[ITEMS[b].rarity]! - RARITY_RANK[ITEMS[a].rarity]! || order(a) - order(b))
        : view.sort === 'name'
          ? items.sort((a, b) => name(a).localeCompare(name(b), 'vi'))
          : items;
  return {
    areas: INVENTORY_AREAS.map((id) => ({ id, kinds: shown.filter((i) => inArea(i, id) && (counts[i] ?? 0) > 0).length, active: id === view.area })),
    categories: (['all', ...ITEM_CATEGORY_VALUES] as InventoryCategory[])
      .map((id) => ({ id, kinds: areaItems.filter((i) => (id === 'all' || ITEMS[i].category === id) && (counts[i] ?? 0) > 0).length, active: id === category }))
      .filter((c) => c.id === 'all' || areaItems.some((i) => ITEMS[i].category === c.id)),
    items: sorted,
    totalKinds: areaItems.filter((i) => (counts[i] ?? 0) > 0).length,
    totalUnits: areaItems.reduce((n, i) => n + (counts[i] ?? 0), 0),
    areaEmpty: areaItems.length === 0,
  };
}
