// The Adventure's events as standard world events (ARCHITECTURE §7): what other Areas and world systems (goals, achievements)
// may react to. The Adventure's screens keep using its own detailed events.
import type { EventBase, WorldEvent } from '../../../core/events';
import { ADVENTURE_AREA_ID, BATTLE_ITEMS } from './config/content';
import { isAdventureEvent, type AdventureEvent } from './events';

const area = ADVENTURE_AREA_ID;
const added = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.added', area, itemId, quantity }] : []);
const removed = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.removed', area, itemId, quantity }] : []);
const coins = (amount: number): WorldEvent[] => (amount === 0 ? [] : [{ type: 'currency.changed', area, currency: 'coins', amount }]);

export function adventureWorldEvents(e: AdventureEvent): WorldEvent[] {
  switch (e.type) {
    case 'ADVENTURE_BATTLE_WON':
      return [{ type: 'battle.won', area, zoneId: e.zoneId, enemies: e.enemies }, ...coins(e.coins)];
    case 'ADVENTURE_CHEST_OPENED':
      return [...coins(e.coins), ...(e.gems > 0 ? [{ type: 'currency.changed', area, currency: 'gems', amount: e.gems } satisfies WorldEvent] : [])];
    case 'ADVENTURE_RUN_ENDED':
      return e.result === 'retreat' ? [] : [{ type: 'adventure.finished', area, zoneId: e.zoneId, won: e.result === 'win' }];
    case 'ADVENTURE_LOOT_COLLECTED':
      return Object.entries(e.items).flatMap(([id, n]) => added(id, n));
    case 'ADVENTURE_ITEM_USED':
      return BATTLE_ITEMS[e.itemId] ? removed(e.itemId, 1) : [];
    case 'ADVENTURE_EQUIPPED':
      return removed(e.itemId, 1);
    case 'ADVENTURE_UNEQUIPPED':
      return added(e.itemId, 1);
    case 'ADVENTURE_LEVEL_UP':
      return [{ type: 'creature.levelUp', area, creatureId: e.key, level: e.level }];
    case 'ADVENTURE_LEVEL':
      return [{ type: 'area.levelUp', area, level: e.level }];
    default:
      return [];
  }
}

export const adventureEventsToWorld = (events: readonly EventBase[]): WorldEvent[] => events.filter(isAdventureEvent).flatMap(adventureWorldEvents);
