// Startup error screen: content or manifest validation failed (a development bug). Plain DOM, no game
// module, so it still renders when the content itself is what is broken.
import { vi } from '../i18n/vi';
import { el } from './dom';

export function renderStartupError(error: unknown): HTMLElement {
  const detail = error instanceof Error ? error.message : String(error);
  return el(
    'div',
    { class: 'c-status', attrs: { role: 'alert' } },
    el('h2', { class: 'c-status__title', text: vi.app.startupError }),
    el('pre', { class: 'c-status__detail', text: detail }),
  );
}
