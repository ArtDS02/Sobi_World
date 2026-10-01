// Farm screen, DOM-only stand-in for the Phaser farm (§10.1): toolbar, pig cards, pig panel.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { farmActions } from '../actionsVm';
import { actionButton } from '../components/actionButton';
import { renderPigPanel, type PigPanelHandlers } from '../components/pigPanel';
import { el } from '../dom';
import { pigCardVm } from '../viewModel';

export interface FarmHandlers extends PigPanelHandlers {
  select: (pigId: string) => void;
}

function renderToolbar(save: SaveGame, now: number, on: FarmHandlers): HTMLElement {
  const a = farmActions(save, now);
  return el(
    'div',
    { class: 'farm__toolbar' },
    el(
      'div',
      { class: 'farm__buy' },
      el('span', { class: 'farm__buy-title', text: a.buyTitle }),
      actionButton(a.buyMale, () => on.act(a.buyMale.run)),
      actionButton(a.buyFemale, () => on.act(a.buyFemale.run)),
    ),
    save.pigs.length > 0 ? actionButton(a.cleanAll, () => on.act(a.cleanAll.run)) : null,
  );
}

export function renderFarmScreen(
  save: SaveGame,
  now: number,
  selectedId: string | null,
  on: FarmHandlers,
): HTMLElement {
  const pigs = [...save.pigs].sort((a, b) => a.slotIndex - b.slotIndex);
  const selected = pigs.find((p) => p.id === selectedId) ?? null;

  const list = pigs.length
    ? el(
        'ul',
        { class: 'farm__list' },
        ...pigs.map((pig) => {
          const vm = pigCardVm(pig);
          const state = [vm.id === selectedId ? 'is-selected' : '', vm.isSick ? 'is-sick' : ''];
          return el(
            'li',
            {},
            el(
              'button',
              {
                class: `farm__card ${state.join(' ')}`.trim(),
                attrs: { type: 'button', 'aria-pressed': String(vm.id === selectedId) },
                on: { click: () => on.select(vm.id) },
              },
              el('span', { class: 'farm__card-name', text: vm.name }),
              el('span', { class: 'farm__card-sub', text: `${vm.breed} · ${vm.stage}` }),
              el(
                'span',
                { class: 'farm__card-stats' },
                `${vi.stat.growth} ${vm.growth} · ${vi.stat.hunger} ${vm.hunger} · ${vi.stat.cleanliness} ${vm.cleanliness}`,
              ),
              el('span', { class: 'farm__card-health', text: vm.health }),
              vm.isPregnant
                ? el('span', { class: 'farm__card-flag', text: vi.stat.pregnant })
                : null,
            ),
          );
        }),
      )
    : el('p', { class: 'c-empty', text: vi.ui.farmEmpty });

  return el(
    'div',
    { class: 'farm', data: { screen: 'farm' } },
    renderToolbar(save, now, on),
    el(
      'div',
      { class: 'farm__body' },
      list,
      selected
        ? renderPigPanel(save, selected, now, on)
        : pigs.length
          ? el('p', { class: 'c-empty', text: vi.ui.selectPig })
          : null,
    ),
  );
}
