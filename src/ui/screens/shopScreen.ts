// Shop (spec §10.1): pig species, items and slots.
import type { AssetRegistry } from '../../core/assets/registry';
import type { ItemId } from '../../core/config/ids';
import type { Rarity } from '../../core/config/rarity';
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { BoundAction } from '../../store/gameStore';
import { shopItems, shopPigs, shopSlot } from '../actionsVm';
import { actionButton } from '../components/actionButton';
import { rarityBadge } from '../components/rarityBadge';
import { art, icon } from '../components/icon';
import { thumb } from '../components/thumb';
import type { UiIcon } from '../../core/config/assetIds';
import { el } from '../dom';

export type ShopTab = 'pigs' | 'items' | 'slots';
const TABS: [ShopTab, string][] = [
  ['pigs', vi.shop.tabPigs],
  ['items', vi.shop.tabItems],
  ['slots', vi.shop.tabSlots],
];

export interface ShopHandlers {
  act: (run: BoundAction) => void;
  tab: (tab: ShopTab) => void;
  buyItem: (itemId: ItemId) => void;
}

/** Picture per shop item (ui icons; the pig house art for a new slot). */
const ITEM_ICON: Record<ItemId, UiIcon> = { FOOD_BASIC: 'fillTrough', MEDICINE_COMMON: 'treat' };

const card = (pic: HTMLElement | null, title: string, ...rest: (HTMLElement | null)[]) =>
  el(
    'li',
    { class: 'shop__card' },
    el('div', { class: 'shop__pic' }, pic),
    el('div', { class: 'shop__info' }, el('h3', { class: 'shop__name', text: title }), ...rest),
  );
const line = (cls: string, text: string) => el('p', { class: `shop__${cls}`, text });
const price = (text: string) => el('p', { class: 'shop__price' }, icon('gold'), text);

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
        el('div', { class: 'shop__pic' }, thumb(p.thumb, p.name)),
        el(
          'div',
          { class: 'shop__info' },
          el('h3', { class: 'shop__name', text: p.name }),
          price(p.price),
          line('desc', p.sell),
          el(
            'div',
            { class: 'shop__actions' },
            actionButton({ ...p.male, label: `♂ ${p.male.label}` }, () => on.act(p.male.run)),
            actionButton({ ...p.female, label: `♀ ${p.female.label}` }, () =>
              on.act(p.female.run),
            ),
          ),
        ),
      ),
    );
  }
  return rows;
}

function itemsTab(save: SaveGame, on: ShopHandlers) {
  return shopItems(save).map((item) =>
    card(
      icon(ITEM_ICON[item.id]),
      item.name,
      line('desc', item.desc),
      price(item.price),
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
      art('prop_pig_house', 'shop__art'),
      slot.title,
      price(slot.price),
      actionButton(slot.buy, () => on.act(slot.buy.run)),
    ),
  ];
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
        : slotsTab(save, now, on);
  return el(
    'section',
    { class: 'shop', data: { screen: 'shop' } },
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
