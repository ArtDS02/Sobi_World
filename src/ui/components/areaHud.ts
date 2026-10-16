// The HUD every Area shares (decision 031, on the owner's plaza / Aquarium mock-ups): violet pills and a level pill
// with its star at the top left, square violet buttons with an icon at the top right, and a one-row tray at the bottom
// (a palette of seed cards that scrolls sideways, then the actions in small groups). Plain DOM from view data; the
// Area decides what each piece shows and does. `cls` adds the Area's own class names (tests and e2e look them up).
import { AREA_HUD_ART } from '../../core/config/assetIds';
import { el } from '../dom';
import { art } from './icon';

// ---- Top ----------------------------------------------------------------------------------------------------------

/** A violet pill: an icon and a number. */
export function hudPill(iconId: string, value: string, title: string, extra?: string): HTMLElement {
  return el(
    'span',
    { class: 'a-hud__pill', attrs: { title } },
    el('span', { class: 'a-hud__pill-icon' }, art(iconId, 'c-icon')),
    el('b', { text: value }),
    extra ? el('small', { text: extra }) : null,
  );
}

export interface HudLevelVm {
  levelNumber: number;
  level: string;
  xp: string;
  /** 0..100 */
  xpProgress: number;
}

/** The level pill: a star with the number, the level's name, the experience bar. */
export function hudLevel(v: HudLevelVm): HTMLElement {
  return el(
    'span',
    { class: 'a-hud__level', attrs: { title: v.xp } },
    el('span', { class: 'a-hud__star' }, art(AREA_HUD_ART.star, 'a-hud__star-art'), el('b', { text: String(v.levelNumber) })),
    el(
      'span',
      { class: 'a-hud__level-body' },
      el('span', { class: 'a-hud__level-row' }, el('b', { text: v.level }), el('small', { text: v.xp })),
      el('span', { class: 'c-bar a-hud__bar', attrs: { role: 'progressbar', 'aria-valuenow': String(v.xpProgress), 'aria-label': v.xp } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${v.xpProgress}%` } })),
    ),
  );
}

/** The pills at the top left. */
export const hudPills = (...pills: (HTMLElement | null)[]): HTMLElement => el('div', { class: 'a-hud__pills' }, ...pills);

export interface HudNavButton {
  icon: string;
  label: string;
  onClick: () => void;
  /** An extra class (tests look some buttons up by it). */
  cls?: string;
}

/** The square buttons at the top right. */
export function hudNav(label: string, buttons: readonly HudNavButton[]): HTMLElement {
  return el(
    'nav',
    { class: 'a-hud__nav', attrs: { 'aria-label': label } },
    ...buttons.map((b) =>
      el(
        'button',
        { class: `a-hud__btn${b.cls ? ` ${b.cls}` : ''}`, attrs: { type: 'button', title: b.label }, on: { click: b.onClick } },
        el('span', { class: 'a-hud__btn-icon' }, art(b.icon, 'c-icon')),
        el('span', { class: 'a-hud__btn-label', text: b.label }),
      ),
    ),
  );
}

// ---- Bottom -------------------------------------------------------------------------------------------------------

export interface DockSeedVm {
  id: string;
  name: string;
  art: string;
  /** What one costs ("12"). */
  price: string;
  /** How many the bag holds. */
  owned: number;
  /** Tooltip: what it is, how long it grows. */
  title: string;
  selected: boolean;
}

export interface DockActionVm {
  label: string;
  /** Why it is off, null when it works. */
  reason: string | null;
  art: string;
  /** main: the everyday action (green when it works); grow: opening more ground (quieter, last). */
  tone?: 'main' | 'care' | 'grow';
  onClick: () => void;
}

export interface DockGroup {
  label: string;
  actions: readonly DockActionVm[];
}

export interface DockStrings {
  /** The palette's name (radiogroup label and caption). */
  palette: string;
  /** "có {count}" style badge text, already formatted per seed. */
  owned: (count: number) => string;
  /** The coin unit after a price, for screen readers. */
  coins: string;
}

/** A seed card: picture, name, price with a coin, and what the bag holds; the chosen one gets a tick, not only a colour. */
function seedCard(s: DockSeedVm, onPick: (id: string) => void, cls: string, str: DockStrings): HTMLElement {
  return el(
    'button',
    {
      class: `a-dock__seed ${cls}${s.selected ? ' is-selected' : ''}`,
      attrs: { type: 'button', role: 'radio', 'aria-checked': String(s.selected), title: s.title },
      on: { click: () => onPick(s.id) },
    },
    s.selected ? el('span', { class: 'a-dock__tick', attrs: { 'aria-hidden': 'true' }, text: '✓' }) : null,
    el('span', { class: `a-dock__owned${s.owned > 0 ? '' : ' is-none'}`, text: str.owned(s.owned) }),
    el('span', { class: 'a-dock__seed-pic' }, art(s.art, 'a-dock__seed-icon')),
    el('b', { class: 'a-dock__seed-name', text: s.name }),
    el('small', { class: 'a-dock__price', attrs: { 'aria-label': `${s.price} ${str.coins}` } }, art(AREA_HUD_ART.coin, 'c-icon'), s.price),
  );
}

/** An action card: icon, label and, when it is off, why (also its tooltip). Off cards stay focusable and say so. */
function actionCard(a: DockActionVm): HTMLElement {
  const off = a.reason !== null;
  return el(
    'button',
    {
      class: `a-dock__act a-dock__act--${a.tone ?? 'care'}${off ? ' is-off' : ''}`,
      attrs: { type: 'button', title: off ? `${a.label} — ${a.reason ?? ''}` : a.label, ...(off ? { 'aria-disabled': 'true' } : {}) },
      on: { click: () => !off && a.onClick() },
    },
    el('span', { class: 'a-dock__act-icon' }, art(a.art, 'c-icon')),
    el('span', { class: 'a-dock__act-label', text: a.label }),
    off ? el('small', { class: 'a-dock__act-reason', text: a.reason ?? '' }) : null,
  );
}

/** Turns the mouse wheel into a sideways scroll over the palette, so it does not scroll or zoom the scene. */
function wheelSideways(e: Event) {
  const w = e as WheelEvent;
  const box = e.currentTarget as HTMLElement;
  if (box.scrollWidth <= box.clientWidth || Math.abs(w.deltaY) < Math.abs(w.deltaX)) return;
  box.scrollLeft += w.deltaY;
  e.preventDefault();
}

export interface DockVm {
  /** The Area's prefix: `garden-ui` gives `garden-ui__dock` and `garden-ui__seed`. */
  prefix: string;
  /** Anything before the palette (the Aquarium's tank line). */
  lead?: HTMLElement | null;
  seeds?: readonly DockSeedVm[];
  onPick?: (id: string) => void;
  groups: readonly DockGroup[];
  strings?: DockStrings;
}

export function areaDock(v: DockVm): HTMLElement {
  const palette =
    v.seeds && v.onPick && v.strings
      ? el(
          'div',
          { class: 'a-dock__palette-wrap' },
          el('span', { class: 'a-dock__caption', text: v.strings.palette }),
          el(
            'div',
            { class: `a-dock__palette ${v.prefix}__palette`, attrs: { role: 'radiogroup', 'aria-label': v.strings.palette }, on: { wheel: wheelSideways } },
            ...v.seeds.map((s) => seedCard(s, v.onPick!, `${v.prefix}__seed`, v.strings!)),
          ),
        )
      : null;
  return el(
    'div',
    { class: `a-dock ${v.prefix}__dock` },
    v.lead ?? null,
    palette,
    ...v.groups.map((g) =>
      el(
        'div',
        { class: 'a-dock__group', attrs: { role: 'group', 'aria-label': g.label } },
        el('span', { class: 'a-dock__caption', text: g.label }),
        el('div', { class: 'a-dock__acts' }, ...g.actions.map(actionCard)),
      ),
    ),
  );
}
