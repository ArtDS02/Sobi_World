// The camp screen (spec §17): zones with their discovery and where a trip may start, the quick trip, the leader, the formations, the
// rations, the companions and the chosen team's warnings, the starter quest and the loot. A pure function of the world, the roster and
// the screen's little state; a click calls back into the controller (adventureUi.ts).
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { claimStarter, collectLoot } from '../logic/actions/camp';
import { saveFormation, setLeader } from '../logic/actions/growth';
import { startRun } from '../logic/actions/start';
import { sweepZone } from '../logic/actions/sweep';
import { GUARDIANS_LEGEND_ART } from '../logic/art';
import { AB, ZONES } from '../logic/config/content';
import { campVm, startReason, sweepReason, teamWarnings, type CampVm } from './campVm';
import type { FighterCardVm } from './fighterVm';
import { actionButton, bar, toggle, type ViewCtx } from './viewKit';
import { pct } from './vmKit';

function fighterCard(c: FighterCardVm, ctx: ViewCtx): HTMLElement {
  const chosen = ctx.state.selected.includes(c.key);
  const off = c.notReady !== null;
  return el(
    'div',
    { class: `adventure-ui__fighter${chosen ? ' is-selected' : ''}${off ? ' is-off' : ''}` },
    el(
      'button',
      {
        class: 'adventure-ui__fighter-pick',
        attrs: { type: 'button', 'aria-pressed': String(chosen), ...(off ? { disabled: '', title: c.notReady ?? '' } : {}) },
        on: {
          click: () => {
            const s = ctx.state;
            s.selected = chosen ? s.selected.filter((k) => k !== c.key) : s.selected.length < AB.team.max ? [...s.selected, c.key] : s.selected;
            ctx.rerender();
          },
        },
      },
      art(c.art, 'adventure-ui__fighter-art', c.name) ?? el('span', { class: 'adventure-ui__fighter-art', text: '🐷' }),
      el('b', { text: c.name }),
      el('small', { text: `${c.classLabel} · ${c.level}` }),
      el('small', { class: 'adventure-ui__elements', text: `${c.lineLabel} · ${c.elements}` }),
    ),
    el('div', { class: 'adventure-ui__meters' }, bar(c.expPercent, 'exp', c.expText), el('small', { text: c.expText }), bar(c.energyPercent, 'energy', c.energyText), el('small', { text: c.energyText })),
    el('small', { class: 'adventure-ui__hearts', text: `${c.hearts} · ${c.rageText}` }),
    c.statusChip ? el('span', { class: 'adventure-ui__chip', text: c.statusChip }) : null,
    el(
      'div',
      { class: 'adventure-ui__card-actions' },
      el('button', { class: 'c-button c-button--ghost', text: c.sp > 0 ? `${vi.adventure.camp.sheet} · ${t(vi.adventure.card.sp, { sp: c.sp })}` : vi.adventure.camp.sheet, attrs: { type: 'button' }, on: { click: () => ctx.openSheet(c.key) } }),
    ),
  );
}

function prepSection(camp: CampVm, ctx: ViewCtx): HTMLElement {
  const { state } = ctx;
  if (camp.prepSlots === 0) return el('p', { class: 'c-dialog__hint', text: vi.adventure.camp.prepNone });
  return el(
    'section',
    { class: 'adventure-ui__prep' },
    el('h3', { text: t(vi.adventure.camp.prepTitle, { count: state.prep.length, max: camp.prepSlots }) }),
    el('p', { class: 'c-dialog__hint', text: vi.adventure.camp.prepHint }),
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
    el('span', { text: t(vi.adventure.camp.selected, { count: state.selected.length, max: AB.team.max }) }),
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
    actionButton({ label: `${vi.adventure.camp.start} — ${ZONES[state.zoneId]?.nameVi ?? ''}`, reason }, () => launch('start')),
    actionButton({ label: vi.adventure.camp.sweep, reason: sweep }, () => launch('sweep'), 'c-button--ghost'),
    el('small', { class: 'c-dialog__hint', text: t(vi.adventure.camp.sweepHint, { pct: pct(AB.sweep.share) }) }),
    warnings.length > 0 ? el('ul', { class: 'adventure-ui__warnings' }, ...warnings.map((w0) => el('li', { text: `⚠️ ${w0}` }))) : null,
  );
}

export function renderCamp(ctx: ViewCtx): HTMLElement {
  const { world: w, now, roster, state } = ctx;
  const camp = campVm(w, roster, now, { starter: (ww, c) => claimStarter(ww, { give: ctx.give }, c), loot: (ww, c) => collectLoot(ww, c) });
  state.selected = state.selected.filter((k) => camp.fighters.some((c) => c.key === k && c.notReady === null));
  state.prep = state.prep.filter((id) => camp.prep.some((p) => p.itemId === id && p.have > 0)).slice(0, camp.prepSlots);
  return el(
    'div',
    { class: 'adventure-ui__hub' },
    art(GUARDIANS_LEGEND_ART, 'adventure-ui__legend', vi.adventure.camp.legend),
    el('h2', { class: 'adventure-ui__camp-title', text: vi.adventure.camp.title }),
    el(
      'section',
      { class: 'adventure-ui__zones', attrs: { 'aria-label': vi.adventure.camp.zones } },
      ...camp.zones.map((z) =>
        el(
          'button',
          {
            class: `adventure-ui__zone${z.id === state.zoneId ? ' is-selected' : ''}${z.locked ? ' is-off' : ''}`,
            attrs: { type: 'button', 'aria-pressed': String(z.id === state.zoneId), ...(z.locked ? { title: z.locked } : {}) },
            on: {
              click: () => {
                state.zoneId = z.id;
                state.startMap = null;
                ctx.rerender();
              },
            },
          },
          el('b', { text: z.name }),
          el('small', { text: z.desc }),
          el('small', { class: 'adventure-ui__zone-meta', text: [z.explored, z.cleared].filter(Boolean).join(' · ') }),
          el('small', { class: 'adventure-ui__zone-meta', text: z.foes }),
          z.locked ? el('span', { class: 'adventure-ui__chip', text: z.locked }) : null,
        ),
      ),
    ),
    el(
      'div',
      { class: 'adventure-ui__quest' },
      camp.starter ? el('p', { class: 'c-dialog__hint', text: `${vi.adventure.camp.knight}: ${vi.adventure.camp.starterHint}` }) : null,
      camp.starter ? actionButton(camp.starter, () => ctx.dispatch((ww, c) => claimStarter(ww, { give: ctx.give }, c))) : null,
      camp.loot ? actionButton(camp.loot, () => ctx.dispatch((ww, c) => collectLoot(ww, c))) : null,
      el(
        'span',
        { class: 'adventure-ui__leader' },
        el('small', { text: vi.adventure.camp.leader }),
        toggle(vi.adventure.camp.so, camp.leader === 'so', () => ctx.dispatch((ww, c) => setLeader(ww, { leader: 'so' }, c))),
        toggle(vi.adventure.camp.bi, camp.leader === 'bi', () => ctx.dispatch((ww, c) => setLeader(ww, { leader: 'bi' }, c))),
      ),
    ),
    prepSection(camp, ctx),
    el('h3', { text: vi.adventure.camp.fighters }),
    el('p', { class: 'c-dialog__hint', text: t(vi.adventure.camp.fightersHint, { cost: AB.run.energyCost }) }),
    el(
      'div',
      { class: 'adventure-ui__formations' },
      el('small', { text: vi.adventure.camp.formations }),
      ...camp.formations.map((f) =>
        el(
          'span',
          { class: 'adventure-ui__formation' },
          el('b', { text: `${f.label}: ` }),
          el('small', { text: f.names }),
          f.usable
            ? el('button', { class: 'c-button c-button--ghost', text: vi.adventure.camp.formationUse, attrs: { type: 'button' }, on: { click: () => ((state.selected = [...f.keys]), ctx.rerender()) } })
            : null,
          state.selected.length > 0
            ? el('button', { class: 'c-button c-button--ghost', text: vi.adventure.camp.formationSave, attrs: { type: 'button' }, on: { click: () => ctx.dispatch((ww, c) => saveFormation(ww, { index: f.index, keys: [...state.selected] }, c)) } })
            : null,
        ),
      ),
    ),
    camp.fighters.length === 0 ? el('p', { text: vi.adventure.camp.noFighters }) : el('div', { class: 'adventure-ui__fighters' }, ...camp.fighters.map((c) => fighterCard(c, ctx))),
    camp.waiting > 0 ? el('p', { class: 'c-dialog__hint', text: t(vi.adventure.camp.waiting, { count: camp.waiting }) }) : null,
    teamBar(camp, ctx),
  );
}
