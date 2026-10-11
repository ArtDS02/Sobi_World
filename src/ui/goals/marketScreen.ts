// The market of the day (spec V2 §9): which groups of goods pay more today and which pay less, with the goods of
// each group and what the shop pays for one. The same for every run of the game: it is seeded by the day.
import { MARKET_RULES } from '../../systems/valuation/marketRules';
import { ITEM_IDS, ITEMS } from '../../core/config/items';
import { gameDay } from '../../systems/health/disease';
import { dailyMarket, marketGroupOf, MARKET_GROUP_VALUES, type MarketGroup } from '../../systems/valuation/market';
import { itemSalePrice } from '../../systems/valuation/itemPrice';
import { formatDec, formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface MarketGroupVm {
  id: MarketGroup;
  name: string;
  factor: string;
  state: 'up' | 'down' | 'normal';
  label: string;
  /** The visiting merchant pays extra for this group today. */
  merchant: boolean;
  /** What the shop pays for one of each good of the group today. */
  goods: string[];
}

export function marketVm(now: number, dayOffsetMs: number): MarketGroupVm[] {
  const market = dailyMarket(gameDay(now, dayOffsetMs), MARKET_RULES);
  return MARKET_GROUP_VALUES.map((id): MarketGroupVm => {
    const state = market.up.includes(id) ? 'up' : market.down.includes(id) ? 'down' : 'normal';
    const goods =
      id === 'PIGS'
        ? [vi.market.pigsGood]
        : ITEM_IDS.filter((i) => ITEMS[i].sellGold !== undefined && marketGroupOf(ITEMS[i].category) === id).map((i) =>
            t(vi.market.good, { name: vi.shop[i], gold: formatInt(itemSalePrice(ITEMS[i], 1, now, dayOffsetMs)) }),
          );
    const merchant = market.merchant === id;
    return { id, name: vi.market.groups[id], factor: `x${formatDec(market.factors[id])}`, state, label: merchant ? `${vi.market[state]} · ${vi.market.merchant}` : vi.market[state], merchant, goods };
  });
}

export function renderMarketScreen(now: number, dayOffsetMs: number): HTMLElement {
  return el(
    'section',
    { class: 'market', data: { screen: 'market' } },
    el('p', { class: 'market__hint', text: vi.market.hint }),
    el(
      'ul',
      { class: 'market__list' },
      ...marketVm(now, dayOffsetMs).map((g) =>
        el(
          'li',
          { class: `market__group is-${g.state}${g.merchant ? ' is-merchant' : ''}`, data: { group: g.id } },
          el('div', { class: 'market__head' }, el('b', { text: g.name }), el('span', { class: 'market__factor', text: g.factor }), el('span', { class: 'market__label', text: g.label })),
          g.goods.length > 0 ? el('ul', { class: 'market__goods' }, ...g.goods.map((text) => el('li', { text }))) : null,
        ),
      ),
    ),
  );
}
