// The farm's events as standard world events (ARCHITECTURE §7): what other Areas and world systems
// (goals, codex, achievements) may react to. The farm's screens keep using its own detailed events.
// An event that carries no amount (PIG_BOUGHT, BREEDING_STARTED) maps to no currency.changed.
import type { EventBase, WorldEvent } from '../../../core/events';
import type { GameEvent } from './events';
import { FARM_AREA_ID } from './save/lens';

const area = FARM_AREA_ID;
const coins = (amount: number): WorldEvent[] =>
  amount === 0 ? [] : [{ type: 'currency.changed', area, currency: 'coins', amount }];
const added = (itemId: string, quantity: number): WorldEvent[] =>
  quantity > 0 ? [{ type: 'item.added', area, itemId, quantity }] : [];
const removed = (itemId: string, quantity: number): WorldEvent[] =>
  quantity > 0 ? [{ type: 'item.removed', area, itemId, quantity }] : [];

export function farmWorldEvents(e: GameEvent): WorldEvent[] {
  switch (e.type) {
    case 'BIRTH':
      return [{ type: 'creature.born', area, creatureId: e.childId, breed: e.childBreed }];
    case 'PIG_SOLD':
      return [{ type: 'creature.sold', area, creatureId: e.pigId, amount: e.gold }, ...coins(e.gold)];
    case 'PIG_BECAME_SICK':
      return [{ type: 'creature.sick', area, creatureId: e.pigId }];
    case 'PIG_BECAME_CRITICAL':
      return [{ type: 'creature.critical', area, creatureId: e.pigId }];
    case 'PIG_DIED':
      return [{ type: 'creature.died', area, creatureId: e.pigId }];
    case 'LEVEL_UP':
      return [{ type: 'area.levelUp', area, level: e.level }];
    case 'DISCOVERY':
      return [{ type: 'codex.discovered', area, kind: 'breed', id: e.id }, ...coins(e.gold)];
    case 'ACHIEVEMENT_REACHED':
      return [{ type: 'achievement.unlocked', area, achievementId: e.id }];
    case 'ORDER_FULFILLED':
      return [{ type: 'order.completed', area, orderId: e.orderId }, ...coins(e.gold)];
    case 'ITEM_BOUGHT':
      return [...added(e.itemId, e.quantity), ...coins(e.gold)];
    case 'TROUGH_FILLED':
      return [...removed('FOOD_BASIC', e.fromInventory), ...coins(e.gold)];
    case 'MANURE_CLEANED':
      return added('item_manure', e.kept);
    case 'ITEM_SOLD':
      return [...removed(e.itemId, e.quantity), ...coins(e.gold)];
    case 'PIG_FED':
      return removed(e.itemId ?? 'FOOD_BASIC', 1);
    case 'PIG_PETTED':
      return [{ type: 'creature.petted', area, creatureId: e.pigId, hearts: e.hearts }];
    case 'PIG_PURPOSE_SET':
      return [{ type: 'creature.purposeSet', area, creatureId: e.pigId, purpose: e.purpose }];
    case 'PIG_TREATED':
      return removed('MEDICINE_COMMON', 1);
    case 'DAILY_CLAIMED':
    case 'RELIEF_CLAIMED':
      return [...added('FOOD_BASIC', e.food), ...added('MEDICINE_COMMON', e.medicine), ...coins(e.gold)];
    case 'TROUGH_UPGRADED':
    case 'GIFT_OPENED':
    case 'ACHIEVEMENT_CLAIMED':
    case 'SLOT_BOUGHT':
    case 'DECOR_BOUGHT':
      return coins(e.gold);
    default:
      return [];
  }
}

/** The Area hook: the farm's events among the store's (others map to nothing). */
export const farmEventsToWorld = (events: readonly EventBase[]): WorldEvent[] =>
  (events as readonly GameEvent[]).flatMap(farmWorldEvents);
