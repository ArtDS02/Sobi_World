// The Adventure's screens as DOM builders (hub, map of a run, battle, summary). Each one is a pure function of the world, the
// roster and the little local state of the screen (`UiState`); a click calls back into the controller (adventureUi.ts), which
// owns the state, the timers and the store. The numbers come from the view-models.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { claimStarter, collectLoot } from '../logic/actions/camp';
import { closeRun, enterNode, retreat, startRun } from '../logic/actions/run';
import { AB, ZONES } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import { actionButton } from './adventureDialogs';
import { ELEMENT_ICON, hubVm, startReason, type FighterCardVm } from './adventureVm';
import { mapVm, resultVm } from './battleVm';
import { bar, type ViewCtx } from './viewKit';

// ---- The hub ---------------------------------------------------------------------------------------------------

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
      el('small', { text: `${ELEMENT_ICON[c.element]} ${c.style} · ${c.level}` }),
    ),
    el('div', { class: 'adventure-ui__meters' }, bar(c.expPercent, 'exp'), el('small', { text: c.expText }), bar(c.energyPercent, 'energy'), el('small', { text: c.energyText })),
    el('small', { class: 'adventure-ui__hearts', text: c.hearts }),
    c.statusChip ? el('span', { class: 'adventure-ui__chip', text: c.statusChip }) : null,
    el('small', { class: 'adventure-ui__stats', text: (['hp', 'atk', 'def', 'spd', 'crit'] as const).map((k) => `${vi.adventure.stat[k]} ${c.stats[k]}`).join(' · ') }),
    el(
      'ul',
      { class: 'adventure-ui__skills' },
      ...c.skills.map((s) => el('li', { class: s.opensAt === null ? '' : 'is-locked', attrs: { title: s.desc }, text: `${ELEMENT_ICON[s.element]} ${s.name}${s.opensAt === null ? '' : ` — ${t(vi.adventure.opensAt, { level: s.opensAt })}`}` })),
    ),
    el('button', { class: 'c-button c-button--ghost', text: vi.adventure.gear, attrs: { type: 'button' }, on: { click: () => ctx.openGear(c.key) } }),
  );
}

export function renderHub(ctx: ViewCtx): HTMLElement {
  const { world: w, now, roster, state } = ctx;
  const hub = hubVm(w, roster, now, { starter: (ww, c) => claimStarter(ww, { give: ctx.give }, c), loot: (ww, c) => collectLoot(ww, c) });
  const cards = hub.fighters;
  state.selected = state.selected.filter((k) => cards.some((c) => c.key === k && c.notReady === null));
  const zone = ZONES[state.zoneId]!;
  const reason = startReason(w, roster, state.zoneId, state.selected, now);
  return el(
    'div',
    { class: 'adventure-ui__hub' },
    el(
      'section',
      { class: 'adventure-ui__zones', attrs: { 'aria-label': vi.adventure.zones } },
      ...hub.zones.map((z) =>
        el(
          'button',
          {
            class: `adventure-ui__zone${z.id === state.zoneId ? ' is-selected' : ''}${z.locked ? ' is-off' : ''}`,
            attrs: { type: 'button', 'aria-pressed': String(z.id === state.zoneId), ...(z.locked ? { title: z.locked } : {}) },
            on: {
              click: () => {
                state.zoneId = z.id;
                ctx.rerender();
              },
            },
          },
          el('b', { text: z.name }),
          el('small', { text: z.desc }),
          el('span', { class: 'adventure-ui__nodes', text: z.nodes }),
          z.locked ? el('span', { class: 'adventure-ui__chip', text: z.locked }) : null,
        ),
      ),
    ),
    el(
      'div',
      { class: 'adventure-ui__quest' },
      hub.starter ? el('p', { class: 'c-dialog__hint', text: `${vi.adventure.knight}: ${vi.adventure.starterHint}` }) : null,
      hub.starter ? actionButton(hub.starter, () => ctx.dispatch((ww, c) => claimStarter(ww, { give: ctx.give }, c))) : null,
      hub.loot ? actionButton(hub.loot, () => ctx.dispatch((ww, c) => collectLoot(ww, c))) : null,
    ),
    el('h3', { text: vi.adventure.fighters }),
    el('p', { class: 'c-dialog__hint', text: t(vi.adventure.fightersHint, { cost: AB.run.energyCost }) }),
    cards.length === 0 ? el('p', { text: vi.adventure.noFighters }) : el('div', { class: 'adventure-ui__fighters' }, ...cards.map((c) => fighterCard(c, ctx))),
    hub.waiting > 0 ? el('p', { class: 'c-dialog__hint', text: t(vi.adventure.waiting, { count: hub.waiting }) }) : null,
    el(
      'div',
      { class: 'adventure-ui__start' },
      el('span', { text: t(vi.adventure.selected, { count: state.selected.length, max: AB.team.max }) }),
      actionButton({ label: `${vi.adventure.start} — ${zone.nameVi}`, reason }, () => {
        const keys = state.selected;
        const zoneId = state.zoneId;
        state.selected = [];
        ctx.dispatch((ww, c) => startRun(ww, { zoneId, keys, roster: ctx.roster }, c));
      }),
    ),
  );
}

// ---- The map of a run --------------------------------------------------------------------------------------------

export function renderMap(ctx: ViewCtx): HTMLElement {
  const v = mapVm(adventureOf(ctx.world).run!);
  return el(
    'div',
    { class: 'adventure-ui__map' },
    el('h3', { text: v.zone }),
    el(
      'ol',
      { class: 'adventure-ui__path' },
      ...v.nodes.map((n) => el('li', { class: `adventure-ui__node is-${n.state}`, attrs: { title: n.label } }, el('span', { text: n.icon }), el('small', { text: n.label }))),
    ),
    v.event ? el('div', { class: 'adventure-ui__event' }, el('b', { text: v.event.name }), el('p', { text: v.event.text })) : null,
    el('h4', { text: vi.adventure.teamHp }),
    el(
      'div',
      { class: 'adventure-ui__team' },
      ...v.team.map((m) =>
        el(
          'div',
          { class: `adventure-ui__member${m.down ? ' is-down' : ''}` },
          art(m.art, 'adventure-ui__member-art', m.name) ?? el('span', { text: '🐷' }),
          el('b', { text: m.name }),
          bar(m.hpPercent, 'hp'),
          el('small', { text: m.down ? vi.adventure.down : m.hpText }),
        ),
      ),
    ),
    el(
      'div',
      { class: 'adventure-ui__map-actions' },
      actionButton({ label: vi.adventure.enter, reason: null }, () => ctx.dispatch((ww, c) => enterNode(ww, c))),
      actionButton({ label: vi.adventure.retreat, reason: null }, () => ctx.dispatch((ww, c) => retreat(ww, c)), 'c-button--ghost'),
      el('small', { class: 'c-dialog__hint', text: vi.adventure.retreatHint }),
    ),
  );
}

// ---- The summary -------------------------------------------------------------------------------------------------------

export function renderDone(ctx: ViewCtx): HTMLElement {
  const run = adventureOf(ctx.world).run!;
  const r = resultVm(run, new Map(run.team.map((m) => [m.key, m.name])))!;
  return el(
    'div',
    { class: `adventure-ui__done is-${r.result}` },
    el('h3', { text: r.title }),
    el('p', { text: r.body }),
    el('ul', {}, ...r.lines.map((l) => el('li', { text: l }))),
    r.loot.length > 0
      ? el(
          'div',
          { class: 'adventure-ui__loot' },
          el('b', { text: vi.adventure.lootTitle }),
          el('ul', {}, ...r.loot.map((l) => el('li', {}, art(l.art, 'adventure-ui__loot-icon', l.name), el('span', { text: `${l.name} x${l.count}` })))),
        )
      : null,
    actionButton({ label: vi.adventure.claim, reason: null }, () => ctx.dispatchThen((ww, c) => collectLoot(ww, c), (ww, c) => closeRun(ww, c))),
  );
}
