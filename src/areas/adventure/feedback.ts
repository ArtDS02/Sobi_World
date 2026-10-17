// What the Adventure's events say and play (spec §11.3): sound and toast per event, data-driven like the Garden's table. Handed to the
// FeedbackDirector, the one place that turns events into presentation. Pure.
import type { AudioKey } from '../../core/config/assetIds';
import type { ItemId } from '../../core/config/ids';
import type { EventBase } from '../../core/events';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { AB, ELEMENT_NAMES, NODES, SKILLS, ZONES } from './logic/config/content';
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
const elementName = (e: string) => ELEMENT_NAMES[e as keyof typeof ELEMENT_NAMES]?.nameVi ?? e;

/** A catch-up is never replayed (§9.5): the away summary covers it. */
export function adventurePresentation(e: EventBase, origin: 'action' | 'tick' | 'catchup'): Presentation | null {
  if (!isAdventureEvent(e) || origin === 'catchup') return null;
  switch (e.type) {
    case 'ADVENTURE_STARTER_CLAIMED':
      return { sound: 'birth_fanfare', toast: t(T.starter, { breed: vi.adventure.camp.knight }) };
    case 'ADVENTURE_RUN_STARTED':
      return { sound: 'notify', toast: t(T.started, { zone: ZONES[e.zoneId]?.nameVi ?? '' }) };
    case 'ADVENTURE_BATTLE_STARTED':
      return { sound: 'notify', toast: e.boss ? T.boss : e.elite ? T.elite : T.battle };
    case 'ADVENTURE_BATTLE_WON':
      return { sound: 'level_up', toast: t(T.won, { exp: e.exp, coins: formatInt(e.coins) }) };
    case 'ADVENTURE_FLED':
      return { sound: 'ui_click', toast: T.fled };
    case 'ADVENTURE_CHEST_OPENED':
      return { sound: 'coin_collect', toast: Object.keys(e.items).length > 0 ? t(T.chest, { items: itemsText(e.items) }) : T.chestEmpty };
    case 'ADVENTURE_HARVESTED':
      return Object.keys(e.items).length > 0 ? { sound: 'coin_collect', toast: t(T.harvest, { items: itemsText(e.items) }) } : null;
    case 'ADVENTURE_GATE_OPENED':
      return { sound: 'level_up', toast: t(T.gate, { element: elementName(e.element) }) };
    case 'ADVENTURE_SPRING':
      return { sound: 'notify', toast: T.spring };
    case 'ADVENTURE_LORE_FOUND':
      return { sound: 'notify', toast: T.lore };
    case 'ADVENTURE_SHRINE_BLESSED':
      return { sound: 'level_up', toast: t(T.shrine, { element: elementName(e.element), pct: Math.round(e.pct * 100) }) };
    case 'ADVENTURE_PORTAL_ACTIVATED':
      return { sound: 'level_up', toast: T.portal };
    case 'ADVENTURE_ZONE_CLEARED':
      return { sound: 'birth_fanfare', toast: T.cleared };
    case 'ADVENTURE_LEVEL_UP':
      return { sound: 'level_up', toast: t(T.levelUp, { name: e.name, level: e.level }) };
    case 'ADVENTURE_SP_GAINED':
      return { sound: 'level_up', toast: `+${e.amount} SP` };
    case 'ADVENTURE_EXHAUSTED':
      return { sound: 'notify', toast: t(T.exhausted, { hours: AB.run.exhaustHours }) };
    case 'ADVENTURE_ITEM_USED':
      return { sound: 'ui_click', toast: t(T.itemUsed, { item: itemName(e.itemId) }) };
    case 'ADVENTURE_EQUIPPED':
      return { sound: 'ui_click', toast: t(T.equipped, { item: itemName(e.itemId) }) };
    case 'ADVENTURE_UNEQUIPPED':
      return { sound: 'ui_click', toast: t(T.unequipped, { item: itemName(e.itemId) }) };
    case 'ADVENTURE_LOOT_COLLECTED':
      return { sound: 'coin_collect', toast: t(e.left > 0 ? T.lootLeft : T.loot, { items: itemsText(e.items), left: e.left }) };
    case 'ADVENTURE_RUN_ENDED':
      return e.result === 'win' ? { sound: 'level_up', toast: T.cleared } : e.result === 'retreat' ? { sound: null, toast: T.returned } : null;
    case 'ADVENTURE_NODE_OPENED':
      return { sound: 'level_up', toast: t(T.node, { skill: SKILLS[NODES[e.nodeId]?.skill ?? '']?.nameVi ?? '', level: e.level }) };
    case 'ADVENTURE_CLASS_CHANGED':
      return { sound: 'level_up', toast: T.classChanged };
    case 'ADVENTURE_TREE_RESET':
      return { sound: 'ui_click', toast: T.reset };
    case 'ADVENTURE_SWEPT':
      return { sound: 'coin_collect', toast: t(T.swept, { exp: e.exp, coins: formatInt(e.coins) }) };
    case 'ADVENTURE_LEVEL':
      return { sound: 'level_up', toast: t(T.levelUpWorld, { level: e.level }) };
    default:
      return null;
  }
}
