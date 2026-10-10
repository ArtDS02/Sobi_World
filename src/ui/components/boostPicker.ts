// The row of chips in a breeding dialog that lets the player add one rare flower (an item with a `mutationBoost`) to raise
// the mutation chance (GĐ9). Shared by the Farm's and the Aquarium's dialogs; hidden while the bag has no such item.
import { ITEMS, MUTATION_BOOST_IDS } from '../../core/config/items';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface BoostOption {
  itemId: string;
  name: string;
  have: number;
  percent: number;
}

/** The boosting items the bag holds, strongest first. */
export const boostOptions = (items: Readonly<Record<string, number | undefined>>): BoostOption[] =>
  MUTATION_BOOST_IDS.filter((id) => (items[id] ?? 0) > 0).map((id) => ({ itemId: id, name: vi.shop[id], have: items[id] ?? 0, percent: ITEMS[id].mutationBoost ?? 0 }));

/** null when there is nothing to choose from; `selected` undefined = no flower. */
export function boostPicker(options: readonly BoostOption[], selected: string | undefined, onSelect: (itemId: string | undefined) => void): HTMLElement | null {
  if (options.length === 0) return null;
  const chip = (label: string, active: boolean, value: string | undefined) =>
    el('button', {
      class: `c-chip${active ? ' is-active' : ''}`,
      text: label,
      attrs: { type: 'button', role: 'radio', 'aria-checked': String(active) },
      on: { click: () => onSelect(value) },
    });
  return el(
    'div',
    { class: 'c-boost', attrs: { role: 'radiogroup', 'aria-label': vi.breed.boostTitle } },
    el('p', { class: 'c-dialog__hint', text: vi.breed.boostTitle }),
    el(
      'div',
      { class: 'c-boost__chips' },
      chip(vi.breed.boostNone, selected === undefined, undefined),
      ...options.map((o) => chip(t(vi.breed.boostChip, { name: o.name, percent: o.percent, count: o.have }), selected === o.itemId, o.itemId)),
    ),
  );
}
