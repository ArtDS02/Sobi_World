// Full-screen states before the farm can be shown: loading, recovery, save too new.
import type { StoreStatus } from '../../store/gameStore';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export function renderStatusScreen(status: Exclude<StoreStatus, 'ready'>): HTMLElement {
  if (status === 'loading') return el('p', { class: 'c-status', text: vi.app.loading });
  if (status === 'tooNew') return el('p', { class: 'c-status', text: vi.error.SAVE_TOO_NEW });
  // Recovery actions (import / start new with confirmation) are wired in S08B.
  return el(
    'div',
    { class: 'c-status' },
    el('h2', { class: 'c-status__title', text: vi.recovery.title }),
    el('p', { text: vi.recovery.body }),
  );
}

/** Banner for a read-only second tab (§9.4). */
export function renderMultiTabBanner(): HTMLElement {
  return el(
    'div',
    { class: 'c-banner', attrs: { role: 'alert' } },
    el('strong', { text: vi.multiTab.title }),
    el('span', { text: vi.multiTab.body }),
    el('button', {
      class: 'c-button',
      text: vi.multiTab.reload,
      attrs: { type: 'button' },
      on: { click: () => globalThis.location.reload() },
    }),
  );
}
