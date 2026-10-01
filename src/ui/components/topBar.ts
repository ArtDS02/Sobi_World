// Top bar (spec §10.1, §10.4): level/XP bar, gold (→ history), trough gauge (→ fill dialog), the
// menu nav (the same popups as the world objects, reachable by keyboard) and settings.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { UiIcon } from '../../core/config/assetIds';
import { el } from '../dom';
import { icon } from './icon';
import type { PanelId } from './popup';
import { topBarVm } from '../viewModel';

const NAV = ['shop', 'inventory', 'orders', 'collection'] as const;
const NAV_ICON: Record<(typeof NAV)[number], UiIcon | undefined> = {
  shop: 'shop',
  inventory: undefined,
  orders: 'orders',
  collection: 'collection',
};

export function renderTopBar(
  save: SaveGame,
  on: {
    settings: () => void;
    trough: () => void;
    history: () => void;
    nav: (panel: PanelId) => void;
  },
): HTMLElement {
  const vm = topBarVm(save);
  const navButton = (panel: (typeof NAV)[number]) =>
    el(
      'button',
      {
        class: 'c-button c-button--ghost topbar__nav-item',
        attrs: { type: 'button' },
        on: { click: () => on.nav(panel) },
      },
      icon(NAV_ICON[panel]),
      vi.nav[panel],
    );
  return el(
    'div',
    { class: 'topbar__inner' },
    el('span', { class: 'topbar__level' }, icon('xp'), vm.level),
    el(
      'span',
      { class: 'topbar__xp' },
      el('span', { text: vm.xp }),
      el(
        'span',
        {
          class: 'c-bar topbar__xp-bar',
          attrs: { role: 'progressbar', 'aria-valuenow': String(vm.xpProgress) },
        },
        el('span', { class: 'c-bar__fill', attrs: { style: `width: ${vm.xpProgress}%` } }),
      ),
    ),
    el(
      'button',
      {
        class: 'c-button c-button--ghost topbar__gold',
        attrs: { type: 'button', title: vi.nav.history },
        on: { click: on.history },
      },
      icon('gold'),
      vm.gold,
    ),
    el(
      'button',
      {
        class: `c-gauge${vm.troughEmpty ? ' is-empty' : ''}`,
        attrs: { type: 'button', title: vi.action.fillTrough },
        on: { click: on.trough },
      },
      icon('trough'),
      vm.trough,
    ),
    el(
      'nav',
      { class: 'topbar__nav', attrs: { 'aria-label': vi.app.title } },
      ...NAV.map(navButton),
    ),
    el('button', {
      class: 'c-button c-button--icon topbar__settings',
      text: '⚙',
      attrs: { type: 'button', 'aria-label': vi.nav.settings },
      on: { click: on.settings },
    }),
  );
}
