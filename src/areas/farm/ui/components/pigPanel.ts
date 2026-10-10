// Selected pig panel (spec §10.2): portrait column (art, name → rename, breed / gender / stage
// chips) beside the care column (stat bars, happiness → price multiplier, actions with reasons).
import { penMood } from '../../logic/decor';
import { BREEDS } from '../../logic/config/breeds';
import type { UiIcon } from '../../../../core/config/assetIds';
import { happiness } from '../../logic/happiness';
import type { Pig, FarmGame } from '../../logic/types';
import { vi } from '../../../../i18n/vi';
import type { BoundAction } from '../../store';
import { pigActions, type ActionVm } from '../actionsVm';
import { bondVm } from '../bondVm';
import { breedingVm } from '../breedVm';
import { el } from '../../../../ui/dom';
import { pigPanelVm } from '../viewModel';
import { actionButton } from './actionButton';
import { art, icon } from '../../../../ui/components/icon';
import { rarityBadge } from '../../../../ui/components/rarityBadge';

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
  save: FarmGame,
  pig: Pig,
  now: number,
  on: PigPanelHandlers,
): HTMLElement {
  const bonus = penMood(save);
  const vm = pigPanelVm(pig, now, bonus);
  const actions = pigActions(save, pig.id, now);
  const breeding = breedingVm(save, pig, now);
  const bond = bondVm(save, pig, now, bonus);
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
      vm.warning ? el('p', { class: 'pig-panel__warning', text: vm.warning, attrs: { role: 'alert' } }) : null,
      stat(vi.stat.growth, vm.growth, 'growth', pig.growthProgress),
      stat(vi.stat.hunger, vm.hunger, 'hunger', pig.hunger),
      stat(vi.stat.cleanliness, vm.cleanliness, 'cleanliness', pig.cleanliness),
      stat(vi.stat.health, vm.health, 'health', null, pig.isSick ? 'is-sick' : 'is-ok'),
      // The line that makes care legible: happiness and the resulting price multiplier.
      stat(
        vi.stat.happiness,
        `${vm.happiness} · ${vm.quality}`,
        'happiness',
        happiness(pig, bonus),
        'is-key',
      ),
      // Bond: hearts, the favourite food and the quality tier it lifts.
      el(
        'div',
        { class: 'pig-panel__bond', attrs: { title: bond.favorite } },
        el('span', { class: 'pig-panel__label', text: vi.bond.title }),
        el('span', { class: 'pig-panel__hearts', text: bond.heartsText, attrs: { 'aria-label': bond.summary } }),
        el('span', { class: 'pig-panel__fav', text: bond.favorite }),
        bond.qualityLift ? el('span', { class: 'pig-panel__lift', text: bond.qualityLift }) : null,
      ),
      // What the pig is raised for: a choice from Adult on.
      el(
        'div',
        { class: 'pig-panel__purpose', attrs: { role: 'group', 'aria-label': vi.purpose.title } },
        el('span', { class: 'pig-panel__label', text: vi.purpose.title }),
        ...bond.purposes.map((p) =>
          el('button', {
            class: `pig-panel__pill${p.active ? ' is-active' : ''}`,
            text: p.label,
            attrs: { type: 'button', title: p.reason ?? p.title, 'aria-pressed': String(p.active), ...(p.reason !== null ? { disabled: '' } : {}) },
            on: { click: () => on.act(p.run) },
          }),
        ),
      ),
      el(
        'div',
        { class: 'pig-panel__actions' },
        actionButton(actions.pet, () => on.act(actions.pet.run), '', 'happiness'),
        actionButton(actions.feed, () => on.act(actions.feed.run), '', 'feed'),
        actions.feedFavorite ? actionButton(actions.feedFavorite, () => on.act(actions.feedFavorite!.run), '', 'feed') : null,
        actions.feedPremium ? actionButton(actions.feedPremium, () => on.act(actions.feedPremium!.run), '', 'feed') : null,
        actions.feedGrass ? actionButton(actions.feedGrass, () => on.act(actions.feedGrass!.run), '', 'feed') : null,
        actionButton(actions.clean, () => on.act(actions.clean.run), '', 'clean'),
        actionButton(actions.treat, () => on.act(actions.treat.run), '', 'treat'),
        actionButton(breeding.button, () => on.breed(pig), '', 'breed'),
        actionButton(actions.sell, () => on.sell(pig, actions.sell), 'c-button--warn', 'gold'),
      ),
    ),
  );
}
