// Popup window over the farm canvas (DECISIONS R05C-1): one at a time, closed by ✕, Esc or a click
// on the backdrop. The shell is stable per panel; only the body is re-rendered, so scroll survives.
import type { UiIcon } from '../../core/config/assetIds';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { icon } from './icon';

/** Everything that opens over the farm; the farm itself is the canvas, never a panel. */
export const PANELS = [
  'shop',
  'inventory',
  'orders',
  'collection',
  'history',
  'settings',
  'pig',
  'well',
] as const;
export type PanelId = (typeof PANELS)[number];

/** Header icon per popup; the pig popup has no header (its own portrait column names it). */
const PANEL_ICON: Record<PanelId, UiIcon | null> = {
  shop: 'shop',
  inventory: 'fillTrough',
  orders: 'orders',
  collection: 'collection',
  history: 'gold',
  settings: null,
  pig: null,
  well: 'cleanAll',
};

export interface PopupShell {
  panel: PanelId;
  root: HTMLElement;
  body: HTMLElement;
}

export function createPopupShell(panel: PanelId, label: string, onClose: () => void): PopupShell {
  const body = el('div', { class: 'c-window__body' });
  const root = el(
    'div',
    {
      class: 'c-window',
      data: { panel },
      on: { click: (e) => e.target === root && onClose() },
    },
    el(
      'div',
      {
        class: 'c-window__panel',
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': label },
      },
      panel === 'pig'
        ? null
        : el(
            'header',
            { class: 'c-window__head' },
            el('span', { class: 'c-window__badge' }, icon(PANEL_ICON[panel] ?? undefined) ?? '⚙'),
            el('h2', { class: 'c-window__title', text: label }),
          ),
      el('button', {
        class: 'c-window__close',
        text: '✕',
        attrs: { type: 'button', 'aria-label': vi.action.close },
        on: { click: onClose },
      }),
      body,
    ),
  );
  return { panel, root, body };
}

/** Plays the closing fade (R12A), then removes the window; at once with reduceMotion. */
export function closePopupShell(shell: PopupShell, reduceMotion: boolean) {
  const { root } = shell;
  if (reduceMotion || !root.isConnected) {
    root.remove();
    return;
  }
  root.classList.add('is-closing');
  root.addEventListener('animationend', () => root.remove(), { once: true });
}
