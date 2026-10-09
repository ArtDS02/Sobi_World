// The Menu popup of the plaza's top bar: the screens that have no button of their own there.
import { vi } from '../../../../i18n/vi';
import type { PanelId } from '../../../../ui/components/popup';
import { el } from '../../../../ui/dom';

const ENTRIES = ['shop', 'orders', 'collection', 'achievements', 'history', 'settings'] as const;

export function renderMenuScreen(open: (panel: PanelId) => void): HTMLElement {
  return el(
    'section',
    { class: 'menu-screen', data: { screen: 'menu' } },
    ...ENTRIES.map((panel) =>
      el('button', {
        class: 'c-button menu-screen__item',
        text: vi.nav[panel],
        attrs: { type: 'button' },
        on: { click: () => open(panel) },
      }),
    ),
  );
}
