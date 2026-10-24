// The exploration HUD over the map (spec §3, §17): the team's bars, the area and its discovery, the shrine blessings, the key hint for
// the thing in reach, the last event (a traveller, a lore stone), the small map (M) and the way back to the camp. The map itself is the
// Phaser scene underneath; this layer only takes clicks on its own pieces. Decision 039: the area's tip the first time, the quick-win
// switch, the Rift between two floors, the advice after a lost trip.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { closeRun, collectLoot } from '../logic/actions/camp';
import { returnToCamp, seeTip } from '../logic/actions/explore';
import { riftNext } from '../logic/actions/rift';
import { ENGAGEMENT } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import { lossAdvice } from './adviceVm';
import { resultVm } from './battleVm';
import { exploreVm, minimapVm, type MemberBarVm } from './exploreVm';
import { riftVm } from './riftVm';
import { actionButton, bar, elementIcon, iconOf, roundButton, type ViewCtx } from './viewKit';
import { ACTION_ART, pct } from './vmKit';

const MINI_COLOUR: Record<string, string> = { '.': '#cfe8b4', '#': '#5d7a4a', '~': '#7fc4e8', P: '#b98cf0', C: '#f2c14e', c: '#c9b37a', G: '#e0703a', '>': '#fff6d8' };

function minimap(ctx: ViewCtx): HTMLElement | null {
  const run = adventureOf(ctx.world).run;
  const m = run ? minimapVm(ctx.world, run) : null;
  if (!m) return null;
  const cells: HTMLElement[] = [];
  m.tiles.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '.') return;
      cells.push(el('i', { attrs: { style: `grid-column:${x + 1};grid-row:${y + 1};background:${MINI_COLOUR[c] ?? '#000'}` } }));
    }),
  );
  cells.push(el('i', { class: 'adventure-mini__me', attrs: { style: `grid-column:${m.player.x + 1};grid-row:${m.player.y + 1}` } }));
  return el('div', { class: 'adventure-mini', attrs: { style: `grid-template-columns:repeat(${m.cols},1fr);grid-template-rows:repeat(${m.rows},1fr);aspect-ratio:${m.cols}/${m.rows}`, 'aria-label': vi.adventure.explore.map } }, ...cells);
}

export function renderExplore(ctx: ViewCtx): HTMLElement | null {
  const run = adventureOf(ctx.world).run!;
  const v = exploreVm(ctx.world, run, ctx.state.focus);
  if (!v) return null;
  const lore = v.event;
  return el(
    'div',
    { class: 'adventure-explore' },
    el(
      'div',
      { class: 'adventure-explore__top' },
      el(
        'div',
        { class: 'adventure-explore__team' },
        ...v.team.map(memberBar),
      ),
      el(
        'div',
        { class: 'adventure-explore__where' },
        el('b', { class: 'adventure-explore__name', text: v.zoneName }),
        el('span', { class: 'adventure-explore__found' }, bar(v.exploredPct, 'explore', v.explored), el('small', { text: v.explored })),
        ...v.blessings.map((b) => el('small', { class: 'adventure-explore__bless' }, elementIcon(b.element), el('span', { text: b.text }))),
        el(
          'div',
          { class: 'adventure-explore__buttons' },
          roundButton(ACTION_ART.map, vi.adventure.explore.map, ctx.state.showMap, () => ((ctx.state.showMap = !ctx.state.showMap), ctx.rerender())),
          el(
            'span',
            { attrs: { title: t(vi.adventure.engage.quickHint, { pct: pct(ENGAGEMENT.quickWin.share) }) } },
            roundButton(ACTION_ART.sweep, ctx.state.quick ? vi.adventure.engage.quickOn : vi.adventure.engage.quickOff, ctx.state.quick, () => ((ctx.state.quick = !ctx.state.quick), ctx.rerender())),
          ),
          roundButton(ACTION_ART.camp, vi.adventure.explore.returnCamp, false, () => ctx.dispatch((w, c) => returnToCamp(w, c))),
        ),
      ),
    ),
    ctx.state.showMap ? el('div', { class: 'adventure-explore__map' }, el('b', { text: v.explored }), minimap(ctx)) : null,
    lore ? el('div', { class: 'adventure-explore__event' }, el('b', { text: lore.title }), el('p', { text: lore.text })) : null,
    v.tip
      ? el(
          'div',
          { class: 'adventure-explore__event is-tip', attrs: { role: 'note' } },
          el('b', { text: v.tip.title }),
          el('p', { text: v.tip.text }),
          actionButton({ label: vi.adventure.engage.tipOk, reason: null }, () => {
            const id = v.tip!.id;
            ctx.dispatch((w, c) => seeTip(w, { tipId: id }, c));
          }),
        )
      : null,
    el(
      'div',
      { class: 'adventure-explore__hint' },
      v.prompt
        ? el('span', { class: `adventure-explore__prompt${v.prompt.reason ? ' is-off' : ''}` }, iconOf(ACTION_ART.interact, ''), el('kbd', { text: ctx.interactKey() }), el('b', { text: v.prompt.label }), v.prompt.reason ? el('small', { text: v.prompt.reason }) : null)
        : el('small', { text: t(vi.adventure.explore.keys, { interact: ctx.interactKey() }) }),
    ),
  );
}

/** A team member's face and bars (the map's HUD and the Rift's card). */
function memberBar(m: MemberBarVm): HTMLElement {
  return el(
    'div',
    { class: `adventure-explore__member${m.down ? ' is-down' : ''}` },
    art(m.art, 'adventure-explore__face', m.name) ?? el('span', { class: 'adventure-explore__face' }),
    el(
      'div',
      { class: 'adventure-explore__bars' },
      el('b', { text: m.name }),
      el('span', { class: 'adventure-explore__hp' }, bar(m.hpPercent, 'hp', m.hpText), el('small', { text: m.down ? vi.adventure.explore.down : m.hpText })),
      el('span', { class: 'adventure-explore__sub' }, bar(m.mpPercent, 'mp'), bar(m.ragePercent, 'rage')),
    ),
  );
}

/** Between two Rift floors: what was cleared, today's rule, the next floor (a Nightmare on it), the team, the way out. */
export function renderRift(ctx: ViewCtx): HTMLElement | null {
  const run = adventureOf(ctx.world).run!;
  const v = riftVm(ctx.world, run);
  if (!v) return null;
  return el(
    'div',
    { class: 'adventure-ui__done is-rift' },
    el('h3', { text: v.title }),
    el('p', { class: 'adventure-rift__floor', text: v.cleared }),
    el('p', { class: 'adventure-rift__rule' }, el('b', { text: `${vi.adventure.engage.rift.rule}: ${v.rule.name}` }), el('small', { text: v.rule.desc })),
    el('div', { class: 'adventure-rift__team' }, ...v.team.map(memberBar)),
    v.next.nightmare ? el('p', { class: 'adventure-rift__nightmare', text: v.next.nightmare }) : null,
    el(
      'div',
      { class: 'adventure-rift__go' },
      actionButton({ label: v.next.label, reason: v.next.reason }, () => ctx.dispatch((w, c) => riftNext(w, c))),
      actionButton({ label: vi.adventure.engage.rift.leave, reason: null }, () => ctx.dispatch((w, c) => returnToCamp(w, c)), 'c-button--ghost'),
    ),
    el('small', { class: 'adventure-ui__note', text: `${v.record} · ${v.hint}` }),
  );
}

export function renderDone(ctx: ViewCtx): HTMLElement {
  const run = adventureOf(ctx.world).run!;
  const r = resultVm(run, new Map(run.team.map((m) => [m.key, m.name])))!;
  const advice = lossAdvice(ctx.world, run);
  return el(
    'div',
    { class: `adventure-ui__done is-${r.result}` },
    el('h3', { text: r.title }),
    el('p', { text: r.body }),
    el('ul', {}, ...r.lines.map((l) => el('li', { text: l }))),
    advice.length > 0 ? el('div', { class: 'adventure-ui__advice' }, el('b', { text: vi.adventure.engage.advice.title }), el('ul', {}, ...advice.map((l) => el('li', { text: l })))) : null,
    r.loot.length > 0
      ? el(
          'div',
          { class: 'adventure-ui__loot' },
          el('b', { text: vi.adventure.lootTitle }),
          el('ul', {}, ...r.loot.map((l) => el('li', {}, art(l.art, 'adventure-ui__loot-icon', l.name), el('span', { text: `${l.name} x${l.count}` })))),
        )
      : null,
    actionButton({ label: vi.adventure.claim, reason: null }, () =>
      Object.keys(adventureOf(ctx.world).pending).length > 0 ? ctx.dispatchThen((w, c) => collectLoot(w, c), (w, c) => closeRun(w, c)) : ctx.dispatch((w, c) => closeRun(w, c)),
    ),
  );
}
