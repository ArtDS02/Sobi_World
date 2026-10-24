// The growing side of the camp (adventure-big-update-1 §17): a fighter's level bar with the experience books it can be given, and
// the Shop & Forge's body (the Adventure Shop's cards, the Forge's recipes with what each takes and makes).
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { WorldSave } from '../../../core/save/world';
import { formatInt } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { shopGrid } from '../../../ui/components/shopGrid';
import { el } from '../../../ui/dom';
import { forge, useTome } from '../logic/actions/workshop';
import { fighterCardVm } from './fighterVm';
import { actionButton, bar } from './viewKit';
import type { AdventureRun } from './vmKit';
import { forgeVm, tomesVm, workshopShopVm } from './workshopVm';

/** The level bar and the experience books the fighter can be given now (adventure-big-update-1 §17). */
export function growSection(w: WorldSave, key: string, roster: readonly RosterEntry[], now: number, dispatch: (run: AdventureRun) => void): HTMLElement {
  const entry = roster.find((r) => r.key === key);
  const card = entry ? fighterCardVm(w, entry, now) : null;
  const tomes = tomesVm(w, key, roster, now);
  return el(
    'section',
    { class: 'adventure-grow' },
    el('h4', { text: vi.adventure.sheet.grow }),
    card
      ? el(
          'div',
          { class: 'adventure-grow__level' },
          el('span', { class: 'adventure-ui__fighter-lv is-inline' }, el('small', { text: 'Lv' }), el('b', { text: String(card.levelNumber) })),
          el('span', { class: 'adventure-ui__meter-row is-exp is-level' }, bar(card.expPercent, 'exp', card.expText), el('small', { class: 'adventure-ui__meter-text', text: card.expText })),
        )
      : null,
    tomes.length === 0
      ? el('small', { class: 'adventure-ui__note', text: vi.adventure.sheet.tomeNone })
      : el(
          'ul',
          { class: 'adventure-grow__tomes' },
          ...tomes.map((tm) =>
            el(
              'li',
              {},
              art(tm.art, 'adventure-dialog__icon', tm.label),
              el('span', { text: tm.label }),
              actionButton(tm.use, () => dispatch((ww, c) => useTome(ww, { key, itemId: tm.itemId, count: 1, roster }, c))),
              tm.useMany ? actionButton(tm.useMany, () => dispatch((ww, c) => useTome(ww, { key, itemId: tm.itemId, count: tm.useMany!.count, roster }, c)), 'c-button--ghost') : null,
            ),
          ),
        ),
    el('small', { class: 'adventure-ui__note', text: vi.adventure.sheet.growNote }),
  );
}

/** The Shop & Forge dialog's body: its two tabs, then the shop cards or the Forge's recipes. */
export function workshopBody(w: WorldSave, now: number, tab: 'shop' | 'forge', setTab: (tab: 'shop' | 'forge') => void, buy: (itemId: string, count: number) => void, dispatch: (run: AdventureRun) => void): HTMLElement {
  const W = vi.adventure.workshop;
  const tabs = el(
    'div',
    { class: 'adventure-sheet__tabs', attrs: { role: 'tablist' } },
    ...(['shop', 'forge'] as const).map((x) =>
      el('button', { class: `c-button c-button--ghost${x === tab ? ' is-on' : ''}`, text: x === 'shop' ? W.tabShop : W.tabForge, attrs: { type: 'button', role: 'tab', 'aria-selected': String(x === tab) }, on: { click: () => setTab(x) } }),
    ),
  );
  if (tab === 'shop') return el('div', { class: 'adventure-workshop' }, tabs, shopGrid(W.shopIntro, workshopShopVm(w, now), buy, { label: vi.areaHud.balance, value: formatInt(w.wallet.coins) }));
  return el(
    'div',
    { class: 'adventure-workshop' },
    tabs,
    el('p', { class: 'adventure-ui__note', text: W.forgeIntro }),
    el(
      'div',
      { class: 'adventure-forge', attrs: { 'data-drag-scroll': 'forge' } },
      ...forgeVm(w, now).map((r) =>
        el(
          'article',
          { class: `adventure-forge__card${r.make.reason ? ' is-short' : ''}` },
          el('div', { class: 'adventure-forge__out' }, art(r.art, 'adventure-forge__art', r.name), el('b', { text: r.name }), el('small', { text: r.makes })),
          el('ul', { class: 'adventure-forge__in' }, ...r.inputs.map((i) => el('li', { class: i.short ? 'is-short' : '', attrs: { title: i.name } }, art(i.art, 'adventure-forge__icon', i.name), el('span', { text: i.name }), el('b', { text: i.text })))),
          el(
            'div',
            { class: 'adventure-forge__go' },
            actionButton(r.make, () => dispatch((s, c) => forge(s, { recipeId: r.id, times: 1 }, c))),
            r.makeMany ? actionButton(r.makeMany, () => dispatch((s, c) => forge(s, { recipeId: r.id, times: r.makeMany!.times }, c)), 'c-button--ghost') : null,
          ),
        ),
      ),
    ),
  );
}
