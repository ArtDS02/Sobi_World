// Shop (spec §10.1, Phase 2): pigs, items, slots. Skins arrive with R04.
import type { ItemId } from '../../core/config/ids';
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { BoundAction } from '../../store/gameStore';
import { shopItems, shopPigs, shopSlot } from '../actionsVm';
import { actionButton } from '../components/actionButton';
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

const card = (title: string, ...rest: (HTMLElement | null)[]) =>
  el('li', { class: 'shop__card' }, el('h3', { class: 'shop__name', text: title }), ...rest);
const line = (cls: string, text: string) => el('p', { class: `shop__${cls}`, text });

function pigsTab(save: SaveGame, now: number, on: ShopHandlers) {
  return shopPigs(save, now).map((p) =>
    card(
      p.name,
      line('price', p.price),
      el(
        'div',
        { class: 'shop__actions' },
        actionButton(p.male, () => on.act(p.male.run)),
        actionButton(p.female, () => on.act(p.female.run)),
      ),
    ),
  );
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

export function renderShopScreen(
  save: SaveGame,
  now: number,
  tab: ShopTab,
  on: ShopHandlers,
): HTMLElement {
  const cards =
    tab === 'pigs'
      ? pigsTab(save, now, on)
      : tab === 'items'
        ? itemsTab(save, on)
        : slotsTab(save, now, on);
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
