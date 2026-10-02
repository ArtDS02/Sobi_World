// Selected pig panel (spec §10.2): portrait column (art, name → rename, breed / gender / stage
// chips) beside the care column (stat bars, happiness → price multiplier, actions with reasons).
import { decorBonus } from '../../core/engine/decor';
import { BREEDS } from '../../core/config/breeds';
import type { UiIcon } from '../../core/config/assetIds';
import { happiness } from '../../core/engine/happiness';
import type { Pig, SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { BoundAction } from '../../store/gameStore';
import { pigActions, type ActionVm } from '../actionsVm';
import { breedingVm } from '../breedVm';
import { el } from '../dom';
import { pigPanelVm } from '../viewModel';
import { actionButton } from './actionButton';
import { art, icon } from './icon';
import { rarityBadge } from './rarityBadge';

export interface PigPanelHandlers {
  act: (run: BoundAction) => void;
  sell: (pig: Pig, vm: ActionVm) => void;
  rename: (pig: Pig) => void;
  breed: (pig: Pig) => void;
}

/** One stat line: icon + label + value, with a 0-100 bar when the stat is a gauge. */
const stat = (label: string, value: string, iconName: UiIcon, bar: number | null, tone = '') =>
  el(
    'div',
    { class: `pig-panel__stat ${tone}`.trim() },
    el('span', { class: 'pig-panel__label' }, icon(iconName), label),
    el('span', { class: 'pig-panel__value', text: value }),
    bar === null
      ? null
      : el(
          'span',
          {
            class: 'c-bar pig-panel__bar',
            attrs: { role: 'progressbar', 'aria-valuenow': String(Math.round(bar)) },
          },
          el('span', {
            class: `c-bar__fill${bar < 30 ? ' is-low' : ''}`,
            attrs: { style: `width: ${Math.round(bar)}%` },
          }),
        ),
  );

const chip = (text: string, cls = '') => el('span', { class: `pig-panel__chip ${cls}`.trim(), text });

export function renderPigPanel(
  save: SaveGame,
  pig: Pig,
  now: number,
  on: PigPanelHandlers,
): HTMLElement {
  const bonus = decorBonus(save);
  const vm = pigPanelVm(pig, now, bonus);
  const actions = pigActions(save, pig.id, now);
  const breeding = breedingVm(save, pig, now);
  const def = BREEDS[pig.breed];
  return el(
    'section',
    { class: 'pig-panel' },
    el(
      'div',
      { class: 'pig-panel__portrait' },
      el(
        'div',
        { class: `pig-panel__stage${pig.isSick ? ' is-sick' : ''}` },
        art(def.artId, 'pig-panel__art', vm.name),
      ),
      el(
        'button',
        {
          class: 'pig-panel__name',
          attrs: { type: 'button', title: vi.action.rename },
          on: { click: () => on.rename(pig) },
        },
        vm.name,
        el('span', { class: 'pig-panel__pen', text: '✎', attrs: { 'aria-hidden': 'true' } }),
      ),
      el(
        'div',
        { class: 'pig-panel__chips' },
        rarityBadge(def.rarity),
        chip(vm.breed),
        chip(`${pig.gender === 'MALE' ? '♂' : '♀'} ${vm.gender}`, `is-${pig.gender.toLowerCase()}`),
        chip(vm.stage),
        chip(vm.weight),
        chip(vm.generation),
        vm.parents ? chip(vm.parents) : null,
      ),
      vm.pregnancy ? chip(`${vi.stat.pregnant} · ${vm.pregnancy}`, 'is-pregnant') : null,
    ),
    el(
      'div',
      { class: 'pig-panel__care' },
      stat(vi.stat.growth, vm.growth, 'growth', pig.growthProgress),
      stat(vi.stat.hunger, vm.hunger, 'hunger', pig.hunger),
      stat(vi.stat.cleanliness, vm.cleanliness, 'cleanliness', pig.cleanliness),
      stat(vi.stat.health, vm.health, 'health', null, pig.isSick ? 'is-sick' : 'is-ok'),
      // The line that makes care legible: happiness and the resulting price multiplier.
      stat(
        vi.stat.happiness,
        `${vm.happiness} → ${vm.priceMultiplier}`,
        'happiness',
        happiness(pig, bonus),
        'is-key',
      ),
      el(
        'div',
        { class: 'pig-panel__actions' },
        actionButton(actions.feed, () => on.act(actions.feed.run), '', 'feed'),
        actionButton(actions.clean, () => on.act(actions.clean.run), '', 'clean'),
        actionButton(actions.treat, () => on.act(actions.treat.run), '', 'treat'),
        actionButton(breeding.button, () => on.breed(pig), '', 'breed'),
        actionButton(actions.sell, () => on.sell(pig, actions.sell), 'c-button--warn', 'gold'),
      ),
    ),
  );
}
