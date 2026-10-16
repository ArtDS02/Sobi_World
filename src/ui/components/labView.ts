// The crossing lab screen (decision 035), shared by the Garden and the Cloud: the bench (two parent slots → the result
// with its chance), a picker for the slot being filled, the cross button that says why it is off, the crossing book
// (tap a recipe to set its parents) and a short reveal card after each try. Plain DOM from labVm.ts; the Area keeps
// the chosen pair and runs the action.
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { art } from './icon';
import { labVm, type LabInput, type LabResultVm, type LabSlotVm, type LabVm } from './labVm';

export interface LabReveal {
  success: boolean;
  firstTime: boolean;
  /** What landed in the bag ("3 Hạt bí ngô"), or null. */
  got: string | null;
  name: string;
  art: string;
}

export interface LabHandlers {
  /** Which slot the picker fills, or null when it is closed. */
  picking: 0 | 1 | null;
  reveal: LabReveal | null;
  busy: boolean;
  onSlot: (slot: 0 | 1) => void;
  onPick: (id: string) => void;
  onRecipe: (a: string, b: string) => void;
  onCross: () => void;
  onDismissReveal: () => void;
}

const pic = (id: string, cls: string) => art(id, cls) ?? el('span', { class: `${cls} is-missing`, text: '🌱' });

function slotButton(s: LabSlotVm | null, index: 0 | 1, h: LabHandlers): HTMLElement {
  const label = index === 0 ? vi.lab.slotA : vi.lab.slotB;
  return el(
    'button',
    {
      class: `c-lab__slot${s ? '' : ' is-empty'}${h.picking === index ? ' is-picking' : ''}${s && !s.enough ? ' is-short' : ''}`,
      attrs: { type: 'button', 'aria-label': s ? `${label}: ${s.name}` : label },
      on: { click: () => h.onSlot(index) },
    },
    s ? pic(s.art, 'c-lab__slot-pic') : el('span', { class: 'c-lab__slot-plus', text: '+' }),
    el('b', { class: 'c-lab__slot-name', text: s?.name ?? label }),
    el('small', { class: 'c-lab__slot-have', text: s ? s.have : vi.lab.choose }),
  );
}

function resultCard(r: LabResultVm | null, note: string | null): HTMLElement {
  if (!r) return el('div', { class: 'c-lab__result is-empty' }, el('span', { class: 'c-lab__result-q', text: '?' }), el('small', { text: note ?? '' }));
  return el(
    'div',
    { class: `c-lab__result${r.mystery ? ' is-mystery' : ''}${r.chance >= 100 ? ' is-sure' : ''}` },
    el('span', { class: 'c-lab__result-pic' }, pic(r.art, 'c-lab__result-img'), r.mystery ? el('span', { class: 'c-lab__result-q', text: '?' }) : null),
    el('b', { class: 'c-lab__result-name', text: r.name }),
    el('span', { class: 'c-lab__meter', attrs: { role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(r.chance), 'aria-label': r.chanceText } }, el('i', { attrs: { style: `width:${r.chance}%` } })),
    el('small', { class: 'c-lab__chance', text: r.chanceText }),
    r.pity ? el('small', { class: 'c-lab__pity', text: r.pity }) : null,
  );
}

function bookRow(e: LabVm['book'][number], h: LabHandlers): HTMLElement {
  const parent = (p: LabSlotVm) => el('span', { class: `c-lab__chip${p.enough ? '' : ' is-short'}`, attrs: { title: `${p.name} · ${p.have}` } }, pic(p.art, 'c-lab__chip-pic'));
  return el(
    'button',
    {
      class: `c-lab__row${e.found ? ' is-found' : ''}${e.ready ? ' is-ready' : ''}`,
      attrs: { type: 'button', title: `${e.parents[0].name} + ${e.parents[1].name}` },
      on: { click: () => h.onRecipe(e.parents[0].id, e.parents[1].id) },
    },
    parent(e.parents[0]),
    el('span', { class: 'c-lab__op', text: '+' }),
    parent(e.parents[1]),
    el('span', { class: 'c-lab__op', text: '→' }),
    el('span', { class: `c-lab__chip c-lab__chip--result${e.result.mystery ? ' is-mystery' : ''}` }, pic(e.result.art, 'c-lab__chip-pic')),
    el(
      'span',
      { class: 'c-lab__row-text' },
      el('b', { text: e.result.name }),
      el('small', { text: `${e.result.chanceText}${e.found ? ` · ${vi.lab.found}` : ''}` }),
    ),
    el('span', { class: `c-lab__status${e.ready ? ' is-ready' : ''}`, text: e.status }),
  );
}

function revealCard(r: LabReveal, h: LabHandlers): HTMLElement {
  const title = r.success ? (r.firstTime ? vi.lab.resultFirst : vi.lab.resultWin) : vi.lab.resultMiss;
  return el(
    'button',
    { class: `c-lab__reveal${r.success ? ' is-win' : ' is-miss'}${r.firstTime ? ' is-first' : ''}`, attrs: { type: 'button', 'aria-live': 'polite' }, on: { click: h.onDismissReveal } },
    el('span', { class: 'c-lab__reveal-rays', attrs: { 'aria-hidden': 'true' } }),
    pic(r.art, 'c-lab__reveal-pic'),
    el('b', { class: 'c-lab__reveal-title', text: title }),
    el('span', { class: 'c-lab__reveal-name', text: r.name }),
    r.got ? el('small', { class: 'c-lab__reveal-got', text: r.got }) : null,
  );
}

export function labView(vm: LabVm, h: LabHandlers): HTMLElement {
  const off = vm.cross.reason !== null || h.busy;
  return el(
    'div',
    { class: 'c-lab' },
    el('p', { class: 'c-lab__intro', text: vm.intro }),
    el(
      'div',
      { class: 'c-lab__progress' },
      el('span', { class: 'c-lab__progress-bar' }, el('i', { attrs: { style: `width:${vm.progressPercent}%` } })),
      el('small', { text: vm.progress }),
    ),
    el(
      'div',
      { class: 'c-lab__bench' },
      slotButton(vm.slots[0], 0, h),
      el('span', { class: 'c-lab__op c-lab__op--big', text: '+' }),
      slotButton(vm.slots[1], 1, h),
      el('span', { class: 'c-lab__op c-lab__op--big', text: '→' }),
      resultCard(vm.result, vm.note),
      h.reveal ? revealCard(h.reveal, h) : null,
    ),
    el(
      'div',
      { class: 'c-lab__go' },
      el('button', {
        class: `c-button c-lab__cross${h.busy ? ' is-busy' : ''}`,
        text: h.busy ? vi.lab.crossing : vm.cross.label,
        attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}) },
        on: { click: () => !off && h.onCross() },
      }),
      vm.cross.reason ? el('small', { class: 'c-action__reason', text: vm.cross.reason }) : el('small', { class: 'c-lab__hint', text: vi.lab.unlockHint }),
    ),
    h.picking !== null
      ? el(
          'div',
          { class: 'c-lab__picker', attrs: { role: 'listbox', 'aria-label': h.picking === 0 ? vi.lab.slotA : vi.lab.slotB } },
          ...vm.picker.map((s) =>
            el(
              'button',
              { class: `c-lab__pick${s.enough ? '' : ' is-short'}`, attrs: { type: 'button', role: 'option', title: `${s.name} · ${s.have}` }, on: { click: () => h.onPick(s.id) } },
              pic(s.art, 'c-lab__pick-pic'),
              el('b', { text: s.name }),
              el('small', { text: s.have }),
            ),
          ),
        )
      : null,
    el('h3', { class: 'c-lab__book-title', text: vi.lab.book }, el('small', { text: vi.lab.bookHint })),
    el('div', { class: 'c-lab__book' }, ...vm.book.map((e) => bookRow(e, h))),
  );
}

/** "3 Hạt bí ngô". */
export const gotText = (count: number, name: string) => t(vi.lab.resultGot, { count, name });

export interface LabController {
  /** The lab's body for this world; call again on every world change. */
  render(input: LabInput): HTMLElement;
}

/**
 * Keeps the lab's own choices (the pair, the slot being picked, the last reveal) across re-renders. `cross` runs the
 * Area's action and says what to reveal (null when it failed); `redraw` re-renders the dialog after a local change.
 */
export function createLabController(cross: (a: string, b: string) => Promise<LabReveal | null>, redraw: () => void, start: readonly [string | null, string | null] = [null, null]): LabController {
  let pair: [string | null, string | null] = [...start];
  let picking: 0 | 1 | null = null;
  let reveal: LabReveal | null = null;
  let busy = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const set = (f: () => void) => {
    f();
    redraw();
  };
  const handlers = (): LabHandlers => ({
    picking,
    reveal,
    busy,
    onSlot: (slot) => set(() => (picking = picking === slot ? null : slot)),
    onPick: (id) =>
      set(() => {
        if (picking === null) return;
        pair[picking] = id;
        // Filling the first slot moves on to the second one while it is empty.
        picking = picking === 0 && pair[1] === null ? 1 : null;
      }),
    onRecipe: (a, b) =>
      set(() => {
        pair = [a, b];
        picking = null;
      }),
    onCross: () => {
      const [a, b] = pair;
      if (!a || !b || busy) return;
      set(() => {
        busy = true;
        reveal = null;
      });
      void cross(a, b).then((r) =>
        set(() => {
          busy = false;
          reveal = r;
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => set(() => (reveal = null)), 3200);
        }),
      );
    },
    onDismissReveal: () => set(() => (reveal = null)),
  });
  return { render: (input) => labView(labVm(input, pair[0], pair[1]), handlers()) };
}
