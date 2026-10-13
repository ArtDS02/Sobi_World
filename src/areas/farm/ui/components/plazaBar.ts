// The plaza's HUD (spec §3.1, decision 024 — the owner's mock-up): a profile card with the coins, the gems, the world
// level with its star; Hub / Collection / Menu / Items on the right; a dock of the five Areas at the bottom and the
// Sobi World logo in the corner. Real values only. New art (batch world-01-scene) is used once it is no longer a
// placeholder; until then the older icons and a plain text logo stand in.
import { vi } from '../../../../i18n/vi';
import type { UiIcon } from '../../../../core/config/assetIds';
import { art, icon } from '../../../../ui/components/icon';
import { el } from '../../../../ui/dom';
import type { FarmGame } from '../../logic/types';
import { formatInt, t } from '../../../../i18n/format';
import type { PlazaDoor, PlazaLevel } from '../appTypes';

export interface PlazaBarDeps {
  gems: number | null;
  level: PlazaLevel | null;
  doors: readonly PlazaDoor[];
  /** The final art of a manifest id is in (not a placeholder). */
  hasArt: (id: string) => boolean;
  menu: () => void;
  items: () => void;
  collection: () => void;
  /** A dock card was clicked. */
  door: (door: PlazaDoor) => void;
}

const LOCK = '🔒';
/** Stand-in pictures of the dock's cards until the ui_area_* icons arrive. */
const AREA_GLYPH: Record<string, string> = { adventure: '⚔️', garden: '🌱', cloud: '☁️', aquarium: '🐟', farm: '🐷' };

/** The new art when it is in, else the older ui icon. */
const pick = (d: PlazaBarDeps, id: string, cls: string, old?: UiIcon) =>
  d.hasArt(id) ? art(id, cls) : old ? icon(old) : null;

function button(d: PlazaBarDeps, id: string, old: UiIcon, label: string, on: { click?: () => void; why?: string }) {
  const disabled = !on.click;
  return el(
    'button',
    {
      class: `plazabar__btn${disabled ? ' is-disabled' : ''}`,
      attrs: {
        type: 'button',
        ...(disabled ? { 'aria-disabled': 'true' } : {}),
        ...(on.why ? { title: on.why } : {}),
      },
      on: { click: () => on.click?.() },
    },
    el('span', { class: 'plazabar__btn-icon' }, pick(d, id, 'c-icon', old)),
    el('span', { class: 'plazabar__btn-label', text: label }),
  );
}

function levelPill(d: PlazaBarDeps, level: PlazaLevel) {
  const P = vi.plazaBar;
  const right = level.next === null ? P.levelMax : t(P.xp, { current: formatInt(level.xp), next: formatInt(level.next) });
  return el(
    'div',
    { class: 'plazabar__level', attrs: { title: right } },
    el(
      'span',
      { class: `plazabar__star${d.hasArt('ui_badge_level') ? ' has-art' : ''}` },
      pick(d, 'ui_badge_level', 'plazabar__star-art'),
      el('b', { text: String(level.level) }),
    ),
    el(
      'span',
      { class: 'plazabar__level-body' },
      el(
        'span',
        { class: 'plazabar__level-row' },
        el('b', { text: t(P.level, { level: level.level }) }),
        el('small', { text: right }),
      ),
      el(
        'span',
        { class: 'c-bar plazabar__level-bar', attrs: { role: 'progressbar', 'aria-valuenow': String(level.percent) } },
        el('span', { class: 'c-bar__fill', attrs: { style: `width: ${level.percent}%` } }),
      ),
    ),
  );
}

function dock(d: PlazaBarDeps) {
  return el(
    'nav',
    { class: 'plazabar__dock', attrs: { 'aria-label': vi.plazaBar.areas } },
    ...d.doors.map((door) =>
      el(
        'button',
        {
          class: `plazabar__area plazabar__area--${door.key}${door.status === 'open' ? '' : ' is-locked'}`,
          attrs: { type: 'button', title: door.status === 'open' ? door.name : door.why, ...(door.status === 'open' ? {} : { 'aria-disabled': 'true' }) },
          on: { click: () => d.door(door) },
        },
        d.hasArt(door.icon)
          ? el('span', { class: 'plazabar__area-icon' }, art(door.icon, 'c-icon'))
          : el('span', { class: 'plazabar__area-icon is-glyph', text: AREA_GLYPH[door.key] ?? '', attrs: { 'aria-hidden': 'true' } }),
        el('span', { class: 'plazabar__area-name', text: door.name }),
        door.status === 'open' ? null : el('span', { class: 'plazabar__area-lock', text: d.hasArt('ui_icon_lock') ? '' : LOCK, attrs: { 'aria-hidden': 'true' } }, d.hasArt('ui_icon_lock') ? art('ui_icon_lock', 'c-icon') : null),
      ),
    ),
  );
}

function logo(d: PlazaBarDeps) {
  const plank = d.hasArt('prop_world_logo');
  return el(
    'div',
    { class: `plazabar__logo${plank ? ' has-art' : ''}`, attrs: { 'aria-hidden': 'true' } },
    d.hasArt('prop_sobi_mascot') ? art('prop_sobi_mascot', 'plazabar__logo-mascot') : null,
    plank ? art('prop_world_logo', 'plazabar__logo-plank') : null,
    el('span', { class: 'plazabar__logo-text', text: vi.app.title }),
  );
}

export function renderPlazaBar(save: FarmGame, d: PlazaBarDeps): HTMLElement {
  const P = vi.plazaBar;
  return el(
    'div',
    { class: 'plazabar' },
    el(
      'div',
      { class: 'plazabar__pills' },
      el(
        'div',
        { class: 'plazabar__profile', attrs: { 'aria-label': `${P.coins}: ${formatInt(save.player.gold)}` } },
        el('span', { class: 'plazabar__avatar' }, d.hasArt('prop_sobi_mascot') ? art('prop_sobi_mascot', 'plazabar__avatar-art') : icon('coin')),
        el(
          'span',
          { class: 'plazabar__profile-body' },
          el('span', { class: 'plazabar__profile-name', text: vi.app.title }),
          el('span', { class: 'plazabar__coins', attrs: { title: P.coins } }, icon('coin'), el('b', { text: formatInt(save.player.gold) })),
        ),
      ),
      d.gems === null
        ? null
        : el(
            'span',
            { class: 'plazabar__pill', attrs: { title: P.gems, 'aria-label': `${P.gems}: ${formatInt(d.gems)}` } },
            el('span', { class: 'plazabar__pill-icon' }, icon('gem')),
            el('b', { text: formatInt(d.gems) }),
          ),
      d.level ? levelPill(d, d.level) : null,
    ),
    el(
      'nav',
      { class: 'plazabar__buttons', attrs: { 'aria-label': vi.app.title } },
      button(d, 'ui_hud_hub', 'hub', P.hub, { why: P.hubHere }),
      button(d, 'ui_hud_collection', 'collection', P.collection, { click: d.collection }),
      button(d, 'ui_hud_menu', 'menu', P.menu, { click: d.menu }),
      button(d, 'ui_hud_items', 'items', P.items, { click: d.items }),
    ),
    d.doors.length > 0 ? dock(d) : null,
    logo(d),
  );
}
