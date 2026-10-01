// Screens not built yet show vi.ui.comingSoon.
import { vi } from '../../i18n/vi';
import type { ScreenId } from '../components/navBar';
import { el } from '../dom';

export function renderPlaceholderScreen(id: ScreenId): HTMLElement {
  return el(
    'div',
    { class: 'c-placeholder', data: { screen: id } },
    el('h2', { class: 'c-placeholder__title', text: vi.nav[id] }),
    el('p', { class: 'c-empty', text: vi.ui.comingSoon }),
  );
}
