// Farm screen, DOM-only stand-in for the Phaser farm (§10.1): pig cards + selected pig panel.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { renderPigPanel } from '../components/pigPanel';
import { el } from '../dom';
import { pigCardVm } from '../viewModel';

export function renderFarmScreen(
  save: SaveGame,
  now: number,
  selectedId: string | null,
  onSelect: (pigId: string) => void,
): HTMLElement {
  const pigs = [...save.pigs].sort((a, b) => a.slotIndex - b.slotIndex);
  const selected = pigs.find((p) => p.id === selectedId) ?? null;

  const list = pigs.length
    ? el(
        'ul',
        { class: 'farm__list' },
        ...pigs.map((pig) => {
          const vm = pigCardVm(pig);
          const state = [
            vm.id === selectedId ? 'is-selected' : '',
            vm.isSick ? 'is-sick' : '',
          ].join(' ');
          return el(
            'li',
            {},
            el(
              'button',
              {
                class: `farm__card ${state}`.trim(),
                attrs: { type: 'button', 'aria-pressed': String(vm.id === selectedId) },
                on: { click: () => onSelect(vm.id) },
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
    list,
    selected
      ? renderPigPanel(selected, now)
      : pigs.length
        ? el('p', { class: 'c-empty', text: vi.ui.selectPig })
        : null,
  );
}
