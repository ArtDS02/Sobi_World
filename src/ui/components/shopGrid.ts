// An Area's shop (decision 029, laid out again by decision 031), shared by the Garden and the Cloud: a head with the
// intro and the Sobi Coin balance, then a grid of cards — the item's picture, a tag (seed, fertilizer…), its name, what
// it does, the price of one, what the bag holds — each with buy buttons for a few counts that show the total. Only the
// grid scrolls. Every button says why it is off, and the card writes it out too. Plain DOM from view data; the Area
// decides what is sold and runs the purchase. `theme` picks the Area's colours.
import { AREA_HUD_ART } from '../../core/config/assetIds';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { art } from './icon';

export interface ShopBuyVm {
  count: number;
  /** "×10". */
  label: string;
  /** What it costs, under the label. */
  price: string;
  /** Why it is off, null when it works. */
  reason: string | null;
}

export type ShopKind = 'seed' | 'fertilizer' | 'water' | 'item';

export interface ShopLineVm {
  itemId: string;
  name: string;
  /** What kind of goods it is: a tag on the card. */
  kind: ShopKind;
  /** What the item does, one short line. */
  line: string;
  art: string;
  /** "12 / cái". */
  each: string;
  /** "Đang có 4". */
  owned: string;
  buys: ShopBuyVm[];
}

export interface ShopBalance {
  label: string;
  value: string;
}

/** Read when drawn: the string table is filled with the chosen language in place. */
const tagOf = (kind: ShopKind): string =>
  kind === 'seed' ? vi.areaHud.tagSeed : kind === 'fertilizer' ? vi.areaHud.tagFertilizer : kind === 'water' ? vi.areaHud.tagWater : vi.areaHud.tagItem;

const coin = () => art(AREA_HUD_ART.coin, 'c-icon');

/** "×10, ×50: Thiếu Sobi Coin" — the off buttons of a card and why, one line per reason. */
function offLines(buys: readonly ShopBuyVm[]): string[] {
  const byReason = new Map<string, string[]>();
  for (const b of buys) if (b.reason) byReason.set(b.reason, [...(byReason.get(b.reason) ?? []), b.label]);
  return [...byReason].map(([reason, labels]) => (labels.length === buys.length ? reason : t(vi.areaHud.offFor, { counts: labels.join(', '), reason })));
}

function card(l: ShopLineVm, onBuy: (itemId: string, count: number) => void): HTMLElement {
  const off = offLines(l.buys);
  return el(
    'article',
    { class: `c-shop__card c-shop__card--${l.kind}`, data: { item: l.itemId } },
    el('span', { class: 'c-shop__tag', text: tagOf(l.kind) }),
    el('span', { class: 'c-shop__owned', text: l.owned }),
    el('div', { class: 'c-shop__pic' }, art(l.art, 'c-shop__art')),
    el('h3', { class: 'c-shop__name', text: l.name, attrs: { title: l.name } }),
    el('p', { class: 'c-shop__line', text: l.line, attrs: { title: l.line } }),
    el('p', { class: 'c-shop__each' }, coin(), el('b', { text: l.each })),
    el(
      'div',
      { class: 'c-shop__buys' },
      ...l.buys.map((b) =>
        el(
          'button',
          {
            class: 'c-shop__buy',
            attrs: { type: 'button', title: b.reason ? `${b.label} — ${b.reason}` : `${b.label} · ${b.price}`, ...(b.reason ? { disabled: '', 'aria-disabled': 'true' } : {}) },
            on: {
              click: (e) => {
                if (b.reason) return;
                (e.currentTarget as HTMLElement).classList.add('is-busy');
                onBuy(l.itemId, b.count);
              },
            },
          },
          el('b', { text: b.label }),
          el('small', {}, coin(), b.price),
        ),
      ),
    ),
    off.length ? el('p', { class: 'c-shop__off', attrs: { role: 'note' } }, ...off.map((text) => el('span', { text }))) : null,
  );
}

export function shopGrid(intro: string, lines: readonly ShopLineVm[], onBuy: (itemId: string, count: number) => void, balance?: ShopBalance): HTMLElement {
  return el(
    'div',
    { class: 'c-shop' },
    el(
      'div',
      { class: 'c-shop__head' },
      el('p', { class: 'c-shop__intro', text: intro }),
      balance ? el('span', { class: 'c-shop__balance', attrs: { title: balance.label } }, coin(), el('small', { text: balance.label }), el('b', { text: balance.value })) : null,
    ),
    el('div', { class: 'c-shop__grid' }, ...lines.map((l) => card(l, onBuy))),
  );
}

/**
 * One purchase per press: a second press within `gapMs` (a double click, a key held down) is ignored, so one
 * interaction never pays twice. Made once per opened shop, outside its re-render.
 */
export function guardBuy(onBuy: (itemId: string, count: number) => void, clock: () => number = () => performance.now(), gapMs = 400) {
  let last = -Infinity;
  return (itemId: string, count: number) => {
    const at = clock();
    if (at - last < gapMs) return;
    last = at;
    onBuy(itemId, count);
  };
}

/** Dresses an open dialog as a wide shop panel in the Area's colours, with a small close button in its corner. */
export function dressShopDialog(body: HTMLElement, theme: 'garden' | 'cloud') {
  const panel = body.closest('.c-dialog__panel');
  if (!panel) return;
  panel.classList.add('c-dialog__panel--shop', `c-shop--${theme}`);
  const closer = panel.querySelector<HTMLButtonElement>('.c-dialog__bar button');
  const x = el('button', {
    class: 'c-shop__close',
    text: '×',
    attrs: { type: 'button', 'aria-label': vi.areaHud.close, title: vi.areaHud.close },
    on: { click: () => closer?.click() },
  });
  panel.prepend(x);
  x.focus(); // the bar's button, focused by openDialog, is hidden in a shop
}
