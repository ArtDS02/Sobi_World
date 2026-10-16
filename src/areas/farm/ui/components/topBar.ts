// HUD over the farm (spec §10.1, §10.4; the Areas' shared HUD, decision 031): violet pills top-left (level star + XP bar,
// gold → history, trough gauge → fill dialog, pig count / capacity → shop), square buttons top-right (plaza, menu), and the
// bottom dock with the menu nav (the same popups as the world objects, reachable by keyboard).
import { readyOrderCount } from '../../logic/actions/fulfillOrder';
import type { FarmGame } from '../../logic/types';
import { vi } from '../../../../i18n/vi';
import { AREA_HUD_ART, type UiIcon } from '../../../../core/config/assetIds';
import { hudLevel, hudNav } from '../../../../ui/components/areaHud';
import { el } from '../../../../ui/dom';
import { icon } from '../../../../ui/components/icon';
import type { PanelId } from '../../../../ui/components/popup';
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
      class: `c-bar topbar__bar topbar__bar--${mod}`,
      attrs: { role: 'progressbar', 'aria-valuenow': String(progress) },
    },
    el('span', { class: 'c-bar__fill', attrs: { style: `width: ${progress}%` } }),
  );

export function renderTopBar(
  save: FarmGame,
  now: number,
  on: {
    /** The menu (settings live there too; Esc still opens them). */
    menu: () => void;
    /** Back to the plaza; absent in DOM tests. */
    home?: () => void;
    trough: () => void;
    history: () => void;
    nav: (panel: PanelId) => void;
    /** The HUD alert for ill pigs: open this pig's panel. */
    pig: (pigId: string) => void;
    /** Rewards waiting in the goals panel. */
    goalsDot?: number;
  },
): HTMLElement {
  const vm = topBarVm(save, now);
  const clock = clockVm(now);
  const dots: Partial<Record<(typeof NAV)[number], number>> = {
    orders: readyOrderCount(save, now),
    achievements: on.goalsDot ?? 0,
  };
  // The dock: one cream card per popup, like the Areas' action cards (decision 031).
  const navButton = (panel: (typeof NAV)[number]) =>
    el(
      'button',
      {
        class: 'a-dock__act topbar__nav-item',
        attrs: { type: 'button', title: vi.nav[panel] },
        on: { click: () => on.nav(panel) },
      },
      el('span', { class: 'a-dock__act-icon' }, icon(NAV_ICON[panel])),
      el('span', { class: 'a-dock__act-label', text: vi.nav[panel] }),
      (dots[panel] ?? 0) > 0
        ? el('span', { class: 'c-dot', text: String(dots[panel]), attrs: { 'aria-hidden': 'true' } })
        : null,
    );
  return el(
    'div',
    { class: 'topbar__inner' },
    el(
      'div',
      { class: 'a-hud__pills topbar__pills' },
      hudLevel(vm),
      el(
        'button',
        {
          class: 'a-hud__pill topbar__gold',
          attrs: { type: 'button', title: vi.nav.history, 'aria-label': vm.gold },
          on: { click: on.history },
        },
        el('span', { class: 'a-hud__pill-icon' }, icon('coin')),
        el('b', { text: vm.goldAmount }),
      ),
      el(
        'button',
        {
          class: `a-hud__pill c-gauge${vm.troughEmpty ? ' is-empty' : ''}`,
          attrs: { type: 'button', title: vi.action.fillTrough, 'aria-label': vm.trough },
          on: { click: on.trough },
        },
        el('span', { class: 'a-hud__pill-icon' }, icon('trough')),
        bar(vm.troughProgress, 'trough'),
        el('b', { text: vm.troughShort }),
      ),
      el(
        'button',
        {
          class: `a-hud__pill topbar__pigs${vm.pigsFull ? ' is-full' : ''}`,
          attrs: { type: 'button', title: vm.pigsTitle, 'aria-label': vm.pigsTitle },
          on: { click: () => on.nav('shop') },
        },
        el('span', { class: 'topbar__pigs-icon', text: vi.hud.pigsIcon, attrs: { 'aria-hidden': 'true' } }),
        el('b', { text: vm.pigs }),
      ),
      vm.alert
        ? el(
            'button',
            {
              class: `a-hud__pill topbar__alert${vm.alert.critical ? ' is-critical' : ''}`,
              attrs: { type: 'button', 'aria-label': vm.alert.text },
              on: { click: () => on.pig(vm.alert!.pigId) },
            },
            el('span', { text: '⚠', attrs: { 'aria-hidden': 'true' } }),
            el('b', { text: vm.alert.text }),
          )
        : null,
      clock
        ? el(
            'span',
            { class: 'a-hud__pill topbar__clock', attrs: { title: clock.phase } },
            el('span', { class: 'topbar__clock-icon', text: clock.icon, attrs: { 'aria-hidden': 'true' } }),
            el('b', { text: clock.time }),
          )
        : null,
    ),
    hudNav(vi.nav.farm, [
      ...(on.home ? [{ icon: AREA_HUD_ART.plaza, label: vi.farm.plaza, onClick: on.home, cls: 'topbar__home' }] : []),
      { icon: AREA_HUD_ART.menu, label: vi.nav.menu, onClick: on.menu, cls: 'topbar__menu' },
    ]),
    el('nav', { class: 'a-dock topbar__nav', attrs: { 'aria-label': vi.app.title } }, ...NAV.map(navButton)),
  );
}
