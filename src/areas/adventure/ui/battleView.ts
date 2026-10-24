// The battle screen (spec §15.4–15.5, §17; adventure-big-update-1): the zone's painting behind, our team on the left facing right and the
// enemies on the right facing left, each with a small nameplate (element, name, level, health, statuses; the enemies' intent). The turn
// bar sits at the very top: the one acting slides into the lit slot at its head. The command dock at the bottom keeps the screen quiet:
// the team on the left, three tabs (main skills, class skills, items) whose list opens only when a tab is clicked, Defend / Flee, and
// the round Attack button. Choosing an action puts a target marker (a ring with an X) on everything it can reach — one big marker over
// a whole side for a skill that hits a side — and the action runs only when a marker is clicked. The last step plays over the field
// (battleStage.ts draws the magic circles, effects and reactions on a canvas; the numbers and the banner are DOM, battleFxView.ts).
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { battleAct, flee } from '../logic/actions/battle';
import { adventureOf } from '../logic/save/lens';
import { FX_MS, bannerEl, floaterEl, stepEffects } from './battleFxView';
import type { FloaterVm } from './battleFloaters';
import { battleVm, effectOn, type ActionTab, type BattleActionVm, type BattleVm, type UnitVm } from './battleVm';
import { bar, elementIcon, iconOf, roundButton, skillIcon, statusChip, type ViewCtx } from './viewKit';
import { ACTION_ART } from './vmKit';

function act(action: BattleActionVm, ctx: ViewCtx, target?: string) {
  ctx.state.aim = null;
  ctx.state.menu = null;
  if (action.kind === 'flee') return ctx.dispatch((ww, c) => flee(ww, c));
  const base =
    action.kind === 'attack'
      ? ({ kind: 'attack', target: target ?? '' } as const)
      : action.kind === 'guard'
        ? ({ kind: 'guard' } as const)
        : action.kind === 'ultimate'
          ? ({ kind: 'ultimate', ...(target ? { target } : {}) } as const)
          : action.kind === 'skill'
            ? ({ kind: 'skill', skillId: action.id, ...(target ? { target } : {}) } as const)
            : ({ kind: 'item', itemId: action.id, ...(target ? { target } : {}) } as const);
  ctx.dispatch((ww, c) => battleAct(ww, { action: base }, c));
}

/** Picks an action: guard and flee run at once; everything else waits for its target marker to be clicked. */
export function choose(action: BattleActionVm, vm: BattleVm, ctx: ViewCtx) {
  if (action.reason) return;
  if (action.aim === null) return act(action, ctx);
  void vm;
  ctx.state.aim = { action };
  ctx.state.menu = null;
  ctx.rerender();
}

/** Where each unit stands on the field (its feet, % of the field): ours on the left, theirs on the right, the first one in front. */
export const SPOTS = {
  ally: [
    { x: 31, y: 79 },
    { x: 19, y: 61 },
    { x: 16, y: 93 },
  ],
  enemy: [
    { x: 69, y: 79 },
    { x: 81, y: 61 },
    { x: 85, y: 93 },
    { x: 93, y: 76 },
  ],
} as const;

export interface Spot {
  x: number;
  y: number;
}

const portrait = (u: { art: string; name: string }, cls: string) => art(u.art, cls, u.name) ?? el('span', { class: cls });

export const spotOf = (side: UnitVm['side'], index: number): Spot => {
  const spots = SPOTS[side];
  return spots[index % spots.length]!;
};

/** The units a marker can be put on for an action aimed at one unit (or at the actor itself). */
function aimable(u: UnitVm, action: BattleActionVm, actor: string | null): boolean {
  if (u.down) return false;
  if (action.aim === 'enemy') return u.side === 'enemy';
  if (action.aim === 'ally') return u.side === 'ally';
  if (action.aim === 'self') return u.id === actor;
  return false;
}

/** The ring with an X that fires the action on what it marks. */
function marker(label: string, onClick: () => void, cls = '', extra: HTMLElement | null = null, style = ''): HTMLElement {
  return el(
    'button',
    { class: `adv-reticle${cls}`, attrs: { type: 'button', 'aria-label': label, title: label, ...(style ? { style } : {}) }, on: { click: (e) => (e.stopPropagation(), onClick()) } },
    el('span', { class: 'adv-reticle__ring', attrs: { 'aria-hidden': 'true' } }),
    el('span', { class: 'adv-reticle__x', attrs: { 'aria-hidden': 'true' } }),
    extra,
  );
}

function unitOnField(u: UnitVm, index: number, vm: BattleVm, ctx: ViewCtx, floaters: readonly FloaterVm[], elapsed: number, falling: boolean): HTMLElement {
  const aim = ctx.state.aim;
  const can = !!aim && aimable(u, aim.action, vm.actor);
  const run = adventureOf(ctx.world).run!;
  const effect = can && aim && vm.actor && aim.action.aim !== 'self' ? effectOn(run.battle!, vm.actor, aim.action.element, aim.action.category, u.id) : null;
  const spot = spotOf(u.side, index);
  // A unit knocked out in this step stands until its blow lands, then falls (the stage plays the fall).
  const down = u.down && !falling;
  return el(
    'div',
    {
      class: `adventure-ui__unit adventure-ui__unit--${u.side}${u.active ? ' is-active' : ''}${down ? ' is-down' : ''}${can ? ' is-aimable' : ''}${u.boss ? ' is-boss' : ''}${u.elite ? ' is-elite' : ''}${u.corrupted ? ' is-corrupted' : ''}`,
      attrs: { role: 'group', style: `left:${spot.x}%;top:${spot.y}%;z-index:${Math.round(spot.y)}`, 'aria-label': `${u.name} ${u.hpText}`, title: u.intent ? `${u.name}: ${u.intent}` : u.name, 'data-unit': u.id, 'data-side': u.side },
    },
    el(
      'span',
      { class: 'adventure-ui__plate' },
      el(
        'span',
        { class: 'adventure-ui__plate-name' },
        ...u.elements.map((e) => elementIcon(e)),
        el('b', { text: u.name }),
        u.level !== null ? el('small', { class: 'adventure-ui__plate-lv', text: t(vi.adventure.battle.level, { level: u.level }) }) : null,
        u.guarding ? iconOf(ACTION_ART.guard, vi.adventure.battle.guard, 'is-guard') : null,
      ),
      el('span', { class: 'adventure-ui__plate-hp' }, bar(u.hpPercent, 'hp', u.hpText), el('small', { text: u.hpText })),
      u.side === 'ally' ? el('span', { class: 'adventure-ui__plate-sub' }, bar(u.mpPercent, 'mp', u.mpText), u.expPercent !== null ? bar(u.expPercent, 'exp') : null) : null,
      u.statuses.length > 0 ? el('span', { class: 'adventure-ui__statuses' }, ...u.statuses.map(statusChip)) : null,
      u.intentArt ? el('span', { class: 'adventure-ui__intent', attrs: { title: u.intent ?? '' } }, iconOf(u.intentArt, u.intent ?? '')) : null,
    ),
    el(
      'span',
      { class: 'adventure-ui__body', attrs: { 'data-body': u.id } },
      el('span', { class: 'adventure-ui__idle' }, el('span', { class: 'adventure-ui__face' }, portrait(u, 'adventure-ui__unit-art'))),
      can && aim
        ? marker(
            `${aim.action.label} → ${u.name}`,
            () => act(aim.action, ctx, aim.action.aim === 'self' ? undefined : u.id),
            '',
            effect ? el('span', { class: `adventure-ui__eff is-${effect.tone}`, text: effect.reaction ? `${effect.label} · ${t(vi.adventure.battle.reacts, { reaction: effect.reaction })}` : effect.label }) : null,
          )
        : null,
    ),
    floaters.length > 0 ? el('span', { class: 'adventure-ui__floats' }, ...floaters.map((f) => floaterEl(f, elapsed))) : null,
  );
}

/** One big marker over a whole side (a skill that hits every enemy, or every ally). */
function sideMarker(side: 'ally' | 'enemy', units: readonly UnitVm[], action: BattleActionVm, ctx: ViewCtx): HTMLElement | null {
  const standing = units.map((u, i) => ({ u, s: spotOf(side, i) })).filter((x) => !x.u.down);
  if (standing.length === 0) return null;
  const xs = standing.map((x) => x.s.x);
  const ys = standing.map((x) => x.s.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2 - 12;
  const w = Math.max(...xs) - Math.min(...xs) + 22;
  const h = Math.max(...ys) - Math.min(...ys) + 34;
  const label = `${action.label} → ${vi.adventure.battle.aimAll}`;
  return marker(label, () => act(action, ctx), ` adv-reticle--side is-${side}`, el('span', { class: 'adv-reticle__label', text: vi.adventure.battle.aimAll }), `left:${cx}%;top:${cy}%;width:${w}%;height:${h}%`);
}

/** The turn bar: the round, the one acting in the lit slot at the head, then the ones after it (the next round past the arrow). */
function turnBar(vm: BattleVm): HTMLElement {
  const nowCount = vm.order.filter((o) => !o.next).length;
  const [head, ...rest] = vm.order;
  return el(
    'div',
    { class: 'adventure-ui__turnbar', attrs: { 'aria-label': vi.adventure.battle.order } },
    el(
      'span',
      { class: 'adventure-ui__pills' },
      vm.riftFloor !== null ? el('span', { class: 'adventure-ui__round-pill is-rift', text: t(vi.adventure.engage.rift.floor, { floor: vm.riftFloor }) }) : null,
      el('span', { class: 'adventure-ui__round-pill', text: t(vi.adventure.battle.round, { round: vm.round }) }),
      vm.affix ? el('span', { class: 'adventure-ui__round-pill is-affix', attrs: { title: vm.affix.name } }, iconOf(vm.affix.art, vm.affix.name), el('span', { text: vm.affix.name })) : null,
      vm.escapeIn !== null ? el('span', { class: 'adventure-ui__round-pill is-escape', text: t(vi.adventure.engage.escapeIn, { rounds: vm.escapeIn }) }) : null,
    ),
    el(
      'div',
      { class: 'adventure-ui__turns' },
      el('span', { class: 'adventure-ui__turn-slot', attrs: { 'aria-hidden': 'true' } }),
      ...[head, ...rest].flatMap((o, i) =>
        o
          ? [
              i === nowCount && i > 0 ? el('span', { class: 'adventure-ui__turn-sep', attrs: { 'aria-hidden': 'true' } }) : null,
              el('span', { class: `adventure-ui__turn is-${o.side}${o.next ? ' is-next' : ''}${i === 0 ? ' is-now' : ''}`, attrs: { title: o.name, 'data-turn': `${o.id}:${o.next ? 'n' : 'c'}` } }, portrait(o, 'adventure-ui__turn-art')),
            ]
          : [],
      ),
    ),
  );
}

/** The team, bottom left: portrait, name, level, health, MP, Rage and the way to the next level. */
function party(vm: BattleVm): HTMLElement {
  return el(
    'div',
    { class: 'adventure-ui__party' },
    ...vm.units
      .filter((u) => u.side === 'ally')
      .map((u) =>
        el(
          'div',
          { class: `adventure-ui__teamrow${u.active ? ' is-active' : ''}${u.down ? ' is-down' : ''}` },
          portrait(u, 'adventure-ui__teamrow-art'),
          el(
            'div',
            { class: 'adventure-ui__teamrow-text' },
            el('b', {}, el('span', { text: u.name }), u.level !== null ? el('small', { text: t(vi.adventure.battle.level, { level: u.level }) }) : null),
            el('span', { class: 'adventure-ui__teamrow-hp' }, bar(u.hpPercent, 'hp', u.hpText), el('small', { text: u.down ? vi.adventure.explore.down : u.hpText })),
            el('span', { class: 'adventure-ui__teamrow-sub' }, bar(u.mpPercent, 'mp', u.mpText), bar(u.ragePercent, `rage${u.rageFull ? ' is-full' : ''}`)),
          ),
        ),
      ),
  );
}

/** A skill (or item) card: its icon, name, cost and what it does; greyed with the reason when it cannot be used. */
function actionCard(a: BattleActionVm, vm: BattleVm, ctx: ViewCtx): HTMLElement {
  const off = a.reason !== null;
  return el(
    'button',
    {
      class: `adventure-ui__card is-${a.kind}${off ? ' is-off' : ''}`,
      attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}), title: off ? (a.reason ?? '') : a.detail },
      on: { click: () => !off && choose(a, vm, ctx) },
    },
    a.kind === 'item' ? iconOf(a.art, a.label, 'adv-icon--skill') : skillIcon(a.id, a.element, a.label),
    el('b', { text: a.label }),
    a.mp > 0 ? el('small', { class: 'adventure-ui__card-mp', text: `${a.mp} MP` }) : a.kind === 'ultimate' ? el('small', { class: 'adventure-ui__card-mp is-rage', text: vi.adventure.battle.ultimate }) : null,
    el('small', { class: 'adventure-ui__card-desc', text: off ? (a.reason ?? '') : a.detail }),
  );
}

const TABS: readonly Exclude<ActionTab, 'basic'>[] = ['main', 'sub', 'item'];
const TAB_ART: Readonly<Record<Exclude<ActionTab, 'basic'>, string>> = { main: ACTION_ART.ultimate, sub: ACTION_ART.skill, item: 'ui_item_potion_healing' };

/** The command dock of the one acting: who it is, the three tabs, Defend and Flee; the open tab's list floats above it. */
function commands(vm: BattleVm, ctx: ViewCtx, actor: UnitVm | undefined): HTMLElement {
  const { state } = ctx;
  if (state.aim) {
    return el(
      'div',
      { class: 'adventure-ui__cmd is-aiming' },
      el('b', { class: 'adventure-ui__cmd-hint', text: t(vi.adventure.battle.aimHint, { skill: state.aim.action.label }) }),
      el('button', { class: 'adventure-ui__small', text: vi.adventure.battle.cancel, attrs: { type: 'button' }, on: { click: () => ((state.aim = null), ctx.rerender()) } }),
    );
  }
  if (!actor || actor.side !== 'ally') return el('div', { class: 'adventure-ui__cmd is-waiting' }, el('b', { class: 'adventure-ui__waiting', text: vi.adventure.battle.waitingFoes }));
  const one = (kind: BattleActionVm['kind']) => vm.actions.find((a) => a.kind === kind);
  const small = (a: BattleActionVm | undefined) =>
    a
      ? el(
          'button',
          { class: 'adventure-ui__small', attrs: { type: 'button', ...(a.reason ? { disabled: '', title: a.reason } : { title: a.detail || a.label }) }, on: { click: () => choose(a, vm, ctx) } },
          iconOf(a.art, a.label),
          el('span', { text: a.label }),
        )
      : null;
  const listOf = (tab: ActionTab) => vm.actions.filter((a) => a.tab === tab);
  const open = state.menu && state.menu !== 'basic' ? state.menu : null;
  const tabButton = (tab: Exclude<ActionTab, 'basic'>) => {
    const list = listOf(tab);
    const ready = list.filter((a) => a.reason === null).length;
    const on = open === tab;
    return el(
      'button',
      {
        class: `adventure-ui__tab is-${tab}${on ? ' is-on' : ''}${list.some((a) => a.kind === 'ultimate' && a.reason === null) ? ' is-ult' : ''}`,
        attrs: { type: 'button', 'aria-pressed': String(on), 'aria-expanded': String(on) },
        on: { click: () => ((state.menu = on ? null : tab), ctx.rerender()) },
      },
      iconOf(TAB_ART[tab], vi.adventure.battle.tabs[tab]),
      el('span', { text: vi.adventure.battle.tabs[tab] }),
      el('small', { class: 'adventure-ui__tab-count', text: String(ready) }),
    );
  };
  const panelList = open ? listOf(open) : [];
  return el(
    'div',
    { class: 'adventure-ui__cmd' },
    el('div', { class: 'adventure-ui__cmd-head' }, el('b', { text: t(vi.adventure.battle.yourTurn, { name: actor.name }) }), el('small', { class: 'adventure-ui__cmd-mp', text: `${actor.mpText} MP` })),
    el('div', { class: 'adventure-ui__tabs', attrs: { role: 'tablist' } }, ...TABS.map(tabButton), el('span', { class: 'adventure-ui__tabs-gap' }), small(one('guard')), small(one('flee'))),
    open
      ? el(
          'div',
          { class: `adventure-ui__panel is-${open}`, attrs: { role: 'tabpanel' } },
          el(
            'div',
            { class: 'adventure-ui__panel-head' },
            el('b', { text: vi.adventure.battle.tabs[open] }),
            el('button', { class: 'adventure-ui__panel-close', attrs: { type: 'button', 'aria-label': vi.adventure.battle.close, title: vi.adventure.battle.close }, on: { click: () => ((state.menu = null), ctx.rerender()) } }),
          ),
          panelList.length > 0
            ? el('div', { class: 'adventure-ui__cards', attrs: { 'data-keep-scroll': `cards-${open}` } }, ...panelList.map((a) => actionCard(a, vm, ctx)))
            : el('small', { class: 'adventure-ui__note', text: vi.adventure.battle.tabEmpty[open] }),
        )
      : null,
  );
}

export function renderBattle(ctx: ViewCtx): HTMLElement {
  const { state } = ctx;
  const run = adventureOf(ctx.world).run!;
  const vm = battleVm(ctx.world, run)!;
  const step = stepEffects(run, run.battle, state.fast);
  const live = step.elapsed < step.motion.total + FX_MS;
  const floatersOf = (id: string) => (live ? step.fx.floaters.filter((f) => f.unit === id) : []);
  const fxBanner = live ? step.fx.banner : null;
  const actor = vm.units.find((u) => u.id === vm.actor);
  const mine = actor?.side === 'ally';
  const attack = vm.actions.find((a) => a.kind === 'attack');
  const enemies = vm.units.filter((u) => u.side === 'enemy');
  const allies = vm.units.filter((u) => u.side === 'ally');
  // Knocked out in this step: still standing until its blow lands.
  const fallsLater = (u: UnitVm) => u.down && step.motion.reactions.some((r) => r.unit === u.id && r.kind === 'ko' && r.at + 520 > step.elapsed);
  const aim = state.aim?.action ?? null;
  const sideAim = aim && (aim.aim === 'enemies' || aim.aim === 'allies' || aim.aim === 'all');
  return el(
    'div',
    { class: `adventure-ui__battle${state.fast ? ' is-fast' : ''}${aim ? ' is-aiming' : ''}` },
    turnBar(vm),
    el(
      'div',
      { class: 'adventure-ui__tools' },
      roundButton(ACTION_ART.auto, vi.adventure.battle.auto, state.auto, () => ((state.auto = !state.auto), ctx.rerender())),
      roundButton(ACTION_ART.speed, vi.adventure.battle.speed, state.fast, () => ((state.fast = !state.fast), ctx.rerender())),
      roundButton(ACTION_ART.skill, vi.adventure.battle.log.title, state.log, () => ((state.log = !state.log), ctx.rerender())),
    ),
    el(
      'div',
      { class: 'adventure-ui__field' },
      ...allies.map((u, i) => unitOnField(u, i, vm, ctx, floatersOf(u.id), step.elapsed, fallsLater(u))),
      ...enemies.map((u, i) => unitOnField(u, i, vm, ctx, floatersOf(u.id), step.elapsed, fallsLater(u))),
      sideAim && (aim.aim === 'enemies' || aim.aim === 'all') ? sideMarker('enemy', enemies, aim, ctx) : null,
      sideAim && (aim.aim === 'allies' || aim.aim === 'all') ? sideMarker('ally', allies, aim, ctx) : null,
    ),
    fxBanner ? bannerEl(fxBanner, vm.units.find((u) => u.id === fxBanner.unit)?.art ?? null, step.elapsed) : null,
    state.log ? el('ol', { class: 'adventure-ui__log', attrs: { 'aria-live': 'polite' } }, ...vm.log.slice(-40).map((line) => el('li', { text: line }))) : null,
    el(
      'div',
      { class: 'adventure-ui__dock' },
      party(vm),
      commands(vm, ctx, actor),
      attack && mine && !state.aim
        ? el(
            'button',
            { class: `adventure-ui__attack${attack.reason ? ' is-off' : ''}`, attrs: { type: 'button', title: attack.detail }, on: { click: () => choose(attack, vm, ctx) } },
            iconOf(attack.art, attack.label),
            el('span', { text: attack.label }),
          )
        : el('span', { class: 'adventure-ui__attack-gap' }),
    ),
  );
}
