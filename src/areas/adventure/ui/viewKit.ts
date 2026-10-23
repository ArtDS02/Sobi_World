// What the Adventure's screens share: the little local state they remember between two renders, what the controller hands them (the
// world, the roster, a way to act), and small DOM pieces (a bar, a toggle, a button that says why it is off, the icons of elements,
// classes, skills and statuses through the manifest, with a letter badge while an icon has no art).
import type { CreatureGift, GiftResult, RosterEntry } from '../../../core/area-registry/registry';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext } from '../../../core/types';
import type { Element } from '../../../systems/combat/types';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import type { ClassId } from '../logic/config/content';
import type { BattleActionVm, StatusVm } from './battleVm';
import { ACTION_ART, classArt, className, elementArt, elementName, skillArt, type AdventureRun, type ButtonVm } from './vmKit';

/** What the screens remember between two renders. */
export interface UiState {
  zoneId: string;
  /** Where the next trip starts (an area with a lit portal); null = the zone's entrance. */
  startMap: string | null;
  selected: string[];
  /** Rations the player chose to carry (item ids). */
  prep: string[];
  auto: boolean;
  fast: boolean;
  menu: 'skills' | 'items' | null;
  /** An action waiting for the player to choose who it is aimed at. */
  aim: { action: BattleActionVm; side: 'enemy' | 'ally' } | null;
  /** The thing in reach on the map (the scene says). */
  focus: string | null;
  showMap: boolean;
  /** Camp: the element the companions are filtered by (null = all) and the name searched for. */
  filter: Element | null;
  search: string;
  /** Camp: the legend picture is open. Battle: the log is open. */
  legend: boolean;
  log: boolean;
}

export interface ViewCtx {
  world: WorldSave;
  now: number;
  roster: readonly RosterEntry[];
  state: UiState;
  /** Draws the screens again (the local state changed). */
  rerender(): void;
  dispatch(run: AdventureRun): void;
  /** Runs `first`, then `then` (the summary's "take the reward"). */
  dispatchThen(first: AdventureRun, then: AdventureRun): void;
  give: (world: WorldSave, gift: CreatureGift, ctx: ActionContext) => GiftResult;
  openSheet(key: string): void;
  openPortal(): void;
  /** The key bound to "interact" (for the hint). */
  interactKey(): string;
}

export const bar = (percent: number, kind: string, label?: string) =>
  el(
    'span',
    { class: `c-bar adventure-ui__meter adventure-ui__meter--${kind}`, attrs: { role: 'progressbar', 'aria-valuenow': String(percent), ...(label ? { 'aria-label': label } : {}) } },
    el('span', { class: 'c-bar__fill', attrs: { style: `width: ${Math.max(0, Math.min(100, percent))}%` } }),
  );

export const toggle = (label: string, on: boolean, click: () => void) =>
  el('button', { class: `c-button c-button--ghost${on ? ' is-on' : ''}`, text: label, attrs: { type: 'button', 'aria-pressed': String(on) }, on: { click } });

/** A button that always says why it is off. */
export function actionButton(vm: ButtonVm, onClick: () => void, variant = ''): HTMLElement {
  const off = vm.reason !== null;
  return el(
    'span',
    { class: 'c-action' },
    el('button', {
      class: `c-button ${variant}`.trim(),
      text: vm.label,
      attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true', title: vm.reason ?? '' } : {}) },
      on: { click: () => !off && onClick() },
    }),
    off ? el('span', { class: 'c-action__reason', text: vm.reason ?? '' }) : null,
  );
}

/** A manifest icon, or a round letter badge while it has no art. */
export function iconOf(id: string, label: string, cls = ''): HTMLElement {
  return (
    art(id, `adv-icon ${cls}`.trim(), label) ??
    el('span', { class: `adv-icon is-missing ${cls}`.trim(), text: label.slice(0, 1), attrs: { role: 'img', 'aria-label': label, title: label } })
  );
}

export const elementIcon = (e: Element, cls = ''): HTMLElement => iconOf(elementArt(e), elementName(e), `adv-icon--elem ${cls}`);
export const classIcon = (id: ClassId, cls = ''): HTMLElement => iconOf(classArt(id), className(id), `adv-icon--class ${cls}`);

/** A skill's own icon; without art, its element's badge (or the plain skill icon). */
export function skillIcon(skillId: string, element: Element | null, name: string, cls = ''): HTMLElement {
  return art(skillArt(skillId), `adv-icon adv-icon--skill ${cls}`.trim(), name) ?? (element ? elementIcon(element, `adv-icon--skill ${cls}`) : iconOf(ACTION_ART.skill, name, `adv-icon--skill ${cls}`));
}

/** A status on a unit: its badge (a raised / lowered stat shows the stat's badge and an arrow), the turns left as a corner number. */
export function statusChip(s: StatusVm): HTMLElement {
  return el(
    'span',
    { class: `adv-status ${s.good ? 'is-good' : 'is-bad'}`, attrs: { title: `${s.name}: ${s.desc}` } },
    iconOf(s.art, s.name),
    s.arrow ? el('i', { class: `adv-status__arrow is-${s.arrow}`, attrs: { 'aria-hidden': 'true' } }) : null,
    el('small', { text: `${s.stacks > 1 ? `×${s.stacks} ` : ''}${s.turns}` }),
  );
}

/** Keeps the horizontal scroll of the rows marked `data-keep-scroll` across a redraw (the markup is replaced). */
export function keepScroll(host: HTMLElement, redraw: () => void): void {
  const before = new Map([...host.querySelectorAll<HTMLElement>('[data-keep-scroll]')].map((n) => [n.dataset.keepScroll!, n.scrollLeft]));
  redraw();
  for (const n of host.querySelectorAll<HTMLElement>('[data-keep-scroll]')) {
    const x = before.get(n.dataset.keepScroll!);
    if (x) n.scrollLeft = x;
  }
}

/** A round wooden button with a decorative icon and its words under it (the map HUD, the battle's Auto / x2). */
export function roundButton(id: string, label: string, on: boolean, click: () => void): HTMLElement {
  return el(
    'button',
    { class: `adv-round${on ? ' is-on' : ''}`, attrs: { type: 'button', 'aria-pressed': String(on) }, on: { click } },
    art(id, 'adv-icon') ?? el('span', { class: 'adv-icon is-missing', text: label.slice(0, 1), attrs: { 'aria-hidden': 'true' } }),
    el('small', { text: label }),
  );
}
