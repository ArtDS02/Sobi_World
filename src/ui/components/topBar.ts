// HUD over the farm (spec §10.1, §10.4, farm layout rework): pills top-left (level + XP bar,
// gold → history, trough gauge → fill dialog, pig count / capacity → shop), settings top-right, and the bottom dock with the
// menu nav (the same popups as the world objects, reachable by keyboard).
import { readyOrderCount } from '../../core/actions/fulfillOrder';
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { UiIcon } from '../../core/config/assetIds';
import { el } from '../dom';
import { icon } from './icon';
import type { PanelId } from './popup';
import { progressDot } from '../progressVm';
import { clockVm, topBarVm } from '../viewModel';

const NAV = ['shop', 'inventory', 'orders', 'collection', 'achievements'] as const;
const NAV_ICON: Record<(typeof NAV)[number], UiIcon> = {
  shop: 'shop',
  inventory: 'fillTrough',
  orders: 'orders',
  collection: 'collection',
  achievements: 'xp',
};

const bar = (progress: number, mod: string) =>
  el(
    'span',
    {
      class: `c-bar hud-pill__bar hud-pill__bar--${mod}`,
      attrs: { role: 'progressbar', 'aria-valuenow': String(progress) },
    },
    el('span', { class: 'c-bar__fill', attrs: { style: `width: ${progress}%` } }),
  );

export function renderTopBar(
  save: SaveGame,
  now: number,
  on: {
    settings: () => void;
    trough: () => void;
    history: () => void;
    nav: (panel: PanelId) => void;
  },
): HTMLElement {
  const vm = topBarVm(save);
  const clock = clockVm(now);
  const dots: Partial<Record<(typeof NAV)[number], number>> = {
    orders: readyOrderCount(save, now),
    achievements: progressDot(save, now),
  };
  const navButton = (panel: (typeof NAV)[number]) =>
    el(
      'button',
      {
        class: 'topbar__nav-item',
        attrs: { type: 'button' },
        on: { click: () => on.nav(panel) },
      },
      el('span', { class: 'topbar__nav-icon' }, icon(NAV_ICON[panel])),
      el('span', { class: 'topbar__nav-label', text: vi.nav[panel] }),
      (dots[panel] ?? 0) > 0
        ? el('span', { class: 'c-dot', text: String(dots[panel]), attrs: { 'aria-hidden': 'true' } })
        : null,
    );
  return el(
    'div',
    { class: 'topbar__inner' },
    el(
      'div',
      { class: 'topbar__pills' },
      el(
        'span',
        { class: 'hud-pill topbar__level', attrs: { title: vm.xp } },
        el('span', { class: 'hud-pill__star', text: '★', attrs: { 'aria-hidden': 'true' } }),
        el('b', { text: vm.level }),
        bar(vm.xpProgress, 'xp'),
        el('span', { class: 'hud-pill__sub', text: vm.xp }),
      ),
      el(
        'button',
        {
          class: 'hud-pill topbar__gold',
          attrs: { type: 'button', title: vi.nav.history, 'aria-label': vm.gold },
          on: { click: on.history },
        },
        icon('gold'),
        el('b', { text: vm.goldAmount }),
        el('span', { class: 'hud-pill__sub', text: vi.hud.goldUnit }),
      ),
      el(
        'button',
        {
          class: `hud-pill c-gauge${vm.troughEmpty ? ' is-empty' : ''}`,
          attrs: { type: 'button', title: vi.action.fillTrough, 'aria-label': vm.trough },
          on: { click: on.trough },
        },
        icon('trough'),
        bar(vm.troughProgress, 'trough'),
        el('b', { text: vm.troughShort }),
      ),
      el(
        'button',
        {
          class: `hud-pill topbar__pigs${vm.pigsFull ? ' is-full' : ''}`,
          attrs: { type: 'button', title: vm.pigsTitle, 'aria-label': vm.pigsTitle },
          on: { click: () => on.nav('shop') },
        },
        el('span', { class: 'topbar__pigs-icon', text: vi.hud.pigsIcon, attrs: { 'aria-hidden': 'true' } }),
        el('b', { text: vm.pigs }),
      ),
      clock
        ? el(
            'span',
            { class: 'hud-pill topbar__clock', attrs: { title: clock.phase } },
            el('span', { class: 'topbar__clock-icon', text: clock.icon, attrs: { 'aria-hidden': 'true' } }),
            el('b', { text: clock.time }),
          )
        : null,
    ),
    el('button', {
      class: 'topbar__settings',
      text: '⚙',
      attrs: { type: 'button', 'aria-label': vi.nav.settings },
      on: { click: on.settings },
    }),
    el(
      'nav',
      { class: 'topbar__nav', attrs: { 'aria-label': vi.app.title } },
      ...NAV.map(navButton),
    ),
  );
}
