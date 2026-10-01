// Orders board (spec §8.14): opened from prop_order_board. Each card lists requirements and reward;
// "Giao đơn" opens a picker of the pigs that fit.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { actionButton } from '../components/actionButton';
import { el } from '../dom';
import { ordersVm, type OrderCardVm } from '../ordersVm';

export interface OrdersHandlers {
  deliver: (card: OrderCardVm) => void;
}

export function renderOrdersScreen(save: SaveGame, now: number, on: OrdersHandlers): HTMLElement {
  const cards = ordersVm(save, now);
  return el(
    'section',
    { class: 'orders', data: { screen: 'orders' } },
    el('h2', { class: 'orders__title', text: vi.order.title }),
    cards.length === 0
      ? el('p', { class: 'c-empty', text: vi.order.empty })
      : el('ul', { class: 'orders__list' }, ...cards.map((c) => renderCard(c, on))),
  );
}

function renderCard(card: OrderCardVm, on: OrdersHandlers): HTMLElement {
  return el(
    'li',
    { class: `orders__card${card.fulfilled ? ' is-done' : ''}`, data: { order: card.id } },
    el('p', { class: 'orders__want', text: card.want }),
    el('p', { class: 'orders__req', text: card.gender }),
    el('p', { class: 'orders__req', text: card.minHappiness }),
    el('p', { class: 'orders__reward', text: card.reward }),
    el(
      'div',
      { class: 'orders__foot' },
      el('span', { class: 'orders__time', text: card.expiresIn }),
      card.fulfilled
        ? el('span', { class: 'orders__done', text: vi.order.fulfilled })
        : actionButton(card.button, () => on.deliver(card)),
    ),
  );
}
