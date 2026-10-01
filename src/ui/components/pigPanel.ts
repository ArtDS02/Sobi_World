// Selected pig panel (spec §10.2) — display only for now; action buttons come in S08B.
import type { Pig } from '../../core/types';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { pigPanelVm } from '../viewModel';

const row = (label: string, value: string) =>
  el(
    'div',
    { class: 'pig-panel__row' },
    el('span', { class: 'pig-panel__label', text: label }),
    el('span', { class: 'pig-panel__value', text: value }),
  );

export function renderPigPanel(pig: Pig, now: number): HTMLElement {
  const vm = pigPanelVm(pig, now);
  return el(
    'section',
    { class: 'pig-panel', attrs: { 'aria-live': 'polite' } },
    el('h2', { class: 'pig-panel__name', text: vm.name }),
    el(
      'div',
      { class: 'pig-panel__meta' },
      row(vi.ui.breed, vm.breed),
      row(vi.ui.gender, vm.gender),
    ),
    el(
      'div',
      { class: 'pig-panel__growth' },
      row(vi.stat.growth, `${vm.growth} · ${vm.stage}`),
      el(
        'div',
        { class: 'c-bar', attrs: { role: 'progressbar', 'aria-valuenow': String(vm.growthValue) } },
        el('span', { class: 'c-bar__fill', attrs: { style: `width: ${vm.growthValue}%` } }),
      ),
    ),
    row(vi.stat.weight, vm.weight),
    row(vi.stat.hunger, vm.hunger),
    row(vi.stat.cleanliness, vm.cleanliness),
    row(vi.stat.health, vm.health),
    row(vi.stat.happiness, `${vm.happiness} → ${vm.priceMultiplier}`),
    vm.pregnancy ? row(vi.stat.pregnant, vm.pregnancy) : null,
  );
}
