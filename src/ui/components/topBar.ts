// Top bar (spec §10.1): level/XP, gold, trough gauge, settings.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { topBarVm } from '../viewModel';

export function renderTopBar(save: SaveGame, onSettings: () => void): HTMLElement {
  const vm = topBarVm(save);
  return el(
    'div',
    { class: 'topbar__inner' },
    el('span', { class: 'topbar__level', text: vm.level }),
    el('span', { class: 'topbar__xp', text: vm.xp }),
    el('span', { class: 'topbar__gold', text: vm.gold }),
    el('span', {
      class: `c-gauge${vm.troughEmpty ? ' is-empty' : ''}`,
      text: vm.trough,
    }),
    el('button', {
      class: 'c-button c-button--icon topbar__settings',
      text: '⚙',
      attrs: { type: 'button', 'aria-label': vi.nav.settings },
      on: { click: onSettings },
    }),
  );
}
