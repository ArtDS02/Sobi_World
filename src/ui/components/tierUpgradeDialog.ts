// The upgrade dialog of a cloud tier / garden zone (decision 056), shared by the Cloud and the Garden: "before / after" ranks,
// the cost laid out as have / need with where to find each item, and one button that says why it is off. Plain DOM from a
// TierUpgradeVm; the Area runs the purchase.
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { RankVm, TierUpgradeVm } from '../world/tierUpgradeVm';

const rankCard = (title: string, rank: RankVm | null): HTMLElement =>
  el(
    'div',
    { class: `tier-dialog__rank${rank ? '' : ' is-empty'}` },
    el('small', { text: title }),
    rank
      ? el('b', { text: t(vi.plotTier.rankName, { rank: rank.rank, name: rank.name }) })
      : el('b', { text: vi.plotTier.maxed }),
    rank ? el('span', { text: rank.bonus > 0 ? t(vi.plotTier.bonus, { bonus: rank.bonus }) : vi.plotTier.noBonus }) : null,
  );

/** The body of the dialog; `onBuy` runs when the (enabled) button is clicked. */
export function tierUpgradeBody(vm: TierUpgradeVm, onBuy: () => void): HTMLElement {
  const off = vm.button.reason !== null;
  return el(
    'div',
    { class: 'tier-dialog' },
    el('p', { class: 'c-dialog__strong', text: vm.groupName }),
    el('div', { class: 'tier-dialog__ranks' }, rankCard(vi.plotTier.before, vm.now), el('span', { class: 'tier-dialog__arrow', text: '→', attrs: { 'aria-hidden': 'true' } }), rankCard(vi.plotTier.after, vm.after)),
    vm.rows.length > 0
      ? el(
          'ul',
          { class: 'tier-dialog__cost' },
          ...vm.rows.map((r) =>
            el(
              'li',
              { class: r.ok ? 'is-ok' : 'is-short' },
              el('span', { class: 'tier-dialog__mark', text: r.ok ? '✓' : '✗', attrs: { 'aria-hidden': 'true' } }),
              el('span', { class: 'tier-dialog__label', text: r.label }),
              el('span', { class: 'tier-dialog__count', text: `${formatInt(r.have)} / ${formatInt(r.need)}` }),
              !r.ok && r.source ? el('small', { class: 'tier-dialog__source', text: r.source }) : null,
            ),
          ),
        )
      : null,
    vm.xp > 0 ? el('p', { class: 'c-dialog__hint', text: t(vi.plotTier.xp, { xp: vm.xp }) }) : null,
    el(
      'span',
      { class: 'c-action' },
      el('button', {
        class: 'c-button',
        text: vm.button.label,
        attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}) },
        on: { click: () => !off && onBuy() },
      }),
      off ? el('span', { class: 'c-action__reason', text: vm.button.reason ?? '' }) : null,
    ),
  );
}
