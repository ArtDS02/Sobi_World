// Bottom navigation (spec §10.1).
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export const SCREENS = [
  'farm',
  'shop',
  'inventory',
  'orders',
  'collection',
  'history',
  'settings',
] as const;
export type ScreenId = (typeof SCREENS)[number];

/** Screens shown in the bottom bar; history and settings are reached elsewhere. */
const NAV: ScreenId[] = ['farm', 'shop', 'inventory', 'orders', 'collection'];

export function renderNavBar(current: ScreenId, onGo: (id: ScreenId) => void): HTMLElement {
  return el(
    'div',
    { class: 'navbar__inner' },
    ...NAV.map((id) =>
      el('button', {
        class: `navbar__item${id === current ? ' is-active' : ''}`,
        text: vi.nav[id],
        attrs: { type: 'button', ...(id === current ? { 'aria-current': 'page' } : {}) },
        on: { click: () => onGo(id) },
      }),
    ),
  );
}
