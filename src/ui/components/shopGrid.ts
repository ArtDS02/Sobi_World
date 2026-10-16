// An Area's shop (decision 029), shared by the Garden and the Cloud: a grid of cards — the item's picture, name, what it
// does, the price of one and what the bag holds — each with buy buttons for a few counts. Every button says why it is off.
// Plain DOM from view data; the Area decides what is sold and runs the purchase. `theme` picks the Area's colours.
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

export interface ShopLineVm {
  itemId: string;
  name: string;
  /** What the item does, one short line. */
  line: string;
  art: string;
  /** "12 / cái". */
  each: string;
  /** "Đang có 4". */
  owned: string;
  buys: ShopBuyVm[];
}

export function shopGrid(intro: string, lines: readonly ShopLineVm[], onBuy: (itemId: string, count: number) => void): HTMLElement {
  return el(
    'div',
    { class: 'c-shop' },
    el('p', { class: 'c-shop__intro', text: intro }),
    el(
      'div',
      { class: 'c-shop__grid' },
      ...lines.map((l) =>
        el(
          'article',
          { class: 'c-shop__card' },
          el('div', { class: 'c-shop__pic' }, art(l.art, 'c-shop__art')),
          el('h3', { class: 'c-shop__name', text: l.name }),
          el('p', { class: 'c-shop__line', text: l.line }),
          el('div', { class: 'c-shop__meta' }, el('b', { class: 'c-shop__each', text: l.each }), el('small', { class: 'c-shop__owned', text: l.owned })),
          el(
            'div',
            { class: 'c-shop__buys' },
            ...l.buys.map((b) =>
              el(
                'button',
                {
                  class: 'c-shop__buy',
                  attrs: { type: 'button', title: b.reason ?? `${b.label} · ${b.price}`, ...(b.reason ? { disabled: '', 'aria-disabled': 'true' } : {}) },
                  on: { click: () => !b.reason && onBuy(l.itemId, b.count) },
                },
                el('b', { text: b.label }),
                el('small', { text: b.price }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/** Dresses an open dialog as a wide shop panel in the Area's colours. */
export function dressShopDialog(body: HTMLElement, theme: 'garden' | 'cloud') {
  body.closest('.c-dialog__panel')?.classList.add('c-dialog__panel--shop', `c-shop--${theme}`);
}
