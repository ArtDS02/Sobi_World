// The battle screen (spec §15.4–15.5, §17; GĐ14 layout of the owner's mock-up): the zone's painting behind, our team standing on the
// left and the enemies on the right, each with its element badge, health bar, statuses and (enemies) the intent as an icon; the round
// and the turn order as round portraits; a banner for the one acting and for the enemy leader; the team list bottom left; the skill
// cards with their icons, the big round Attack button, Defend / items / flee; the effects on the one acting on the right; Auto and x2;
// the log behind a button. The effectiveness label shows on each target while aiming. The last step plays over the field (decision 039):
// numbers over the units it touched, one banner (an Ultimate's cut-in, a reaction, a boss's new phase) and a shake. Each fighter breathes
// in a loop, leans into its action and reacts when reached, the effects fly and land on the impact (GĐ14 motion, battleMotionView.ts).
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { battleAct, flee } from '../logic/actions/battle';
import { adventureOf } from '../logic/save/lens';
import { FX_MS, SHAKE_MS, bannerEl, floaterEl, stepEffects } from './battleFxView';
import { fieldEffects, unitMotion, type Spot, type UnitMotion } from './battleMotionView';
import type { FloaterVm } from './battleFloaters';
import { battleVm, effectOn, type BattleActionVm, type BattleVm, type UnitVm } from './battleVm';
import { bar, classIcon, elementIcon, iconOf, roundButton, skillIcon, statusChip, type ViewCtx } from './viewKit';
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

/** Picks an action: it runs at once, or waits for a target (one choice goes alone). */
export function choose(action: BattleActionVm, vm: BattleVm, ctx: ViewCtx) {
  if (action.reason) return;
  if (action.aim === null) return act(action, ctx);
  const side = action.aim;
  const options = vm.units.filter((u) => u.side === side && !u.down);
  if (options.length === 1) return act(action, ctx, options[0]!.id);
  ctx.state.aim = { action, side };
  ctx.rerender();
}

/** Where each unit stands on the field (its feet, % of the field): ours on the left, theirs on the right, the first one in front. */
const SPOTS = {
  ally: [
    { x: 36, y: 62 },
    { x: 22, y: 44 },
    { x: 18, y: 82 },
  ],
  enemy: [
    { x: 64, y: 62 },
    { x: 80, y: 44 },
    { x: 82, y: 82 },
    { x: 92, y: 62 },
  ],
} as const;

const portrait = (u: { art: string; name: string }, cls: string) => art(u.art, cls, u.name) ?? el('span', { class: cls });

const spotOf = (side: UnitVm['side'], index: number): Spot => {
  const spots = SPOTS[side];
  return spots[index % spots.length]!;
};

function unitOnField(u: UnitVm, index: number, vm: BattleVm, ctx: ViewCtx, motion: UnitMotion, floaters: readonly FloaterVm[] = [], elapsed = 0): HTMLElement {
  const aim = ctx.state.aim;
  const aimable = !!aim && aim.side === u.side && !u.down;
  const run = adventureOf(ctx.world).run!;
  const effect = aimable && aim && vm.actor ? effectOn(run.battle!, vm.actor, aim.action.element, aim.action.category, u.id) : null;
  const spot = spotOf(u.side, index);
  // A unit knocked out in this step stands until its blow lands, then falls.
  const down = u.down && !motion.falling;
  return el(
    'button',
    {
      class: `adventure-ui__unit adventure-ui__unit--${u.side}${u.active ? ' is-active' : ''}${down ? ' is-down' : ''}${motion.falling ? ' is-falling' : ''}${aimable ? ' is-aimable' : ''}${u.boss ? ' is-boss' : ''}${u.elite ? ' is-elite' : ''}${u.corrupted ? ' is-corrupted' : ''}`,
      attrs: { type: 'button', style: `left:${spot.x}%;top:${spot.y}%;z-index:${Math.round(spot.y)}${motion.falling ? `;${motion.falling.style}` : ''}`, ...(aimable ? {} : { disabled: '' }), 'aria-label': `${u.name} ${u.hpText}`, title: u.intent ? `${u.name}: ${u.intent}` : u.name },
      on: { click: () => aimable && aim && act(aim.action, ctx, u.id) },
    },
    el(
      'span',
      { class: 'adventure-ui__unit-head' },
      effect ? el('span', { class: `adventure-ui__eff is-${effect.tone}`, text: effect.reaction ? `${effect.label} · ${t(vi.adventure.battle.reacts, { reaction: effect.reaction })}` : effect.label }) : null,
      u.intentArt ? el('span', { class: 'adventure-ui__intent', attrs: { title: u.intent ?? '' } }, iconOf(u.intentArt, u.intent ?? '')) : null,
      el('span', { class: 'adventure-ui__unit-bar' }, ...u.elements.map((e) => elementIcon(e)), bar(u.hpPercent, 'hp', u.hpText), u.guarding ? iconOf(ACTION_ART.guard, vi.adventure.battle.guard, 'is-guard') : null),
      u.statuses.length > 0 ? el('span', { class: 'adventure-ui__statuses' }, ...u.statuses.map(statusChip)) : null,
    ),
    el('span', { class: 'adventure-ui__body', attrs: { style: motion.body } }, el('span', { class: 'adventure-ui__idle', attrs: { style: motion.idle } }, portrait(u, 'adventure-ui__unit-art'))),
    floaters.length > 0 ? el('span', { class: 'adventure-ui__floats' }, ...floaters.map((f) => floaterEl(f, elapsed))) : null,
  );
}

/** The one acting (ours, left) and the enemy leader (right): portrait, name, level, health. */
function banner(u: UnitVm | undefined, side: 'ally' | 'enemy'): HTMLElement | null {
  if (!u) return null;
  return el(
    'div',
    { class: `adventure-ui__banner is-${side}` },
    portrait(u, 'adventure-ui__banner-art'),
    el(
      'div',
      { class: 'adventure-ui__banner-text' },
      el('b', {}, ...u.elements.map((e) => elementIcon(e)), el('span', { text: u.name }), u.level !== null ? el('small', { text: t(vi.adventure.battle.level, { level: u.level }) }) : null),
      u.honor ? el('small', { class: 'adventure-ui__banner-honor', text: `«${u.honor}»` }) : null,
      el('span', { class: 'adventure-ui__banner-hp' }, bar(u.hpPercent, 'hp', u.hpText), el('small', { text: u.hpText })),
    ),
    u.classId ? classIcon(u.classId, 'adventure-ui__banner-class') : null,
  );
}

function teamList(vm: BattleVm): HTMLElement {
  return el(
    'div',
    { class: 'adventure-ui__teamlist' },
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
            el('b', {}, el('span', { text: u.name }), ...u.elements.map((e) => elementIcon(e))),
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
    a.mp > 0 ? el('small', { class: 'adventure-ui__card-mp', text: `${a.mp} MP` }) : null,
    el('small', { class: 'adventure-ui__card-desc', text: off ? (a.reason ?? '') : a.detail }),
  );
}

/** The effects on the one acting (or on the leader of our team between turns). */
function effects(vm: BattleVm): HTMLElement | null {
  const u = vm.units.find((x) => x.id === vm.actor) ?? vm.units.find((x) => x.side === 'ally' && !x.down);
  if (!u) return null;
  return el(
    'aside',
    { class: 'adventure-ui__effects' },
    el('b', { class: 'adventure-ui__effects-title', text: t(vi.adventure.battle.effectsOn, { name: u.name }) }),
    u.statuses.length === 0
      ? el('small', { class: 'adventure-ui__note', text: vi.adventure.battle.effectsNone })
      : el(
          'ul',
          {},
          ...u.statuses.map((s) =>
            el('li', { class: s.good ? 'is-good' : 'is-bad', attrs: { title: s.desc } }, statusChip(s), el('span', {}, el('b', { text: s.name }), el('small', { text: t(vi.adventure.battle.turnsLeft, { turns: s.turns }) }))),
          ),
        ),
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
  const cards = vm.actions.filter((a) => a.kind === 'skill' || a.kind === 'ultimate');
  const items = vm.actions.filter((a) => a.kind === 'item');
  const one = (kind: BattleActionVm['kind']) => vm.actions.find((a) => a.kind === kind);
  const attack = one('attack');
  const small = (a: BattleActionVm | undefined) =>
    a
      ? el(
          'button',
          { class: 'adventure-ui__small', attrs: { type: 'button', ...(a.reason ? { disabled: '', title: a.reason } : { title: a.detail || a.label }) }, on: { click: () => choose(a, vm, ctx) } },
          iconOf(a.art, a.label),
          el('span', { text: a.label }),
        )
      : null;
  const enemies = vm.units.filter((u) => u.side === 'enemy');
  const leader = enemies.find((u) => u.boss && !u.down) ?? enemies.find((u) => !u.down) ?? enemies[0];
  const allyBanner = actor?.side === 'ally' ? actor : vm.units.find((u) => u.side === 'ally' && !u.down);
  const nowCount = vm.order.filter((o) => !o.next).length;
  const allies = vm.units.filter((u) => u.side === 'ally');
  const spots = new Map<string, Spot>([...allies.map((u, i) => [u.id, spotOf('ally', i)] as const), ...enemies.map((u, i) => [u.id, spotOf('enemy', i)] as const)]);
  const motionOf = (u: UnitVm) => unitMotion(u.id, u.side, step.motion, step.elapsed, u.down);
  const shaking = live && step.fx.shake && step.elapsed < step.fx.shakeAt + SHAKE_MS;
  return el(
    'div',
    {
      class: `adventure-ui__battle${state.fast ? ' is-fast' : ''}${shaking ? ' is-shake' : ''}`,
      attrs: shaking ? { style: `--shake-delay:${Math.round(step.fx.shakeAt - step.elapsed)}ms` } : {},
    },
    el(
      'div',
      { class: 'adventure-ui__btop' },
      banner(allyBanner, 'ally'),
      el(
        'div',
        { class: 'adventure-ui__order', attrs: { 'aria-label': vi.adventure.battle.order } },
        vm.riftFloor !== null ? el('span', { class: 'adventure-ui__round-pill is-rift', text: t(vi.adventure.engage.rift.floor, { floor: vm.riftFloor }) }) : null,
        el('span', { class: 'adventure-ui__round-pill', text: t(vi.adventure.battle.round, { round: vm.round }) }),
        vm.affix ? el('span', { class: 'adventure-ui__round-pill is-affix', attrs: { title: vm.affix.name } }, iconOf(vm.affix.art, vm.affix.name), el('span', { text: vm.affix.name })) : null,
        vm.escapeIn !== null ? el('span', { class: 'adventure-ui__round-pill is-escape', text: t(vi.adventure.engage.escapeIn, { rounds: vm.escapeIn }) }) : null,
        el(
          'div',
          { class: 'adventure-ui__turns' },
          ...vm.order.flatMap((o, i) => [
            i === nowCount && i > 0 ? el('span', { class: 'adventure-ui__turn-sep', attrs: { 'aria-hidden': 'true' } }) : null,
            el('span', { class: `adventure-ui__turn is-${o.side}${o.next ? ' is-next' : ''}${i === 0 ? ' is-now' : ''}`, attrs: { title: o.name } }, portrait(o, 'adventure-ui__turn-art')),
          ]),
        ),
      ),
      banner(leader, 'enemy'),
    ),
    el(
      'div',
      { class: 'adventure-ui__field' },
      ...allies.map((u, i) => unitOnField(u, i, vm, ctx, motionOf(u), floatersOf(u.id), step.elapsed)),
      ...enemies.map((u, i) => unitOnField(u, i, vm, ctx, motionOf(u), floatersOf(u.id), step.elapsed)),
      ...fieldEffects(step.motion, spots, step.elapsed),
      fxBanner ? bannerEl(fxBanner, vm.units.find((u) => u.id === fxBanner.unit)?.art ?? null, step.elapsed) : null,
    ),
    el('div', { class: 'adventure-ui__bleft' }, roundButton(ACTION_ART.skill, vi.adventure.battle.log.title, state.log, () => ((state.log = !state.log), ctx.rerender()))),
    el(
      'div',
      { class: 'adventure-ui__bright' },
      roundButton(ACTION_ART.auto, vi.adventure.battle.auto, state.auto, () => ((state.auto = !state.auto), ctx.rerender())),
      roundButton(ACTION_ART.speed, vi.adventure.battle.speed, state.fast, () => ((state.fast = !state.fast), ctx.rerender())),
      effects(vm),
    ),
    state.log ? el('ol', { class: 'adventure-ui__log', attrs: { 'aria-live': 'polite' } }, ...vm.log.slice(-40).map((line) => el('li', { text: line }))) : null,
    teamList(vm),
    el(
      'div',
      { class: 'adventure-ui__actions' },
      state.aim
        ? el(
            'div',
            { class: 'adventure-ui__aim' },
            el('b', { text: `${state.aim.action.label}: ${vi.adventure.battle.pickTarget}` }),
            el('button', { class: 'adventure-ui__small', text: vi.adventure.back, attrs: { type: 'button' }, on: { click: () => ((state.aim = null), ctx.rerender()) } }),
          )
        : mine
          ? el(
              'div',
              { class: 'adventure-ui__deck' },
              el(
                'div',
                { class: 'adventure-ui__deck-head' },
                el('b', { text: t(vi.adventure.battle.yourTurn, { name: actor?.name ?? '' }) }),
                small(one('guard')),
                items.length > 0
                  ? el(
                      'button',
                      { class: `adventure-ui__small${state.menu === 'items' ? ' is-on' : ''}`, attrs: { type: 'button', 'aria-pressed': String(state.menu === 'items') }, on: { click: () => ((state.menu = state.menu === 'items' ? null : 'items'), ctx.rerender()) } },
                      iconOf(items[0]!.art, vi.adventure.battle.items),
                      el('span', { text: vi.adventure.battle.items }),
                    )
                  : null,
                small(one('flee')),
              ),
              el('div', { class: 'adventure-ui__cards', attrs: { 'data-keep-scroll': 'cards' } }, ...(state.menu === 'items' ? items : cards).map((a) => actionCard(a, vm, ctx))),
            )
          : el('b', { class: 'adventure-ui__waiting', text: vi.adventure.battle.waitingFoes }),
    ),
    attack && mine && !state.aim
      ? el(
          'button',
          { class: 'adventure-ui__attack', attrs: { type: 'button', title: attack.detail }, on: { click: () => choose(attack, vm, ctx) } },
          iconOf(attack.art, attack.label),
          el('span', { text: attack.label }),
        )
      : null,
  );
}
