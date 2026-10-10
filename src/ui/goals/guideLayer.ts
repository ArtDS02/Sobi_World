// The guide layer over the world (spec V2 §9, §13): the "next step" chip that always says what to do next, and the
// button of the Area's guide NPC with its dialog. DOM only; what to say comes from nextStep.ts and content/shared/npcs.json.
import type { Suggestion } from '../../core/area-registry/registry';
import { npcOf } from '../../core/config/goals';
import type { Goals } from '../../core/goals/api';
import type { WorldSave } from '../../core/save/world';
import { vi } from '../../i18n/vi';
import { openDialog } from '../components/dialog';
import { art } from '../components/icon';
import { el, patch } from '../dom';
import { localDay, localOffsetMs } from '../localDay';
import { nextStepVm, type NextGoto, type NextStepVm } from './nextStep';

export type GuidePlace = 'plaza' | 'area' | 'garden' | 'aquarium' | 'cloud' | 'adventure';

/** The Area whose guide shows in each place (the plaza has none). */
const AREA_OF: Record<GuidePlace, string | null> = { plaza: null, area: 'sobi_farm', garden: 'sobi_garden', aquarium: 'sobi_aquarium', cloud: 'sobi_cloud', adventure: 'sobi_adventure' };

export interface GuideDeps {
  now: () => number;
  world: () => WorldSave | null;
  goals: Goals;
  suggest: (now: number, dayOffsetMs: number) => Suggestion[];
  nextLocked: () => { name: string; level: number } | null;
  place: () => GuidePlace;
  dialogs: HTMLElement;
  /** A modal popup or dialog covers the world: the layer steps aside. */
  covered: () => boolean;
  /** Follows a chip's button (the shell knows its panels, its pigs, its places). */
  go: (to: NextGoto) => void;
}

export function createGuideLayer(d: GuideDeps) {
  const chip = el('div', { class: 'guide__chip-host' });
  const npcHost = el('div', { class: 'guide__npc-host' });
  const host = el('div', { class: 'guide' }, chip, npcHost);
  let dismissed: string | null = null;

  const current = (): NextStepVm | null => {
    const world = d.world();
    if (!world) return null;
    const now = d.now();
    return nextStepVm({ world, goals: d.goals, area: d.suggest(now, localOffsetMs(now)), place: d.place(), day: localDay(now), next: d.nextLocked() });
  };

  function chipView(vm: NextStepVm): HTMLElement {
    return el(
      'div',
      { class: `next-step is-${vm.tone}`, attrs: { role: 'status' } },
      el('span', { class: 'next-step__text', text: vm.text }),
      vm.more > 0 ? el('span', { class: 'next-step__more', text: vi.suggest.others.replace('{count}', String(vm.more)) }) : null,
      vm.goto ? el('button', { class: 'c-button next-step__go', text: vi.suggest.go, attrs: { type: 'button' }, on: { click: () => d.go(vm.goto!) } }) : null,
      el('button', { class: 'next-step__hide', text: '✕', attrs: { type: 'button', 'aria-label': vi.suggest.hide, title: vi.suggest.hide }, on: { click: () => { dismissed = vm.id; sync(); } } }),
    );
  }

  function openNpc(areaId: string) {
    const npc = npcOf(areaId);
    if (!npc) return;
    const dialog = openDialog(d.dialogs, npc.nameVi, vi.action.close);
    const vm = current();
    const answer = el('p', { class: 'npc__answer', text: npc.greetingVi });
    dialog.body.append(
      el('div', { class: 'npc' },
        el('div', { class: 'npc__head' }, art(npc.artId, 'npc__art', npc.nameVi), answer),
        vm ? el('p', { class: 'npc__next', text: vm.text }) : null,
        el('div', { class: 'npc__topics' }, ...npc.topics.map((topic) =>
          el('button', { class: 'c-button c-button--ghost npc__topic', text: topic.titleVi, attrs: { type: 'button' }, on: { click: () => { answer.textContent = topic.textVi; } } }),
        )),
      ),
    );
  }

  function sync() {
    const place = d.place();
    const vm = d.covered() ? null : current();
    patch(chip, vm && vm.id !== dismissed ? chipView(vm) : null);
    const area = AREA_OF[place];
    const npc = area && !d.covered() ? npcOf(area) : undefined;
    patch(npcHost, npc ? el('button', { class: 'npc-button', attrs: { type: 'button', title: npc.nameVi, 'aria-label': npc.nameVi }, on: { click: () => openNpc(npc.area) } }, art(npc.artId, 'npc-button__art', npc.nameVi), el('span', { class: 'npc-button__name', text: npc.nameVi })) : null);
  }

  return { host, sync };
}

