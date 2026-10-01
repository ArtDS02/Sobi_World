// Top bar (spec §10.1): level/XP bar, gold (tap → history), trough gauge (tap → fill dialog), settings.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { topBarVm } from '../viewModel';

export function renderTopBar(
  save: SaveGame,
  on: { settings: () => void; trough: () => void; history: () => void },
): HTMLElement {
  const vm = topBarVm(save);
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
    el('button', {
      class: 'c-button c-button--icon topbar__settings',
      text: '⚙',
      attrs: { type: 'button', 'aria-label': vi.nav.settings },
      on: { click: on.settings },
    }),
  );
}
