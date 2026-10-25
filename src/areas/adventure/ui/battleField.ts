// The battle field (adventure-big-update-1 §1, §3, §9): where each unit stands (ours left facing right, theirs right facing left),
// a unit with its nameplate (element, name, level, health, MP and the way to the next level, statuses, the enemies' intent) and its
// target marker while an action is being aimed, the big marker over a whole side, and the turn bar at the very top.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import type { Run } from '../logic/state';
import { floaterEl } from './battleFxView';
import type { FloaterVm } from './battleFloaters';
import { type BattleActionVm, type BattleVm, type UnitVm, effectOn } from './battleVm';
import { type ViewCtx, bar, elementIcon, iconOf, statusChip } from './viewKit';
import { ACTION_ART } from './vmKit';
import { act } from './battleCommand';
import { mirrored } from './motionProfiles';


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

export const portrait = (u: { art: string; name: string }, cls: string) =>
  art(u.art, cls, u.name) ?? el('span', { class: cls });

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
function marker(
  label: string,
  onClick: () => void,
  cls = '',
  extra: HTMLElement | null = null,
  style = '',
): HTMLElement {
  return el(
    'button',
    {
      class: `adv-reticle${cls}`,
      attrs: { type: 'button', 'aria-label': label, title: label, ...(style ? { style } : {}) },
      on: { click: (e) => (e.stopPropagation(), onClick()) },
    },
    el('span', { class: 'adv-reticle__ring', attrs: { 'aria-hidden': 'true' } }),
    el('span', { class: 'adv-reticle__x', attrs: { 'aria-hidden': 'true' } }),
    extra,
  );
}

export function unitOnField(
  u: UnitVm,
  index: number,
  vm: BattleVm,
  ctx: ViewCtx,
  run: Run,
  floaters: readonly FloaterVm[],
  elapsed: number,
  falling: boolean,
): HTMLElement {
  const aim = ctx.state.aim;
  const can = !!aim && aimable(u, aim.action, vm.actor);
  const effect =
    can && aim && vm.actor && aim.action.aim !== 'self'
      ? effectOn(run.battle!, vm.actor, aim.action.element, aim.action.category, u.id)
      : null;
  const spot = spotOf(u.side, index);
  // A unit knocked out in this step stands until its blow lands, then falls (the stage plays the fall).
  const down = u.down && !falling;
  return el(
    'div',
    {
      class: `adventure-ui__unit adventure-ui__unit--${u.side}${u.active ? ' is-active' : ''}${down ? ' is-down' : ''}${can ? ' is-aimable' : ''}${u.boss ? ' is-boss' : ''}${u.elite ? ' is-elite' : ''}${u.corrupted ? ' is-corrupted' : ''}${mirrored(u.art, u.side) ? ' is-mirrored' : ''}`,
      attrs: {
        role: 'group',
        style: `left:${spot.x}%;top:${spot.y}%;z-index:${Math.round(spot.y)}`,
        'aria-label': `${u.name} ${u.hpText}`,
        title: u.intent ? `${u.name}: ${u.intent}` : u.name,
        'data-unit': u.id,
        'data-side': u.side,
      },
    },
    el(
      'span',
      { class: 'adventure-ui__plate' },
      el(
        'span',
        { class: 'adventure-ui__plate-name' },
        ...u.elements.map((e) => elementIcon(e)),
        el('b', { text: u.name }),
        u.level !== null
          ? el('small', {
              class: 'adventure-ui__plate-lv',
              text: t(vi.adventure.battle.level, { level: u.level }),
            })
          : null,
        u.guarding ? iconOf(ACTION_ART.guard, vi.adventure.battle.guard, 'is-guard') : null,
      ),
      el(
        'span',
        { class: 'adventure-ui__plate-hp' },
        bar(u.hpPercent, 'hp', u.hpText),
        el('small', { text: u.hpText }),
      ),
      u.side === 'ally'
        ? el(
            'span',
            { class: 'adventure-ui__plate-sub' },
            bar(u.mpPercent, 'mp', u.mpText),
            u.expPercent !== null ? bar(u.expPercent, 'exp') : null,
          )
        : null,
      u.statuses.length > 0
        ? el('span', { class: 'adventure-ui__statuses' }, ...u.statuses.map(statusChip))
        : null,
      u.intentArt
        ? el(
            'span',
            { class: 'adventure-ui__intent', attrs: { title: u.intent ?? '' } },
            iconOf(u.intentArt, u.intent ?? ''),
          )
        : null,
    ),
    el(
      'span',
      { class: 'adventure-ui__body', attrs: { 'data-body': u.id } },
      el(
        'span',
        { class: 'adventure-ui__idle' },
        // The crying face of a hit (`<art>_hurt` in the manifest, adventure-big-update-1 §7) shows over the picture while the blow lands.
        el('span', { class: 'adventure-ui__face' }, portrait(u, 'adventure-ui__unit-art'), art(`${u.art}_hurt`, 'adventure-ui__unit-art adventure-ui__unit-hurt')),
      ),
      can && aim
        ? marker(
            `${aim.action.label} → ${u.name}`,
            () => act(aim.action, ctx, aim.action.aim === 'self' ? undefined : u.id),
            '',
            effect
              ? el('span', {
                  class: `adventure-ui__eff is-${effect.tone}`,
                  text: effect.reaction
                    ? `${effect.label} · ${t(vi.adventure.battle.reacts, { reaction: effect.reaction })}`
                    : effect.label,
                })
              : null,
          )
        : null,
    ),
    floaters.length > 0
      ? el('span', { class: 'adventure-ui__floats' }, ...floaters.map((f) => floaterEl(f, elapsed)))
      : null,
  );
}

/** One big marker over a whole side (a skill that hits every enemy, or every ally). */
export function sideMarker(
  side: 'ally' | 'enemy',
  units: readonly UnitVm[],
  action: BattleActionVm,
  ctx: ViewCtx,
): HTMLElement | null {
  const standing = units.map((u, i) => ({ u, s: spotOf(side, i) })).filter((x) => !x.u.down);
  if (standing.length === 0) return null;
  const xs = standing.map((x) => x.s.x);
  const ys = standing.map((x) => x.s.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2 - 12;
  const w = Math.max(...xs) - Math.min(...xs) + 22;
  const h = Math.max(...ys) - Math.min(...ys) + 34;
  const label = `${action.label} → ${vi.adventure.battle.aimAll}`;
  return marker(
    label,
    () => act(action, ctx),
    ` adv-reticle--side is-${side}`,
    el('span', { class: 'adv-reticle__label', text: vi.adventure.battle.aimAll }),
    `left:${cx}%;top:${cy}%;width:${w}%;height:${h}%`,
  );
}

/** The turn bar: the round, the one acting in the lit slot at the head, then the ones after it (the next round past the arrow). */
export function turnBar(vm: BattleVm): HTMLElement {
  const nowCount = vm.order.filter((o) => !o.next).length;
  const [head, ...rest] = vm.order;
  return el(
    'div',
    { class: 'adventure-ui__turnbar', attrs: { 'aria-label': vi.adventure.battle.order } },
    el(
      'span',
      { class: 'adventure-ui__pills' },
      vm.riftFloor !== null
        ? el('span', {
            class: 'adventure-ui__round-pill is-rift',
            text: t(vi.adventure.engage.rift.floor, { floor: vm.riftFloor }),
          })
        : null,
      el('span', {
        class: 'adventure-ui__round-pill',
        text: t(vi.adventure.battle.round, { round: vm.round }),
      }),
      vm.affix
        ? el(
            'span',
            { class: 'adventure-ui__round-pill is-affix', attrs: { title: vm.affix.name } },
            iconOf(vm.affix.art, vm.affix.name),
            el('span', { text: vm.affix.name }),
          )
        : null,
      vm.escapeIn !== null
        ? el('span', {
            class: 'adventure-ui__round-pill is-escape',
            text: t(vi.adventure.engage.escapeIn, { rounds: vm.escapeIn }),
          })
        : null,
    ),
    el(
      'div',
      { class: 'adventure-ui__turns' },
      el('span', { class: 'adventure-ui__turn-slot', attrs: { 'aria-hidden': 'true' } }),
      ...[head, ...rest].flatMap((o, i) =>
        o
          ? [
              i === nowCount && i > 0
                ? el('span', { class: 'adventure-ui__turn-sep', attrs: { 'aria-hidden': 'true' } })
                : null,
              el(
                'span',
                {
                  class: `adventure-ui__turn is-${o.side}${o.next ? ' is-next' : ''}${i === 0 ? ' is-now' : ''}`,
                  attrs: { title: o.name, 'data-turn': `${o.id}:${o.next ? 'n' : 'c'}` },
                },
                portrait(o, 'adventure-ui__turn-art'),
              ),
            ]
          : [],
      ),
    ),
  );
}
