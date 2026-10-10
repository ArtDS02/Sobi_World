// What the Adventure's events say and play (spec §11.3): sound and toast per event, data-driven like the Garden's table.
// Handed to the FeedbackDirector, the one place that turns events into presentation. Pure.
import type { AudioKey } from '../../core/config/assetIds';
import type { ItemId } from '../../core/config/ids';
import type { EventBase } from '../../core/events';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { ZONES } from './logic/config/content';
import { isAdventureEvent } from './logic/events';

export interface Presentation {
  sound: AudioKey | null;
  toast: string | null;
}

const T = vi.adventure.toast;
const itemName = (id: string) => vi.shop[id as ItemId] ?? id;
const itemsText = (items: Readonly<Record<string, number>>) =>
  Object.entries(items)
    .map(([id, n]) => `${formatInt(n)} ${itemName(id)}`)
    .join(', ');

/** A catch-up is never replayed (§9.5): the away summary covers it. */
export function adventurePresentation(e: EventBase, origin: 'action' | 'tick' | 'catchup'): Presentation | null {
  if (!isAdventureEvent(e) || origin === 'catchup') return null;
  switch (e.type) {
    case 'ADVENTURE_STARTER_CLAIMED':
      return { sound: 'birth_fanfare', toast: t(T.starter, { breed: vi.adventure.knight }) };
    case 'ADVENTURE_RUN_STARTED':
      return { sound: 'notify', toast: t(T.started, { zone: ZONES[e.zoneId]?.nameVi ?? '' }) };
    case 'ADVENTURE_BATTLE_STARTED':
      return { sound: 'notify', toast: e.boss ? T.boss : T.battle };
    case 'ADVENTURE_BATTLE_WON':
      return { sound: 'level_up', toast: t(T.won, { exp: e.exp, coins: formatInt(e.coins) }) };
    case 'ADVENTURE_CHEST_OPENED':
      return { sound: 'coin_collect', toast: Object.keys(e.items).length > 0 ? t(T.chest, { items: itemsText(e.items) }) : T.chestEmpty };
    case 'ADVENTURE_LEVEL_UP':
      return { sound: 'level_up', toast: t(T.levelUp, { name: e.name, level: e.level }) };
    case 'ADVENTURE_EXHAUSTED':
      return { sound: 'notify', toast: t(T.exhausted, { hours: 4 }) };
    case 'ADVENTURE_ITEM_USED':
      return { sound: 'ui_click', toast: t(T.itemUsed, { item: itemName(e.itemId) }) };
    case 'ADVENTURE_EQUIPPED':
      return { sound: 'ui_click', toast: t(T.equipped, { item: itemName(e.itemId) }) };
    case 'ADVENTURE_UNEQUIPPED':
      return { sound: 'ui_click', toast: t(T.unequipped, { item: itemName(e.itemId) }) };
    case 'ADVENTURE_LOOT_COLLECTED':
      return { sound: 'coin_collect', toast: t(e.left > 0 ? T.lootLeft : T.loot, { items: itemsText(e.items), left: e.left }) };
    case 'ADVENTURE_RUN_ENDED':
      return e.result === 'win' ? { sound: 'level_up', toast: T.cleared } : e.result === 'retreat' ? { sound: null, toast: T.fled } : null;
    case 'ADVENTURE_LEVEL':
      return { sound: 'level_up', toast: t(T.levelUpWorld, { level: e.level }) };
    default:
      return null;
  }
}
