// The battle screen (spec V2 §8.5): the two rows of units, the action bar (attack, skills, items, aim), Auto and x2, the log.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { battleAct } from '../logic/actions/run';
import { adventureOf } from '../logic/save/lens';
import { actionButton } from './adventureDialogs';
import { battleVm, type BattleActionVm, type BattleVm, type UnitVm } from './battleVm';
import { bar, toggle, type ViewCtx } from './viewKit';
import { ELEMENT_ICON } from './vmKit';

function act(action: BattleActionVm, ctx: ViewCtx, target?: string) {
  ctx.state.aim = null;
  ctx.state.menu = null;
  const base =
    action.kind === 'attack'
      ? ({ kind: 'attack', target: target ?? '' } as const)
      : action.kind === 'skill'
        ? ({ kind: 'skill', skillId: action.id, ...(target ? { target } : {}) } as const)
        : ({ kind: 'item', itemId: action.id, ...(target ? { target } : {}) } as const);
  ctx.dispatch((ww, c) => battleAct(ww, { action: base }, c));
}

function choose(action: BattleActionVm, vm: BattleVm, ctx: ViewCtx) {
  if (action.reason) return;
  if (action.aim === null) return act(action, ctx);
  const side = action.aim;
  const options = vm.units.filter((u) => u.side === side && !u.down);
  if (options.length === 1) return act(action, ctx, options[0]!.id);
  ctx.state.aim = { action, side };
  ctx.rerender();
}

function unitCard(u: UnitVm, ctx: ViewCtx): HTMLElement {
  const aim = ctx.state.aim;
  const aimable = !!aim && aim.side === u.side && !u.down;
  return el(
    'button',
    {
      class: `adventure-ui__unit adventure-ui__unit--${u.side}${u.active ? ' is-active' : ''}${u.down ? ' is-down' : ''}${aimable ? ' is-aimable' : ''}${u.boss ? ' is-boss' : ''}`,
      attrs: { type: 'button', ...(aimable ? {} : { disabled: '' }), 'aria-label': u.name },
      on: { click: () => aimable && aim && act(aim.action, ctx, u.id) },
    },
    art(u.art, 'adventure-ui__unit-art', u.name) ?? el('span', { class: 'adventure-ui__unit-art', text: u.side === 'ally' ? '🐷' : '👾' }),
    el('b', { text: `${ELEMENT_ICON[u.element]} ${u.name}` }),
    bar(u.hpPercent, 'hp'),
    el('small', { text: u.down ? vi.adventure.down : u.hpText }),
    u.side === 'ally' ? el('small', { class: 'adventure-ui__pips', text: '⚡'.repeat(Math.min(u.energy, 10)) }) : null,
    u.statuses.length > 0 ? el('small', { class: 'adventure-ui__statuses', text: u.statuses.map((s) => `${s.icon}${s.turns}`).join(' ') }) : null,
  );
}

export function renderBattle(ctx: ViewCtx): HTMLElement {
  const { state } = ctx;
  const vm = battleVm(ctx.world, adventureOf(ctx.world).run!)!;
  const mine = vm.actor !== null && vm.units.find((u) => u.id === vm.actor)?.side === 'ally';
  const list = state.menu === 'skills' ? vm.actions.filter((a) => a.kind === 'skill') : state.menu === 'items' ? vm.actions.filter((a) => a.kind === 'item') : [];
  const attack = vm.actions.find((a) => a.kind === 'attack');
  const hasItems = vm.actions.some((a) => a.kind === 'item');
  const flip = (menu: 'skills' | 'items') => () => {
    state.menu = state.menu === menu ? null : menu;
    ctx.rerender();
  };
  return el(
    'div',
    { class: `adventure-ui__battle${state.fast ? ' is-fast' : ''}` },
    el('div', { class: 'adventure-ui__round', text: t(vi.adventure.round, { round: vm.round }) }),
    el('div', { class: 'adventure-ui__row adventure-ui__row--enemy' }, ...vm.units.filter((u) => u.side === 'enemy').map((u) => unitCard(u, ctx))),
    el('div', { class: 'adventure-ui__row adventure-ui__row--ally' }, ...vm.units.filter((u) => u.side === 'ally').map((u) => unitCard(u, ctx))),
    el(
      'div',
      { class: 'adventure-ui__actions' },
      state.aim
        ? el(
            'div',
            {},
            el('b', { text: `${state.aim.action.label}: ${vi.adventure.pickTarget}` }),
            toggle(vi.adventure.back, false, () => {
              state.aim = null;
              ctx.rerender();
            }),
          )
        : mine
          ? el(
              'div',
              { class: 'adventure-ui__action-bar' },
              el('b', { text: t(vi.adventure.yourTurn, { name: vm.units.find((u) => u.id === vm.actor)?.name ?? '' }) }),
              attack ? actionButton({ label: attack.label, reason: attack.reason }, () => choose(attack, vm, ctx)) : null,
              toggle(vi.adventure.skillsMenu, state.menu === 'skills', flip('skills')),
              hasItems ? toggle(vi.adventure.itemsMenu, state.menu === 'items', flip('items')) : null,
            )
          : el('b', { text: vi.adventure.waitingFoes }),
      list.length > 0 && !state.aim
        ? el('div', { class: 'adventure-ui__menu' }, ...list.map((a) => el('div', { class: 'adventure-ui__menu-row' }, actionButton({ label: a.label, reason: a.reason }, () => choose(a, vm, ctx)), el('small', { text: a.detail }))))
        : null,
      el(
        'div',
        { class: 'adventure-ui__modes' },
        toggle(state.auto ? vi.adventure.autoOn : vi.adventure.auto, state.auto, () => {
          state.auto = !state.auto;
          ctx.rerender();
        }),
        toggle(state.fast ? vi.adventure.speedOn : vi.adventure.speed, state.fast, () => {
          state.fast = !state.fast;
          ctx.rerender();
        }),
      ),
    ),
    el('ol', { class: 'adventure-ui__log', attrs: { 'aria-live': 'polite' } }, ...vm.log.map((line) => el('li', { text: line }))),
  );
}

