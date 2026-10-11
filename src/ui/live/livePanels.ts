// The popups of the living world (GĐ12): the weather, the festival with its shop, the visiting merchant. Placeholder looks:
// glyphs and text; the pictures come with the art phase (docs/ASSET_TODO.md).
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { localOffsetMs } from '../localDay';
import { el } from '../dom';
import type { WorldPanelDeps } from '../goals/panels';
import { festivalVm, merchantVm, weatherVm, type WeatherCardVm } from './liveVm';

const card = (c: WeatherCardVm) =>
  el(
    'li',
    { class: `live__weather is-${c.id}`, data: { weather: c.id } },
    el('span', { class: 'live__glyph', text: c.glyph, attrs: { 'aria-hidden': 'true' } }),
    el('div', { class: 'live__weather-body' }, el('span', { class: 'live__label', text: c.label }), el('b', { text: c.name }), el('p', { class: 'c-dialog__hint', text: c.effect })),
  );

export function renderWeatherPanel(d: WorldPanelDeps): HTMLElement {
  const vm = weatherVm(d.world, d.now, localOffsetMs(d.now));
  return el(
    'section',
    { class: 'live', data: { screen: 'weather' } },
    el('p', { class: 'orders__hint', text: vi.weather.intro }),
    el('ul', { class: 'live__list' }, card(vm.today), card(vm.tomorrow)),
  );
}

const button = (label: string, reason: string | null, click: () => void) =>
  el(
    'span',
    { class: 'c-action' },
    el('button', {
      class: 'c-button',
      text: label,
      attrs: { type: 'button', ...(reason ? { disabled: '', 'aria-disabled': 'true' } : {}) },
      on: { click: () => !reason && click() },
    }),
    reason ? el('span', { class: 'c-action__reason', text: reason }) : null,
  );

export function renderFestivalPanel(d: WorldPanelDeps): HTMLElement {
  const vm = festivalVm(d.world, d.now, localOffsetMs(d.now));
  const tokens = el('p', { class: 'live__tokens' }, el('b', { text: `${vi.festival.tokens}: ${formatInt(vm.tokens)}` }), el('span', { class: 'c-dialog__hint', text: ` · ${vi.festival.tokensHint}` }));
  const f = vm.active;
  if (!f) return el('section', { class: 'live', data: { screen: 'festival' } }, tokens, el('p', { text: vi.festival.closed }), vm.next ? el('p', { class: 'c-dialog__hint', text: vm.next }) : null);
  return el(
    'section',
    { class: 'live', data: { screen: 'festival', festival: f.id } },
    el('h3', { class: 'live__title', text: f.name }),
    el('p', { text: f.desc }),
    el('p', { class: 'c-dialog__hint', text: `${f.dayText} · ${f.area}` }),
    tokens,
    el('p', { class: 'c-dialog__hint', text: f.earned }),
    button(f.gift.label, f.gift.reason, () => d.act(d.goals.claimFestivalGift())),
    el('h4', { class: 'live__sub', text: vi.festival.earnTitle }),
    el('ul', { class: 'live__earn' }, ...f.earn.map((line) => el('li', { text: line }))),
    el('h4', { class: 'live__sub', text: vi.festival.shop }),
    el(
      'ul',
      { class: 'live__shop' },
      ...f.shop.map((row) =>
        el(
          'li',
          { class: 'live__row', data: { entry: row.id } },
          el('div', { class: 'live__row-body' }, el('b', { text: row.name }), el('span', { class: 'c-dialog__hint', text: row.limit ? `${row.cost} · ${row.limit}` : row.cost })),
          button(row.buy.label, row.buy.reason, () => d.act(d.goals.buyFestivalItem(row.id))),
        ),
      ),
    ),
  );
}

export function renderMerchantPanel(d: WorldPanelDeps): HTMLElement {
  const vm = merchantVm(d.world, d.now, localOffsetMs(d.now), (i) => d.goals.deliverMerchant(i));
  const head = el('div', { class: 'live__head' }, el('h3', { class: 'live__title', text: vm.name }), el('p', { class: 'c-dialog__hint', text: vm.present ? vm.greeting : '' }));
  if (!vm.present) return el('section', { class: 'live', data: { screen: 'merchant' } }, head, el('p', { text: vm.line }));
  return el(
    'section',
    { class: 'live', data: { screen: 'merchant' } },
    head,
    el('p', { text: vm.line }),
    vm.demand ? el('p', { class: 'live__demand', text: vm.demand }) : null,
    el('p', { class: 'c-dialog__hint', text: vi.merchant.lastDay }),
    el('h4', { class: 'live__sub', text: vi.merchant.offers }),
    el(
      'ul',
      { class: 'live__offers' },
      ...vm.offers.map((o, i) =>
        el(
          'li',
          { class: `live__offer${o.done ? ' is-done' : ''}`, data: { offer: o.id } },
          el('ul', { class: 'live__lines' }, ...o.lines.map((l) => el('li', { class: l.enough ? '' : 'is-short', text: `${l.name}: ${formatInt(l.have)}/${formatInt(l.need)}` }))),
          el('p', { text: o.reward }),
          o.bonus ? el('p', { class: 'c-dialog__hint', text: o.bonus }) : null,
          button(o.deliver.label, o.deliver.reason, () => d.act(d.goals.deliverMerchant(i))),
        ),
      ),
    ),
  );
}

export const weatherChipText = (name: string): string => t(vi.weather.chip, { name });
