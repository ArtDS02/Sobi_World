// The guide layer over the world (spec V2 §9, §13): the notice bell (decision 034) — its badge counts what waits to be
// done, a click opens the list of every notice, each with its "Đi" — and the button of the Area's guide NPC with its
// dialog. DOM only; what to say comes from nextStep.ts and content/shared/npcs.json.
import type { Suggestion } from '../../core/area-registry/registry';
import { npcOf } from '../../core/config/goals';
import type { Goals } from '../../core/goals/api';
import type { WorldSave } from '../../core/save/world';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { openDialog } from '../components/dialog';
import { art } from '../components/icon';
import { el, patch } from '../dom';
import { localDay, localOffsetMs } from '../localDay';
import { nextStepVm, noticesVm, type NextGoto, type NextStepInput, type NoticeVm } from './nextStep';

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
  const bellHost = el('div', { class: 'guide__bell-host' });
  const npcHost = el('div', { class: 'guide__npc-host' });
  const host = el('div', { class: 'guide' }, bellHost, npcHost);
  let open = false;

  const input = (): NextStepInput | null => {
    const world = d.world();
    if (!world) return null;
    const now = d.now();
    return { world, goals: d.goals, area: d.suggest(now, localOffsetMs(now)), place: d.place(), day: localDay(now), next: d.nextLocked() };
  };
  const current = () => {
    const i = input();
    return i ? nextStepVm(i) : null;
  };

  const toggle = (next: boolean) => {
    open = next;
    sync();
  };
  // A click anywhere else closes the list (the bell's own clicks stop here).
  const outside = (e: Event) => {
    if (open && e.target instanceof Node && !bellHost.contains(e.target)) toggle(false);
  };
  document.addEventListener('pointerdown', outside, true);

  function noticeRow(n: NoticeVm): HTMLElement {
    return el(
      'li',
      { class: `notice is-${n.tone}${n.task ? '' : ' is-hint'}` },
      el('span', { class: 'notice__text', text: n.text }),
      n.goto
        ? el('button', { class: 'c-button notice__go', text: vi.suggest.go, attrs: { type: 'button' }, on: { click: () => { toggle(false); d.go(n.goto!); } } })
        : null,
    );
  }

  function bellView(list: NoticeVm[]): HTMLElement {
    const tasks = list.filter((n) => n.task);
    const tone = tasks.some((n) => n.tone === 'alert') ? 'alert' : tasks.some((n) => n.tone === 'warn') ? 'warn' : 'info';
    const label = tasks.length > 0 ? t(vi.suggest.bellCount, { count: tasks.length }) : vi.suggest.bell;
    return el(
      'div',
      { class: 'notices' },
      el(
        'button',
        {
          class: `notices__bell is-${tone}${tasks.length > 0 ? ' has-tasks' : ''}${open ? ' is-open' : ''}`,
          attrs: { type: 'button', title: label, 'aria-label': label, 'aria-expanded': String(open), 'aria-haspopup': 'true' },
          on: { click: () => toggle(!open) },
        },
        bellIcon(),
        tasks.length > 0 ? el('span', { class: 'notices__badge', text: tasks.length > 9 ? '9+' : String(tasks.length) }) : null,
      ),
      open
        ? el(
            'div',
            { class: 'notices__panel', attrs: { role: 'dialog', 'aria-label': vi.suggest.bell } },
            el('p', { class: 'notices__title', text: vi.suggest.bell }),
            el('ul', { class: 'notices__list' }, ...list.map(noticeRow)),
          )
        : null,
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
    const i = d.covered() ? null : input();
    if (!i) open = false;
    patch(bellHost, i ? bellView(noticesVm(i)) : null);
    const area = AREA_OF[place];
    const npc = area && !d.covered() ? npcOf(area) : undefined;
    patch(npcHost, npc ? el('button', { class: 'npc-button', attrs: { type: 'button', title: npc.nameVi, 'aria-label': npc.nameVi }, on: { click: () => openNpc(npc.area) } }, art(npc.artId, 'npc-button__art', npc.nameVi), el('span', { class: 'npc-button__name', text: npc.nameVi })) : null);
  }

  return { host, sync, dispose: () => document.removeEventListener('pointerdown', outside, true) };
}

const SVG = 'http://www.w3.org/2000/svg';

/** A bell drawn in line (no painted icon yet, docs/ASSET_TODO.md): body, rim and clapper in the button's colour. */
function bellIcon(): SVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'notices__icon');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6z', 'M9.5 18.5a2.5 2.5 0 0 0 5 0']) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
