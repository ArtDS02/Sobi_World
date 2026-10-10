// DOM of GĐ7: trait chips, the family-tree dialog and the Breeder's panel. Data: heredityVm.ts; style: features/_heredity.scss.
import { npcAt } from '../../../core/config/goals';
import { vi } from '../../../i18n/vi';
import { openDialog } from '../../../ui/components/dialog';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import type { FarmGame, Pig } from '../logic/types';
import { breederVm, pedigreeVm, type AncestorVm, type PedigreeVm, type TraitChipVm } from './heredityVm';

/** A row of trait chips; the title carries what each trait does. Empty list → a quiet line. */
export function traitChipsEl(chips: readonly TraitChipVm[], emptyText: string | null = vi.heredity.noTraits): HTMLElement | null {
  if (chips.length === 0) return emptyText === null ? null : el('span', { class: 'traits traits--empty', text: emptyText });
  return el(
    'span',
    { class: 'traits' },
    ...chips.map((c) =>
      el('span', {
        class: `traits__chip${c.tier ? ` is-${c.tier.toLowerCase()}` : ''}${c.hidden ? ` is-hidden-${c.hidden}` : ''}`,
        text: `${c.hidden === 'locked' ? '🔒 ' : ''}${c.name}`,
        attrs: { title: [c.desc, c.effects].filter(Boolean).join(' — ') },
      }),
    ),
  );
}

const ancestorCard = (a: AncestorVm): HTMLElement =>
  el(
    'li',
    { class: `pedigree__card is-${a.gender.toLowerCase()}`, data: { ancestor: a.name } },
    el('span', { class: 'pedigree__art' }, art(a.artId, 'pedigree__img', a.breedName) ?? '🐷'),
    el('strong', { class: 'pedigree__name', text: `${a.gender === 'MALE' ? '♂' : '♀'} ${a.name}` }),
    el('span', { class: 'pedigree__breed', text: a.breedName }),
    el('span', { class: 'pedigree__gen', text: a.generation }),
    a.traits.length > 0 ? el('span', { class: 'pedigree__traits', text: a.traits.join(', ') }) : null,
  );

export function pedigreeEl(vm: PedigreeVm): HTMLElement {
  return el(
    'div',
    { class: 'pedigree', data: { screen: 'pedigree' } },
    el('ul', { class: 'pedigree__level pedigree__level--self' }, ancestorCard(vm.self)),
    vm.empty ? el('p', { class: 'pedigree__empty', text: vm.empty }) : null,
    ...vm.levels.flatMap((l) => [
      el('h4', { class: 'pedigree__title', text: l.title }),
      el('ul', { class: 'pedigree__level' }, ...l.ancestors.map(ancestorCard)),
    ]),
  );
}

/** The family tree of a pig in a dialog. */
export function openPedigreeDialog(host: HTMLElement, pig: Pig): void {
  const vm = pedigreeVm(pig);
  const d = openDialog(host, vm.title, vi.action.close);
  d.body.append(pedigreeEl(vm));
}

/** The Breeder's panel: who she is, today's rumours and what she can explain. */
export function renderBreederPanel(save: FarmGame, now: number, dayOffsetMs: number): HTMLElement {
  const npc = npcAt('breeding');
  const vm = breederVm(save, now, dayOffsetMs);
  const answer = el('p', { class: 'npc__answer', text: npc?.greetingVi ?? '' });
  return el(
    'section',
    { class: 'breeder', data: { screen: 'breeder' } },
    el(
      'div',
      { class: 'npc' },
      el('div', { class: 'npc__head' }, npc ? art(npc.artId, 'npc__art', npc.nameVi) : null, answer),
      el('h4', { class: 'breeder__heading', text: vi.breeder.today }),
      el('ul', { class: 'breeder__rumors' }, ...vm.rumors.map((r) => el('li', { class: `breeder__rumor is-${r.kind}`, text: r.text }))),
      npc && npc.topics.length > 0
        ? el(
            'div',
            { class: 'npc__topics' },
            ...npc.topics.map((topic) =>
              el('button', {
                class: 'c-button c-button--ghost npc__topic',
                text: topic.titleVi,
                attrs: { type: 'button' },
                on: { click: () => { answer.textContent = topic.textVi; } },
              }),
            ),
          )
        : null,
    ),
  );
}
