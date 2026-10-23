// The camp screen (spec §17, GĐ14 layout of the owner's mock-up; the cards are in campCards.ts): the wooden sign with the beast
// peeking over a cream board, the zone cards, the element filter and the search, the companions, and the bottom bar with the chosen
// team, the formations, where the trip starts and the two ways to set off. The starter quest, the loot, the leader, the rations and the
// legend picture keep their place on the board. A pure function of the world, the roster and the screen's little state; a click calls
// back into the controller (adventureUi.ts).
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { Element } from '../../../systems/combat/types';
import { ELEMENTS } from '../../../systems/combat/types';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { claimStarter, collectLoot } from '../logic/actions/camp';
import { saveFormation, setLeader } from '../logic/actions/growth';
import { startRun } from '../logic/actions/start';
import { sweepZone } from '../logic/actions/sweep';
import { CAMP_ART, GUARDIANS_LEGEND_ART } from '../logic/art';
import { AB } from '../logic/config/content';
import { fighterCard, zoneCard } from './campCards';
import { campVm, startReason, sweepReason, teamWarnings, type CampVm } from './campVm';
import { actionButton, elementIcon, iconOf, toggle, type ViewCtx } from './viewKit';
import { ACTION_ART, elementName, pct } from './vmKit';

/** The cream board's title plaque (wood with leaves), with its words on it. */
const plaque = (text: string, cls = '') => el('div', { class: `adventure-ui__plaque ${cls}`.trim() }, art(CAMP_ART.plaque, 'adventure-ui__plaque-art'), el('h2', { text }));

function prepSection(camp: CampVm, ctx: ViewCtx): HTMLElement {
  const { state } = ctx;
  if (camp.prepSlots === 0) return el('p', { class: 'adventure-ui__note', text: vi.adventure.camp.prepNone });
  return el(
    'section',
    { class: 'adventure-ui__prep' },
    el('b', { text: t(vi.adventure.camp.prepTitle, { count: state.prep.length, max: camp.prepSlots }) }),
    el(
      'div',
      { class: 'adventure-ui__prep-list' },
      ...camp.prep.map((p) => {
        const on = state.prep.includes(p.itemId);
        const btn = toggle(`${p.name} (${t(vi.adventure.camp.prepHave, { n: p.have })}) — ${p.effect}`, on, () => {
          state.prep = on ? state.prep.filter((id) => id !== p.itemId) : state.prep.length < camp.prepSlots ? [...state.prep, p.itemId] : state.prep;
          ctx.rerender();
        });
        if (p.have < 1) {
          btn.setAttribute('disabled', '');
          btn.setAttribute('title', vi.adventure.camp.prepOut);
        }
        return btn;
      }),
    ),
    el('small', { class: 'adventure-ui__note', text: vi.adventure.camp.prepHint }),
  );
}

/** The companions' plaque (the rule of a team in its tooltip), the element chips and the name search. */
function filters(ctx: ViewCtx): HTMLElement {
  const { state } = ctx;
  const chip = (e: Element | null) =>
    el(
      'button',
      {
        class: `adventure-ui__filter${state.filter === e ? ' is-on' : ''}`,
        attrs: { type: 'button', 'aria-pressed': String(state.filter === e) },
        on: { click: () => ((state.filter = e), ctx.rerender()) },
      },
      e ? elementIcon(e) : null,
      el('span', { text: e ? elementName(e) : vi.adventure.camp.filterAll }),
    );
  return el(
    'div',
    { class: 'adventure-ui__team-head' },
    el('div', { attrs: { title: t(vi.adventure.camp.fightersHint, { cost: AB.run.energyCost }) } }, plaque(vi.adventure.camp.fighters, 'is-small')),
    el('div', { class: 'adventure-ui__filters', attrs: { 'data-keep-scroll': 'filters' } }, chip(null), ...ELEMENTS.map(chip)),
    el(
      'label',
      { class: 'adventure-ui__search' },
      el('input', {
        attrs: { type: 'search', placeholder: vi.adventure.camp.search, value: state.search, 'aria-label': vi.adventure.camp.search },
        on: {
          input: (e) => {
            const input = e.target as HTMLInputElement;
            const caret = input.selectionStart;
            state.search = input.value;
            ctx.rerender();
            const next = document.querySelector<HTMLInputElement>('.adventure-ui__search input');
            next?.focus();
            if (caret !== null) next?.setSelectionRange(caret, caret);
          },
        },
      }),
    ),
  );
}

function teamBar(camp: CampVm, ctx: ViewCtx): HTMLElement {
  const { state, world: w, now, roster } = ctx;
  const zone = camp.zones.find((z) => z.id === state.zoneId);
  const start = zone?.starts.find((s) => s.mapId === state.startMap) ?? zone?.starts[0];
  const team = camp.fighters.filter((f) => state.selected.includes(f.key));
  const warnings = teamWarnings(team, zone);
  const reason = startReason(w, roster, state.zoneId, start?.mapId, state.selected, now, state.prep);
  const sweep = sweepReason(w, roster, state.zoneId, state.selected, now, state.prep);
  const launch = (fn: 'start' | 'sweep') => {
    const keys = state.selected;
    const zoneId = state.zoneId;
    const mapId = start?.mapId;
    const prep = state.prep;
    state.prep = [];
    ctx.dispatch(fn === 'start' ? (ww, c) => startRun(ww, { zoneId, mapId, keys, roster: ctx.roster, prep }, c) : (ww, c) => sweepZone(ww, { zoneId, keys, roster: ctx.roster, prep }, c));
  };
  return el(
    'div',
    { class: 'adventure-ui__start' },
    el(
      'div',
      { class: 'adventure-ui__team-now' },
      el('b', { text: t(vi.adventure.camp.teamCount, { count: state.selected.length, max: AB.team.max }) }),
      ...Array.from({ length: AB.team.max }, (_, i) => {
        const m = team[i];
        return el('span', { class: `adventure-ui__slot${m ? ` is-${m.elementList[0]!.toLowerCase()}` : ''}`, attrs: m ? { title: m.name } : {} }, m ? art(m.art, 'adventure-ui__slot-art', m.name) : null);
      }),
    ),
    el(
      'div',
      { class: 'adventure-ui__formations' },
      iconOf(ACTION_ART.formation, vi.adventure.camp.formations),
      ...camp.formations.map((f) =>
        el(
          'span',
          { class: 'adventure-ui__formation', attrs: { title: f.names } },
          f.usable
            ? el('button', { class: 'adventure-ui__formation-use', text: f.label, attrs: { type: 'button', title: `${vi.adventure.camp.formationUse}: ${f.names}` }, on: { click: () => ((state.selected = [...f.keys]), ctx.rerender()) } })
            : el('span', { class: 'adventure-ui__formation-use is-empty', text: f.label }),
          state.selected.length > 0
            ? el('button', { class: 'adventure-ui__formation-save', text: '+', attrs: { type: 'button', title: vi.adventure.camp.formationSave, 'aria-label': `${vi.adventure.camp.formationSave} (${f.label})` }, on: { click: () => ctx.dispatch((ww, c) => saveFormation(ww, { index: f.index, keys: [...state.selected] }, c)) } })
            : null,
        ),
      ),
    ),
    zone && zone.starts.length > 1
      ? el(
          'label',
          { class: 'adventure-ui__start-at' },
          el('span', { text: vi.adventure.camp.startAt }),
          el(
            'select',
            { on: { change: (e) => ((state.startMap = (e.target as HTMLSelectElement).value), ctx.rerender()) } },
            ...zone.starts.map((s) => el('option', { text: s.label, attrs: { value: s.mapId, ...(s.mapId === start?.mapId ? { selected: '' } : {}) } })),
          ),
        )
      : null,
    reason || warnings.length > 0
      ? el('ul', { class: 'adventure-ui__warnings' }, reason ? el('li', { class: 'is-reason', text: reason }) : null, ...warnings.map((w0) => el('li', { text: w0 })))
      : null,
    el(
      'div',
      { class: 'adventure-ui__go' },
      actionButton({ label: vi.adventure.camp.start, reason }, () => launch('start'), 'adventure-ui__go-start'),
      el('span', { attrs: { title: t(vi.adventure.camp.sweepHint, { pct: pct(AB.sweep.share) }) } }, actionButton({ label: vi.adventure.camp.sweep, reason: sweep }, () => launch('sweep'), 'adventure-ui__go-sweep')),
    ),
  );
}

export function renderCamp(ctx: ViewCtx): HTMLElement {
  const { world: w, now, roster, state } = ctx;
  const camp = campVm(w, roster, now, { starter: (ww, c) => claimStarter(ww, { give: ctx.give }, c), loot: (ww, c) => collectLoot(ww, c) });
  state.selected = state.selected.filter((k) => camp.fighters.some((c) => c.key === k && c.notReady === null));
  state.prep = state.prep.filter((id) => camp.prep.some((p) => p.itemId === id && p.have > 0)).slice(0, camp.prepSlots);
  const zone = camp.zones.find((z) => z.id === state.zoneId);
  const search = state.search.trim().toLocaleLowerCase();
  const shown = camp.fighters.filter((c) => (!state.filter || c.elementList.includes(state.filter)) && (!search || c.name.toLocaleLowerCase().includes(search)));
  return el(
    'div',
    { class: 'adventure-ui__hub' },
    el(
      'div',
      { class: 'adventure-ui__sign' },
      art(CAMP_ART.peek, 'adventure-ui__peek'),
      el('div', { class: 'adventure-ui__sign-board' }, art(CAMP_ART.sign, 'adventure-ui__sign-art'), el('h1', { text: vi.adventure.title })),
    ),
    el(
      'div',
      { class: 'adventure-ui__board' },
      art(CAMP_ART.leaves, 'adventure-ui__leaves is-left'),
      art(CAMP_ART.leaves, 'adventure-ui__leaves is-right'),
      el(
        'div',
        { class: 'adventure-ui__board-head' },
        plaque(vi.adventure.camp.title),
        el(
          'div',
          { class: 'adventure-ui__quest' },
          camp.starter ? el('small', { class: 'adventure-ui__note', text: `${vi.adventure.camp.knight}: ${vi.adventure.camp.starterHint}` }) : null,
          camp.starter ? actionButton(camp.starter, () => ctx.dispatch((ww, c) => claimStarter(ww, { give: ctx.give }, c))) : null,
          camp.loot ? actionButton(camp.loot, () => ctx.dispatch((ww, c) => collectLoot(ww, c))) : null,
          el(
            'span',
            { class: 'adventure-ui__leader' },
            el('small', { text: vi.adventure.camp.leader }),
            toggle(vi.adventure.camp.so, camp.leader === 'so', () => ctx.dispatch((ww, c) => setLeader(ww, { leader: 'so' }, c))),
            toggle(vi.adventure.camp.bi, camp.leader === 'bi', () => ctx.dispatch((ww, c) => setLeader(ww, { leader: 'bi' }, c))),
          ),
          toggle(vi.adventure.camp.legend, state.legend, () => ((state.legend = !state.legend), ctx.rerender())),
        ),
      ),
      state.legend ? art(GUARDIANS_LEGEND_ART, 'adventure-ui__legend', vi.adventure.camp.legend) : null,
      el('section', { class: 'adventure-ui__zones', attrs: { 'aria-label': vi.adventure.camp.zones, 'data-keep-scroll': 'zones' } }, ...camp.zones.map((z) => zoneCard(z, ctx))),
      filters(ctx),
      camp.fighters.length === 0
        ? el('p', { class: 'adventure-ui__note', text: vi.adventure.camp.noFighters })
        : shown.length === 0
          ? el('p', { class: 'adventure-ui__note', text: vi.adventure.camp.noMatch })
          : el('div', { class: 'adventure-ui__fighters', attrs: { 'data-keep-scroll': 'fighters' } }, ...shown.map((c) => fighterCard(c, ctx))),
      camp.waiting > 0 ? el('p', { class: 'adventure-ui__note', text: t(vi.adventure.camp.waiting, { count: camp.waiting }) }) : null,
      prepSection(camp, ctx),
      teamBar(camp, ctx),
    ),
    zone
      ? el(
          'div',
          { class: 'adventure-ui__info' },
          iconOf(ACTION_ART.map, vi.adventure.explore.map),
          el('span', { text: `${zone.name} · ${zone.explored}` }),
          el('span', { class: 'adventure-ui__info-foes', attrs: { title: zone.foes } }, ...zone.foeElements.map((e) => elementIcon(e))),
        )
      : null,
  );
}
