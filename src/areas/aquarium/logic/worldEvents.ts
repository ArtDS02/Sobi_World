// The Aquarium's events as standard world events (ARCHITECTURE §7): what other Areas and world systems (goals, codex,
// achievements) may react to. The Aquarium's screens keep using its own detailed events.
import type { EventBase, WorldEvent } from '../../../core/events';
import { AB, AQUARIUM_AREA_ID, FEED_ITEM, FISH, MEDICINE_ITEM, SCALE_ITEM, TANK_LEVELS } from './config/content';
import { isAquariumEvent, type AquariumEvent } from './events';

const area = AQUARIUM_AREA_ID;
const coins = (amount: number): WorldEvent[] => (amount === 0 ? [] : [{ type: 'currency.changed', area, currency: 'coins', amount }]);
const added = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.added', area, itemId, quantity }] : []);
const removed = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.removed', area, itemId, quantity }] : []);

export function aquariumWorldEvents(e: AquariumEvent): WorldEvent[] {
  switch (e.type) {
    case 'AQUARIUM_FISH_FED':
      return e.bought ? [] : removed(e.itemId, 1);
    case 'AQUARIUM_FEED_BOUGHT':
      return coins(-e.gold);
    case 'AQUARIUM_FISH_PETTED':
      return [{ type: 'creature.petted', area, creatureId: e.fishId, hearts: e.hearts }];
    case 'AQUARIUM_FISH_TREATED':
      return removed(MEDICINE_ITEM, 1);
    case 'AQUARIUM_WATER_CHANGED':
      return [{ type: 'tank.cleaned', area }];
    case 'AQUARIUM_CAST': {
      if (!e.itemId || e.quantity === 0) return [];
      const caught: WorldEvent[] = e.speciesId ? [{ type: 'fish.caught', area, speciesId: e.speciesId, itemId: e.itemId }] : [];
      return [...added(e.itemId, e.quantity), ...caught];
    }
    case 'AQUARIUM_RELEASED': {
      const species = FISH[e.speciesId];
      return species ? removed(species.item, 1) : [];
    }
    case 'AQUARIUM_FISH_SOLD':
      return [{ type: 'creature.sold', area, creatureId: e.fishId, amount: e.gold }, ...coins(e.gold)];
    case 'AQUARIUM_CATCH_SOLD':
      return [...removed(e.itemId, e.quantity), ...coins(e.gold)];
    case 'AQUARIUM_SCALES_COLLECTED':
      return added(SCALE_ITEM, e.quantity);
    case 'AQUARIUM_TANK_UPGRADED': {
      const materials = Object.entries(TANK_LEVELS[e.level - 1]?.materials ?? {}).flatMap(([id, n]) => removed(id, n ?? 0));
      return [...coins(-e.gold), ...materials];
    }
    case 'AQUARIUM_EGGS_LAID':
      return removed(FEED_ITEM, AB.breeding.feed);
    case 'AQUARIUM_EGG_HATCHED':
      return [{ type: 'creature.born', area, creatureId: e.fishId, breed: e.speciesId }];
    case 'AQUARIUM_FISH_SICK':
      return [{ type: 'creature.sick', area, creatureId: e.fishId }];
    case 'AQUARIUM_FISH_CRITICAL':
      return [{ type: 'creature.critical', area, creatureId: e.fishId }];
    case 'AQUARIUM_FISH_DIED':
      return [{ type: 'creature.died', area, creatureId: e.fishId }];
    case 'AQUARIUM_PURPOSE_SET':
      return [{ type: 'creature.purposeSet', area, creatureId: e.fishId, purpose: e.purpose }];
    case 'AQUARIUM_LEVEL_UP':
      return [{ type: 'area.levelUp', area, level: e.level }];
    default:
      return [];
  }
}

export const aquariumEventsToWorld = (events: readonly EventBase[]): WorldEvent[] => events.filter(isAquariumEvent).flatMap(aquariumWorldEvents);
