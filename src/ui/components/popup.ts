// Popup window over the farm canvas (DECISIONS R05C-1): one at a time, closed by ✕, Esc or a click
// on the backdrop. The shell is stable per panel; only the body is re-rendered, so scroll survives.
import { vi } from '../../i18n/vi';
import { el } from '../dom';

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
      el('button', {
        class: 'c-button c-button--icon c-window__close',
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
