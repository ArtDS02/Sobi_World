// The plaza's top bar (spec §3.1): coins and gems on the left, Hub / Map / Menu / Items on the right.
// Real wallet values only; the player has no energy yet, so no energy gauge is drawn. Hub is where the
// player already is and Map has no screen yet, so both are shown disabled with their reason.
import { vi } from '../../../../i18n/vi';
import type { UiIcon } from '../../../../core/config/assetIds';
import { icon } from '../../../../ui/components/icon';
import { el } from '../../../../ui/dom';
import type { FarmGame } from '../../logic/types';
import { formatInt } from '../../../../i18n/format';

export interface PlazaBarHandlers {
  menu: () => void;
  items: () => void;
}

const pill = (name: UiIcon, value: string, label: string) =>
  el(
    'span',
    { class: 'plazabar__pill', attrs: { title: label, 'aria-label': `${label}: ${value}` } },
    el('span', { class: 'plazabar__pill-icon' }, icon(name)),
    el('b', { text: value }),
  );

function button(name: UiIcon, label: string, on: { click?: () => void; why?: string }) {
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
    el('span', { class: 'plazabar__btn-icon' }, icon(name)),
    el('span', { class: 'plazabar__btn-label', text: label }),
  );
}

export function renderPlazaBar(save: FarmGame, gems: number | null, on: PlazaBarHandlers): HTMLElement {
  const P = vi.plazaBar;
  return el(
    'div',
    { class: 'plazabar' },
    el(
      'div',
      { class: 'plazabar__pills' },
      pill('coin', formatInt(save.player.gold), P.coins),
      gems === null ? null : pill('gem', formatInt(gems), P.gems),
    ),
    el(
      'nav',
      { class: 'plazabar__buttons', attrs: { 'aria-label': vi.app.title } },
      button('hub', P.hub, { why: P.hubHere }),
      button('map', P.map, { why: P.mapSoon }),
      button('menu', P.menu, { click: on.menu }),
      button('items', P.items, { click: on.items }),
    ),
  );
}
