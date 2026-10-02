// Shop (spec §10.1): pigs, items, slots and skins (§8.13, catalogue from the manifest).
import type { AssetRegistry } from '../../core/assets/registry';
import type { ItemId } from '../../core/config/ids';
import type { Rarity } from '../../core/config/rarity';
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { BoundAction } from '../../store/gameStore';
import { shopItems, shopPigs, shopSlot } from '../actionsVm';
import { actionButton } from '../components/actionButton';
import { rarityBadge } from '../components/rarityBadge';
import { thumb } from '../components/thumb';
import { el } from '../dom';
import { shopSkins } from '../skinsVm';

export type ShopTab = 'pigs' | 'items' | 'slots' | 'skins';
const TABS: [ShopTab, string][] = [
  ['pigs', vi.shop.tabPigs],
  ['items', vi.shop.tabItems],
  ['slots', vi.shop.tabSlots],
  ['skins', vi.shop.tabSkins],
];

export interface ShopHandlers {
  act: (run: BoundAction) => void;
  tab: (tab: ShopTab) => void;
  buyItem: (itemId: ItemId) => void;
}

const card = (title: string, ...rest: (HTMLElement | null)[]) =>
  el('li', { class: 'shop__card' }, el('h3', { class: 'shop__name', text: title }), ...rest);
const line = (cls: string, text: string) => el('p', { class: `shop__${cls}`, text });

/** Species cards, one heading row per rarity (U04). */
function pigsTab(save: SaveGame, now: number, on: ShopHandlers, assets: AssetRegistry | null) {
  const rows: HTMLElement[] = [];
  let group: Rarity | null = null;
  for (const p of shopPigs(save, now, assets)) {
    if (p.rarity !== group) {
      group = p.rarity;
      rows.push(el('li', { class: 'shop__group' }, rarityBadge(p.rarity)));
    }
    rows.push(
      el(
        'li',
        { class: 'shop__card shop__card--pig', data: { breed: p.breed } },
        thumb(p.thumb, p.name),
        el('h3', { class: 'shop__name', text: p.name }),
        line('price', p.price),
        line('desc', p.sell),
        el(
          'div',
          { class: 'shop__actions' },
          actionButton(p.male, () => on.act(p.male.run)),
          actionButton(p.female, () => on.act(p.female.run)),
        ),
      ),
    );
  }
  return rows;
}

function itemsTab(save: SaveGame, on: ShopHandlers) {
  return shopItems(save).map((item) =>
    card(
      item.name,
      line('desc', item.desc),
      line('price', item.price),
      line('owned', `${vi.shop.owned}: ${item.owned}`),
      el('button', {
        class: 'c-button',
        text: vi.action.buy,
        attrs: { type: 'button' },
        on: { click: () => on.buyItem(item.id) },
      }),
    ),
  );
}

function slotsTab(save: SaveGame, now: number, on: ShopHandlers) {
  const slot = shopSlot(save, now);
  if (!slot) return [el('li', { class: 'c-empty', text: vi.error.MAX_SLOTS_REACHED })];
  return [
    card(
      slot.title,
      line('price', slot.price),
      actionButton(slot.buy, () => on.act(slot.buy.run)),
    ),
  ];
}

function skinsTab(save: SaveGame, now: number, on: ShopHandlers, assets: AssetRegistry | null) {
  if (!assets) return [];
  return shopSkins(save, now, assets).map((skin) =>
    el(
      'li',
      { class: 'shop__card shop__card--skin', data: { skin: skin.id } },
      thumb(skin.thumb, skin.name),
      el('h3', { class: 'shop__name', text: skin.name }),
      rarityBadge(skin.rarity),
      line('price', skin.price),
      actionButton(skin.button, () => on.act(skin.button.run)),
    ),
  );
}

export function renderShopScreen(
  save: SaveGame,
  now: number,
  tab: ShopTab,
  on: ShopHandlers,
  assets: AssetRegistry | null = null,
): HTMLElement {
  const cards =
    tab === 'pigs'
      ? pigsTab(save, now, on, assets)
      : tab === 'items'
        ? itemsTab(save, on)
        : tab === 'slots'
          ? slotsTab(save, now, on)
          : skinsTab(save, now, on, assets);
  return el(
    'section',
    { class: 'shop', data: { screen: 'shop' } },
    el('h2', { class: 'shop__title', text: vi.shop.title }),
    el(
      'div',
      { class: 'shop__tabs', attrs: { role: 'tablist' } },
      ...TABS.map(([id, label]) =>
        el('button', {
          class: `shop__tab${id === tab ? ' is-active' : ''}`,
          text: label,
          attrs: { type: 'button', role: 'tab', 'aria-selected': String(id === tab) },
          on: { click: () => on.tab(id) },
        }),
      ),
    ),
    el('ul', { class: 'shop__list' }, ...cards),
  );
}
