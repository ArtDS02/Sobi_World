// The plot skin forge dialog (decision 056), shared by the Cloud and the Garden: the shop grid of skins (owned, forgeable,
// locked with its hint) over the strip that dresses the cloud tier / garden zone on screen. Plain DOM; the Area runs the actions.
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { ShopLineVm } from './shopGrid';
import { shopGrid } from './shopGrid';
import type { SkinChipVm } from '../world/skinForgeVm';

export interface SkinForgeView {
  cards: readonly ShopLineVm[];
  strip: readonly SkinChipVm[];
  /** "Tầng 3 · Tầng Mây Hoàng Hôn": the group the strip dresses. */
  groupName: string;
  coins: number;
  gems: number;
}

export interface SkinForgeHandlers {
  /** `count` 1 = pay coins, 2 = pay Gems. */
  onForge: (skinId: string, count: number) => void;
  /** null = back to the plain look. */
  onApply: (skinId: string | null) => void;
}

export function skinForgeBody(v: SkinForgeView, h: SkinForgeHandlers): HTMLElement {
  const chips = v.strip.map((c) =>
    el('button', {
      class: `c-chip skin-strip__chip${c.active ? ' is-active' : ''}`,
      text: c.name,
      attrs: { type: 'button', 'aria-pressed': String(c.active) },
      on: { click: () => h.onApply(c.skinId) },
    }),
  );
  return el(
    'div',
    { class: 'skin-forge' },
    shopGrid(`${vi.plotSkin.intro} · ${formatInt(v.gems)} Gems`, v.cards, h.onForge, { label: vi.plotSkin.balanceCoins, value: formatInt(v.coins) }),
    el('div', { class: 'skin-strip' }, el('b', { text: t(vi.plotSkin.stripTitle, { group: v.groupName }) }), el('div', { class: 'skin-strip__chips' }, ...chips), el('small', { text: vi.plotSkin.stripHint })),
  );
}
