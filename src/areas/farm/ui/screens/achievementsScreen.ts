// Achievements panel (spec §20.4, DECISIONS PG-2): the daily reward strip on top, then every
// achievement with a progress bar and a claim button.
import type { SaveGame } from '../../../../core/types';
import { vi } from '../../../../i18n/vi';
import type { BoundAction } from '../../../../core/world/gameStore';
import { el } from '../../../../ui/dom';
import { achievementsVm, dailyVm } from '../progressVm';

const button = (text: string, onClick: () => void, variant = '') =>
  el('button', {
    class: `c-button ${variant}`.trim(),
    text,
    attrs: { type: 'button' },
    on: { click: onClick },
  });

function dailySection(save: SaveGame, now: number, act: (run: BoundAction) => void) {
  const vm = dailyVm(save, now);
  return el(
    'section',
    { class: 'achievements__daily' },
    el(
      'h3',
      { class: 'achievements__heading' },
      el('span', { text: vi.daily.title }),
      el('span', { class: 'achievements__sub', text: vm.streak }),
    ),
    el(
      'ol',
      { class: 'achievements__days' },
      ...vm.days.map((d) =>
        el(
          'li',
          { class: `achievements__day is-${d.state}` },
          el('b', { text: d.label }),
          el('span', { text: d.reward }),
        ),
      ),
    ),
    vm.claim
      ? button(vi.daily.claim, () => act(vm.claim!), 'achievements__claim-daily')
      : el('p', { class: 'achievements__hint', text: vi.daily.claimed }),
    el('p', { class: 'achievements__hint', text: vi.daily.hint }),
  );
}

export function renderAchievementsScreen(
  save: SaveGame,
  now: number,
  act: (run: BoundAction) => void,
): HTMLElement {
  const vm = achievementsVm(save);
  return el(
    'section',
    { class: 'achievements', data: { screen: 'achievements' } },
    dailySection(save, now, act),
    el(
      'h3',
      { class: 'achievements__heading' },
      el('span', { text: vi.achievements.title }),
      el('span', { class: 'achievements__sub', text: vm.summary }),
    ),
    el(
      'ul',
      { class: 'achievements__list' },
      ...vm.items.map((a) =>
        el(
          'li',
          { class: `achievements__item is-${a.status}`, data: { achievement: a.id } },
          el(
            'div',
            { class: 'achievements__info' },
            el('p', { class: 'achievements__name', text: a.name }),
            el(
              'span',
              {
                class: 'c-bar achievements__bar',
                attrs: { role: 'progressbar', 'aria-valuenow': String(a.percent) },
              },
              el('span', { class: 'c-bar__fill', attrs: { style: `width: ${a.percent}%` } }),
            ),
            el('p', { class: 'achievements__meta', text: `${a.progress} · ${a.reward}` }),
          ),
          a.status === 'claimable'
            ? button(vi.achievements.claim, () => act(a.claim))
            : el('span', {
                class: 'achievements__state',
                text: a.status === 'claimed' ? vi.achievements.claimed : '',
              }),
        ),
      ),
    ),
  );
}
