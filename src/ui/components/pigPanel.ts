// Selected pig panel (spec §10.2): stats, happiness → price multiplier, actions with reasons.
import type { Pig, SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { BoundAction } from '../../store/gameStore';
import { pigActions, type ActionVm } from '../actionsVm';
import { el } from '../dom';
import { pigPanelVm } from '../viewModel';
import { actionButton } from './actionButton';

export interface PigPanelHandlers {
  act: (run: BoundAction) => void;
  sell: (pig: Pig, vm: ActionVm) => void;
  rename: (pig: Pig) => void;
}

const row = (label: string, value: string, modifier = '') =>
  el(
    'div',
    { class: `pig-panel__row ${modifier}`.trim() },
    el('span', { class: 'pig-panel__label', text: label }),
    el('span', { class: 'pig-panel__value', text: value }),
  );

export function renderPigPanel(
  save: SaveGame,
  pig: Pig,
  now: number,
  on: PigPanelHandlers,
): HTMLElement {
  const vm = pigPanelVm(pig, now);
  const actions = pigActions(save, pig.id, now);
  return el(
    'section',
    { class: 'pig-panel' },
    el(
      'button',
      {
        class: 'pig-panel__name',
        attrs: { type: 'button', title: vi.action.rename },
        on: { click: () => on.rename(pig) },
      },
      `${vm.name} ✎`,
    ),
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
    row(vi.stat.health, vm.health, pig.isSick ? 'is-sick' : ''),
    // The line that makes care legible: happiness and the resulting price multiplier.
    row(vi.stat.happiness, `${vm.happiness} → ${vm.priceMultiplier}`, 'is-key'),
    vm.pregnancy ? row(vi.stat.pregnant, vm.pregnancy) : null,
    el(
      'div',
      { class: 'pig-panel__actions' },
      actionButton(actions.feed, () => on.act(actions.feed.run)),
      actionButton(actions.clean, () => on.act(actions.clean.run)),
      actionButton(actions.treat, () => on.act(actions.treat.run)),
      actionButton(actions.sell, () => on.sell(pig, actions.sell), 'c-button--warn'),
    ),
  );
}
