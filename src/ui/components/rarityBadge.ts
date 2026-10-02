// Rarity badge (U04): label from vi.rarity, colour from the $c-rarity token of the same key.
import type { Rarity } from '../../core/config/rarity';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export const rarityBadge = (rarity: Rarity): HTMLElement =>
  el('span', { class: `c-badge c-badge--${rarity.toLowerCase()}`, text: vi.rarity[rarity] });
