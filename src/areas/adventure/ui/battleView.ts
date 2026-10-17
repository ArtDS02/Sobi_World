// The battle screen (spec §15.4–15.5, §17): the turn order, the two rows of units (HP / MP / Rage, statuses with their meaning, the
// enemies' intents), the action bar (attack, skills, Ultimate, Defend, items, flee), the effectiveness label on each target while
// aiming, Auto and x2, the log.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { battleAct, flee } from '../logic/actions/battle';
import { adventureOf } from '../logic/save/lens';
import { unitEffects, type HpMemory, type UnitFx } from './battleFx';
import { battleVm, effectOn, type BattleActionVm, type BattleVm, type UnitVm } from './battleVm';
import { actionButton, bar, toggle, type ViewCtx } from './viewKit';

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

const memory: HpMemory = new Map();

function unitCard(u: UnitVm, vm: BattleVm, ctx: ViewCtx, fx?: UnitFx): HTMLElement {
  const aim = ctx.state.aim;
  const aimable = !!aim && aim.side === u.side && !u.down;
  const run = adventureOf(ctx.world).run!;
  const effect = aimable && aim && vm.actor ? effectOn(run.battle!, vm.actor, aim.action.element, aim.action.category, u.id) : null;
  return el(
    'button',
    {
      class: `adventure-ui__unit adventure-ui__unit--${u.side}${u.active ? ' is-active' : ''}${u.down ? ' is-down' : ''}${aimable ? ' is-aimable' : ''}${u.boss ? ' is-boss' : ''}${u.elite ? ' is-elite' : ''}${u.corrupted ? ' is-corrupted' : ''}${fx ? ` is-${fx}` : ''}`,
      attrs: { type: 'button', ...(aimable ? {} : { disabled: '' }), 'aria-label': u.name },
      on: { click: () => aimable && aim && act(aim.action, ctx, u.id) },
    },
    u.intent ? el('span', { class: 'adventure-ui__intent', text: u.intent }) : null,
    effect ? el('span', { class: `adventure-ui__eff is-${effect.tone}`, text: effect.reaction ? `${effect.label} · ${t(vi.adventure.battle.reacts, { reaction: effect.reaction })}` : effect.label }) : null,
    art(u.art, 'adventure-ui__unit-art', u.name) ?? el('span', { class: 'adventure-ui__unit-art', text: u.side === 'ally' ? '🐷' : '👾' }),
    el('b', { text: `${u.icons} ${u.name}${u.guarding ? ' 🛡' : ''}` }),
    bar(u.hpPercent, 'hp', u.hpText),
    el('small', { text: u.down ? vi.adventure.explore.down : u.hpText }),
    u.side === 'ally' ? bar(u.mpPercent, 'mp', u.mpText) : null,
    u.side === 'ally' ? bar(u.ragePercent, `rage${u.rageFull ? ' is-full' : ''}`) : null,
    u.statuses.length > 0
      ? el('span', { class: 'adventure-ui__statuses' }, ...u.statuses.map((s) => el('i', { class: s.good ? 'is-good' : 'is-bad', text: `${s.icon}${s.stacks > 1 ? `×${s.stacks}` : ''}${s.turns}`, attrs: { title: `${s.name}: ${s.desc}` } })))
      : null,
  );
}

export function renderBattle(ctx: ViewCtx): HTMLElement {
  const { state } = ctx;
  const vm = battleVm(ctx.world, adventureOf(ctx.world).run!)!;
  const fx = unitEffects(memory, vm.units);
  const mine = vm.actor !== null && vm.units.find((u) => u.id === vm.actor)?.side === 'ally';
  const skills = vm.actions.filter((a) => a.kind === 'skill');
  const items = vm.actions.filter((a) => a.kind === 'item');
  const list = state.menu === 'skills' ? skills : state.menu === 'items' ? items : [];
  const one = (kind: BattleActionVm['kind']) => vm.actions.find((a) => a.kind === kind);
  const flip = (menu: 'skills' | 'items') => () => {
    state.menu = state.menu === menu ? null : menu;
    ctx.rerender();
  };
  const button = (a: BattleActionVm | undefined, variant = '') => (a ? actionButton({ label: a.label, reason: a.reason }, () => choose(a, vm, ctx), variant) : null);
  return el(
    'div',
    { class: `adventure-ui__battle${state.fast ? ' is-fast' : ''}` },
    el(
      'div',
      { class: 'adventure-ui__order', attrs: { 'aria-label': vi.adventure.battle.order } },
      el('small', { text: t(vi.adventure.battle.round, { round: vm.round }) }),
      ...vm.order.map((o, i) => el('span', { class: `adventure-ui__turn is-${o.side}${o.next ? ' is-next' : ''}${i === 0 ? ' is-now' : ''}`, text: o.name })),
    ),
    el('div', { class: 'adventure-ui__row adventure-ui__row--enemy' }, ...vm.units.filter((u) => u.side === 'enemy').map((u) => unitCard(u, vm, ctx, fx.get(u.id)))),
    el('div', { class: 'adventure-ui__row adventure-ui__row--ally' }, ...vm.units.filter((u) => u.side === 'ally').map((u) => unitCard(u, vm, ctx, fx.get(u.id)))),
    el(
      'div',
      { class: 'adventure-ui__actions' },
      state.aim
        ? el('div', {}, el('b', { text: `${state.aim.action.label}: ${vi.adventure.battle.pickTarget}` }), toggle(vi.adventure.back, false, () => ((state.aim = null), ctx.rerender())))
        : mine
          ? el(
              'div',
              { class: 'adventure-ui__action-bar' },
              el('b', { text: t(vi.adventure.battle.yourTurn, { name: vm.units.find((u) => u.id === vm.actor)?.name ?? '' }) }),
              button(one('attack')),
              toggle(vi.adventure.battle.skills, state.menu === 'skills', flip('skills')),
              button(one('ultimate'), 'c-button--ultimate'),
              button(one('guard'), 'c-button--ghost'),
              items.length > 0 ? toggle(vi.adventure.battle.items, state.menu === 'items', flip('items')) : null,
              button(one('flee'), 'c-button--ghost'),
            )
          : el('b', { text: vi.adventure.battle.waitingFoes }),
      list.length > 0 && !state.aim
        ? el('div', { class: 'adventure-ui__menu' }, ...list.map((a) => el('div', { class: 'adventure-ui__menu-row' }, actionButton({ label: a.label, reason: a.reason }, () => choose(a, vm, ctx)), el('small', { text: a.detail }))))
        : null,
      el(
        'div',
        { class: 'adventure-ui__modes' },
        toggle(state.auto ? vi.adventure.battle.autoOn : vi.adventure.battle.auto, state.auto, () => ((state.auto = !state.auto), ctx.rerender())),
        toggle(state.fast ? vi.adventure.battle.speedOn : vi.adventure.battle.speed, state.fast, () => ((state.fast = !state.fast), ctx.rerender())),
      ),
    ),
    el('ol', { class: 'adventure-ui__log', attrs: { 'aria-live': 'polite' } }, ...vm.log.map((line) => el('li', { text: line }))),
  );
}
