// Transaction history (DECISIONS Q7): newest first, at most 200, type label + signed gold.
import type { SaveGame } from '../../../../core/types';
import { vi } from '../../../../i18n/vi';
import { el } from '../../../../ui/dom';
import { historyVm } from '../viewModel';

export function renderHistoryScreen(save: SaveGame): HTMLElement {
  const rows = historyVm(save);
  return el(
    'section',
    { class: 'history', data: { screen: 'history' } },
    rows.length === 0
      ? el('p', { class: 'c-empty', text: vi.history.empty })
      : el(
          'ul',
          { class: 'history__list' },
          ...rows.map((r) =>
            el(
              'li',
              { class: 'history__row' },
              el('span', {
                class: `history__sign is-${r.tone}`,
                text: r.tone === 'plus' ? '+' : r.tone === 'minus' ? '−' : '·',
                attrs: { 'aria-hidden': 'true' },
              }),
              el('span', { class: 'history__label', text: r.label }),
              el('span', { class: 'history__at', text: r.at }),
              el('span', {
                class: `history__amount is-${r.tone}`,
                text: r.amount,
              }),
            ),
          ),
        ),
  );
}
