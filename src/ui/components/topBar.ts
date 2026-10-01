// Top bar (spec §10.1, §10.4): level/XP bar, gold (→ history), trough gauge (→ fill dialog), the
// menu nav (the same popups as the world objects, reachable by keyboard) and settings.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { PanelId } from './popup';
import { topBarVm } from '../viewModel';

const NAV = ['shop', 'inventory', 'orders', 'collection'] as const;

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
    el('button', {
      class: 'c-button c-button--ghost topbar__nav-item',
      text: vi.nav[panel],
      attrs: { type: 'button' },
      on: { click: () => on.nav(panel) },
    });
  return el(
    'div',
    { class: 'topbar__inner' },
    el('span', { class: 'topbar__level', text: vm.level }),
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
    el('button', {
      class: 'c-button c-button--ghost topbar__gold',
      text: vm.gold,
      attrs: { type: 'button', title: vi.nav.history },
      on: { click: on.history },
    }),
    el('button', {
      class: `c-gauge${vm.troughEmpty ? ' is-empty' : ''}`,
      text: vm.trough,
      attrs: { type: 'button', title: vi.action.fillTrough },
      on: { click: on.trough },
    }),
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
