// The battle's command dock (adventure-big-update-1 §2): the team bottom left, then for the one acting three tabs — the main skills
// (its line's own and the Ultimate), the class skills, the items — whose list opens only when a tab is clicked, Defend and Flee.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { el } from '../../../ui/dom';
import type { ActionTab, BattleActionVm, BattleVm, UnitVm } from './battleVm';
import { type ViewCtx, bar, iconOf, skillIcon } from './viewKit';
import { ACTION_ART } from './vmKit';
import { choose } from './battleCommand';
import { portrait } from './battleField';


/** The team, bottom left: portrait, name, level, health, MP, Rage and the way to the next level. */
export function party(vm: BattleVm): HTMLElement {
  return el(
    'div',
    { class: 'adventure-ui__party' },
    ...vm.units
      .filter((u) => u.side === 'ally')
      .map((u) =>
        el(
          'div',
          {
            class: `adventure-ui__teamrow${u.active ? ' is-active' : ''}${u.down ? ' is-down' : ''}`,
          },
          portrait(u, 'adventure-ui__teamrow-art'),
          el(
            'div',
            { class: 'adventure-ui__teamrow-text' },
            el(
              'b',
              {},
              el('span', { text: u.name }),
              u.level !== null
                ? el('small', { text: t(vi.adventure.battle.level, { level: u.level }) })
                : null,
            ),
            el(
              'span',
              { class: 'adventure-ui__teamrow-hp' },
              bar(u.hpPercent, 'hp', u.hpText),
              el('small', { text: u.down ? vi.adventure.explore.down : u.hpText }),
            ),
            el(
              'span',
              { class: 'adventure-ui__teamrow-sub' },
              bar(u.mpPercent, 'mp', u.mpText),
              bar(u.ragePercent, `rage${u.rageFull ? ' is-full' : ''}`),
            ),
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
      attrs: {
        type: 'button',
        ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}),
        title: off ? (a.reason ?? '') : a.detail,
      },
      on: { click: () => !off && choose(a, vm, ctx) },
    },
    a.kind === 'item'
      ? iconOf(a.art, a.label, 'adv-icon--skill')
      : skillIcon(a.id, a.element, a.label),
    el('b', { text: a.label }),
    a.mp > 0
      ? el('small', { class: 'adventure-ui__card-mp', text: `${a.mp} MP` })
      : a.kind === 'ultimate'
        ? el('small', {
            class: 'adventure-ui__card-mp is-rage',
            text: vi.adventure.battle.ultimate,
          })
        : null,
    el('small', { class: 'adventure-ui__card-desc', text: off ? (a.reason ?? '') : a.detail }),
  );
}

const TABS: readonly Exclude<ActionTab, 'basic'>[] = ['main', 'sub', 'item'];
const TAB_ART: Readonly<Record<Exclude<ActionTab, 'basic'>, string>> = {
  main: ACTION_ART.ultimate,
  sub: ACTION_ART.skill,
  item: 'ui_item_potion_healing',
};

/** The command dock of the one acting: who it is, the three tabs, Defend and Flee; the open tab's list floats above it. */
export function commands(vm: BattleVm, ctx: ViewCtx, actor: UnitVm | undefined): HTMLElement {
  const { state } = ctx;
  if (state.aim) {
    return el(
      'div',
      { class: 'adventure-ui__cmd is-aiming' },
      el('b', {
        class: 'adventure-ui__cmd-hint',
        text: t(vi.adventure.battle.aimHint, { skill: state.aim.action.label }),
      }),
      el('button', {
        class: 'adventure-ui__small',
        text: vi.adventure.battle.cancel,
        attrs: { type: 'button' },
        on: { click: () => ((state.aim = null), ctx.rerender()) },
      }),
    );
  }
  if (!actor || actor.side !== 'ally')
    return el(
      'div',
      { class: 'adventure-ui__cmd is-waiting' },
      el('b', { class: 'adventure-ui__waiting', text: vi.adventure.battle.waitingFoes }),
    );
  const one = (kind: BattleActionVm['kind']) => vm.actions.find((a) => a.kind === kind);
  const small = (a: BattleActionVm | undefined) =>
    a
      ? el(
          'button',
          {
            class: 'adventure-ui__small',
            attrs: {
              type: 'button',
              ...(a.reason ? { disabled: '', title: a.reason } : { title: a.detail || a.label }),
            },
            on: { click: () => choose(a, vm, ctx) },
          },
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
    el(
      'div',
      { class: 'adventure-ui__cmd-head' },
      el('b', { text: t(vi.adventure.battle.yourTurn, { name: actor.name }) }),
      el('small', { class: 'adventure-ui__cmd-mp', text: `${actor.mpText} MP` }),
    ),
    el(
      'div',
      { class: 'adventure-ui__tabs', attrs: { role: 'tablist' } },
      ...TABS.map(tabButton),
      el('span', { class: 'adventure-ui__tabs-gap' }),
      small(one('guard')),
      small(one('flee')),
    ),
    open
      ? el(
          'div',
          { class: `adventure-ui__panel is-${open}`, attrs: { role: 'tabpanel' } },
          el(
            'div',
            { class: 'adventure-ui__panel-head' },
            el('b', { text: vi.adventure.battle.tabs[open] }),
            el('button', {
              class: 'adventure-ui__panel-close',
              attrs: {
                type: 'button',
                'aria-label': vi.adventure.battle.close,
                title: vi.adventure.battle.close,
              },
              on: { click: () => ((state.menu = null), ctx.rerender()) },
            }),
          ),
          panelList.length > 0
            ? el(
                'div',
                { class: 'adventure-ui__cards', attrs: { 'data-keep-scroll': `cards-${open}` } },
                ...panelList.map((a) => actionCard(a, vm, ctx)),
              )
            : el('small', {
                class: 'adventure-ui__note',
                text: vi.adventure.battle.tabEmpty[open],
              }),
        )
      : null,
  );
}
