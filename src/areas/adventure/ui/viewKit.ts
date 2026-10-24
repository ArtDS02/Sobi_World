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
import type { ActionTab, BattleActionVm, StatusVm } from './battleVm';
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
  /** The open tab of the battle's command dock (its list shows only while a tab is open). */
  menu: ActionTab | null;
  /** An action waiting for the player to click a target marker. */
  aim: { action: BattleActionVm } | null;
  /** The thing in reach on the map (the scene says). */
  focus: string | null;
  showMap: boolean;
  /** Camp: the element the companions are filtered by (null = all) and the name searched for. */
  filter: Element | null;
  search: string;
  /** Camp: the legend picture is open. Battle: the log is open. */
  legend: boolean;
  log: boolean;
  /** Map: a weak normal group is beaten at once when touched (decision 039 §2). */
  quick: boolean;
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
  /** Local time minus UTC (ms): the game day the Rift's rule follows. */
  dayOffsetMs: number;
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

/**
 * Redraws `host` and slides every element marked `data-turn` from where it stood before to where it stands now (the turn bar: the
 * one acting slides into the lit slot at its head, the others follow); a newcomer slides in from the right. Without the Web Animations
 * API (tests) or with reduced motion it only redraws.
 */
export function slideTurns(host: HTMLElement, redraw: () => void, reduce: boolean): void {
  const before = new Map([...host.querySelectorAll<HTMLElement>('[data-turn]')].map((n) => [n.dataset.turn!, n.getBoundingClientRect().left]));
  redraw();
  if (reduce || before.size === 0) return;
  for (const n of host.querySelectorAll<HTMLElement>('[data-turn]')) {
    if (typeof n.animate !== 'function') return;
    const from = before.get(n.dataset.turn!);
    const now = n.getBoundingClientRect().left;
    if (from === undefined) n.animate([{ transform: 'translateX(2.5rem)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'ease-out' });
    else if (Math.abs(from - now) > 1) {
      const lit = n.classList.contains('is-now');
      n.animate(
        lit
          ? [{ transform: `translateX(${from - now}px) scale(0.8)` }, { transform: 'translateX(0) scale(1.18)', offset: 0.75 }, { transform: 'none' }]
          : [{ transform: `translateX(${from - now}px)` }, { transform: 'none' }],
        { duration: lit ? 460 : 380, easing: 'cubic-bezier(.2,.8,.3,1)' },
      );
    }
  }
}

/**
 * Lets every list marked `data-keep-scroll` (or `data-drag-scroll`) be dragged back and forth with the mouse or a pen, with a little
 * glide after letting go; touch scrolls natively. A drag never clicks what it started on. A vertical wheel over a list that only
 * scrolls sideways scrolls it sideways. Returns the way to stop.
 */
export function dragScroll(host: HTMLElement): () => void {
  const LISTS = '[data-keep-scroll], [data-drag-scroll]';
  let drag: { list: HTMLElement; x: number; y: number; left: number; top: number; moved: boolean; vx: number; vy: number; t: number; px: number; py: number } | null = null;
  let glide = 0;
  const scrolls = (n: HTMLElement) => n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1;
  const stopGlide = () => {
    if (glide) cancelAnimationFrame(glide);
    glide = 0;
  };
  const down = (ev: Event) => {
    const e = ev as PointerEvent;
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const list = e.target instanceof Element ? e.target.closest<HTMLElement>(LISTS) : null;
    if (!list || !host.contains(list) || !scrolls(list)) return;
    stopGlide();
    drag = { list, x: e.clientX, y: e.clientY, left: list.scrollLeft, top: list.scrollTop, moved: false, vx: 0, vy: 0, t: performance.now(), px: e.clientX, py: e.clientY };
  };
  const move = (ev: Event) => {
    const e = ev as PointerEvent;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      drag.list.classList.add('is-dragging');
    }
    e.preventDefault();
    drag.list.scrollLeft = drag.left - dx;
    drag.list.scrollTop = drag.top - dy;
    const now = performance.now();
    const dt = Math.max(1, now - drag.t);
    drag.vx = (e.clientX - drag.px) / dt;
    drag.vy = (e.clientY - drag.py) / dt;
    drag.t = now;
    drag.px = e.clientX;
    drag.py = e.clientY;
  };
  const up = () => {
    const d = drag;
    drag = null;
    if (!d?.moved) return;
    d.list.classList.remove('is-dragging');
    // The click that ends a drag is not a click on what is under the pointer.
    const eat = (c: Event) => {
      c.stopPropagation();
      c.preventDefault();
    };
    window.addEventListener('click', eat, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', eat, { capture: true }), 0);
    let vx = d.vx * 16;
    let vy = d.vy * 16;
    const step = () => {
      vx *= 0.92;
      vy *= 0.92;
      d.list.scrollLeft -= vx;
      d.list.scrollTop -= vy;
      glide = Math.abs(vx) + Math.abs(vy) > 0.5 && d.list.isConnected ? requestAnimationFrame(step) : 0;
    };
    if (Math.abs(vx) + Math.abs(vy) > 1) glide = requestAnimationFrame(step);
  };
  const wheel = (ev: Event) => {
    const e = ev as WheelEvent;
    const list = e.target instanceof Element ? e.target.closest<HTMLElement>(LISTS) : null;
    if (!list || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (list.scrollWidth <= list.clientWidth + 1 || list.scrollHeight > list.clientHeight + 1) return;
    list.scrollLeft += e.deltaY;
    e.preventDefault();
  };
  host.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  host.addEventListener('wheel', wheel, { passive: false });
  return () => {
    stopGlide();
    host.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    host.removeEventListener('wheel', wheel);
  };
}
