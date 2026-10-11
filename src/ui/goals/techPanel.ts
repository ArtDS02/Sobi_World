// The technology popup (GĐ11): one card per technology with its level, what it gives, what the next level costs and the button.
import { buyTech } from '../../core/tech/tech';
import { TECH_LIST } from '../../core/config/tech';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { WorldPanelDeps } from './panels';
import { techCards, type TechCardVm } from './techVm';

function card(c: TechCardVm, d: WorldPanelDeps): HTMLElement {
  const off = c.buy.reason !== null;
  return el(
    'li',
    { class: 'tech__card', data: { tech: c.id } },
    el('b', { text: `${c.name} · ${c.level}` }),
    el('p', { class: 'c-dialog__hint', text: c.desc }),
    el('p', { text: t(vi.tech.now, { effect: c.now }) }),
    c.next ? el('p', { text: t(vi.tech.next, { effect: c.next }) }) : el('p', { class: 'c-dialog__hint', text: vi.tech.max }),
    c.coins
      ? el(
          'ul',
          { class: 'tech__cost' },
          el('li', { class: c.coins.have >= c.coins.need ? '' : 'is-short', text: `${vi.plazaBar.coins}: ${formatInt(c.coins.have)}/${formatInt(c.coins.need)}` }),
          ...c.items.map((i) => el('li', { class: i.have >= i.need ? '' : 'is-short', text: `${i.name}: ${formatInt(i.have)}/${formatInt(i.need)}` })),
        )
      : null,
    el(
      'span',
      { class: 'c-action' },
      el('button', {
        class: 'c-button',
        text: c.buy.label,
        attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}) },
        on: { click: () => !off && d.act((w, ctx) => buyTech(w, { techId: c.id }, ctx, TECH_LIST)) },
      }),
      off && c.next ? el('span', { class: 'c-action__reason', text: c.buy.reason! }) : null,
    ),
  );
}

export const renderTechPanel = (d: WorldPanelDeps): HTMLElement =>
  el('section', { class: 'tech', data: { screen: 'tech' } }, el('p', { class: 'orders__hint', text: vi.tech.intro }), el('ul', { class: 'tech__list' }, ...techCards(d.world, d.now).map((c) => card(c, d))));
