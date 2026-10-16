// "Trong lúc bạn vắng mặt" modal (spec §5, §9.5): how long the player was away, the trough line, then one card per place
// (the farm, the plaza's board, each Area) with what happened and what needs care, the places that need care first
// (decision 035). Each card has its picture, its lines (a coloured dot by tone) and one button to the place.
import type { AwayLine, AwayVm } from '../awayVm';
import type { FarmGoto } from '../../logic/summary';
import { el } from '../../../../ui/dom';
import { vi } from '../../../../i18n/vi';
import { openDialog } from '../../../../ui/components/dialog';
import { art } from '../../../../ui/components/icon';

type Place = keyof typeof vi.away.groups;

const PLACE_OF: Record<FarmGoto['target'], Place> = {
  pig: 'farm',
  well: 'farm',
  trough: 'farm',
  orders: 'plaza',
  garden: 'garden',
  aquarium: 'aquarium',
  cloud: 'cloud',
  adventure: 'adventure',
};
const PLACE_ART: Record<Place, string | null> = {
  farm: 'ui_area_farm',
  plaza: null,
  garden: 'ui_area_garden',
  aquarium: 'ui_area_aquarium',
  cloud: 'ui_area_cloud',
  adventure: 'ui_area_adventure',
};
const TONE_RANK = { alert: 0, warn: 1, info: 2 } as const;

/** The lines grouped by place, the most urgent place first, the most urgent line first inside it. */
export function groupAwayLines(lines: readonly AwayLine[]): { place: Place; lines: AwayLine[]; tone: AwayLine['tone'] }[] {
  const groups = new Map<Place, AwayLine[]>();
  for (const l of lines) {
    const place = l.action ? PLACE_OF[l.action.goto.target] : 'farm';
    groups.set(place, [...(groups.get(place) ?? []), l]);
  }
  return [...groups]
    .map(([place, ls]) => {
      const sorted = [...ls].sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]);
      return { place, lines: sorted, tone: sorted[0]!.tone };
    })
    .sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]);
}

export function openAwayDialog(host: HTMLElement, vm: AwayVm, go: (goto: FarmGoto) => void) {
  const d = openDialog(host, vm.title, vi.away.ok);
  d.body.closest('.c-dialog__panel')?.classList.add('c-dialog__panel--away');
  const button = (label: string, goto: FarmGoto) =>
    el('button', {
      class: 'c-button c-away__go',
      text: label,
      attrs: { type: 'button' },
      on: {
        click: () => {
          d.close();
          go(goto);
        },
      },
    });
  const card = (g: ReturnType<typeof groupAwayLines>[number]) => {
    // One button per place: the first line that leads somewhere.
    const lead = g.lines.find((l) => l.action)?.action;
    const pic = PLACE_ART[g.place];
    return el(
      'section',
      { class: `c-away__card is-${g.tone}` },
      el(
        'header',
        { class: 'c-away__head' },
        pic ? art(pic, 'c-away__pic') : el('span', { class: 'c-away__pic is-emoji', text: '📋' }),
        el('b', { text: vi.away.groups[g.place] }),
        el('small', { class: 'c-away__state', text: g.tone === 'info' ? vi.away.calm : vi.away.urgent }),
        lead ? button(lead.label, lead.goto) : null,
      ),
      el('ul', { class: 'c-away__list' }, ...g.lines.map((line) => el('li', { class: `c-away__line is-${line.tone}` }, line.text))),
    );
  };
  d.body.append(
    el('p', { class: 'c-away__duration', text: vm.duration }),
    el(
      'p',
      { class: `c-away__trough${vm.troughRanOut ? ' is-alert' : ''}` },
      el('span', { text: vm.trough }),
      vm.troughAction ? button(vm.troughAction.label, vm.troughAction.goto) : '',
    ),
    el('div', { class: 'c-away__cards' }, ...groupAwayLines(vm.lines).map(card)),
  );
  return d;
}
