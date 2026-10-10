// The Cloud's events as standard world events (ARCHITECTURE §7): what other Areas and world systems (goals, codex,
// achievements) may react to. The Cloud's screens keep using its own detailed events.
import type { EventBase, WorldEvent } from '../../../core/events';
import { RECIPES } from '../../../core/config/recipes';
import { FERTILIZER_ITEM, FLOWERS, CLOUD_AREA_ID, WATER_ITEM } from './config/content';
import { isCloudEvent, type CloudEvent } from './events';

const area = CLOUD_AREA_ID;
const coins = (amount: number): WorldEvent[] => (amount === 0 ? [] : [{ type: 'currency.changed', area, currency: 'coins', amount }]);
const added = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.added', area, itemId, quantity }] : []);
const removed = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.removed', area, itemId, quantity }] : []);
const each = (counts: Readonly<Record<string, number>>, times: number, make: typeof added): WorldEvent[] =>
  Object.entries(counts).flatMap(([id, n]) => make(id, n * times));

export function cloudWorldEvents(e: CloudEvent): WorldEvent[] {
  switch (e.type) {
    case 'CLOUD_PLANTED': {
      const flower = FLOWERS[e.flowerId];
      return [...(flower ? removed(flower.seedItem, e.plots.length - e.bought) : []), ...coins(-e.gold)];
    }
    case 'CLOUD_WATERED':
      return removed(WATER_ITEM, e.plots);
    case 'CLOUD_FERTILIZED':
      return removed(FERTILIZER_ITEM, e.plots.length);
    case 'CLOUD_HARVESTED': {
      const flower = FLOWERS[e.flowerId];
      if (!flower) return [];
      return [{ type: 'flower.harvested', area, flowerId: e.flowerId, itemId: flower.produceItem, quantity: e.quantity }, ...added(flower.produceItem, e.quantity)];
    }
    case 'CLOUD_WATER_COLLECTED':
      return added(WATER_ITEM, e.quantity);
    case 'CLOUD_SPRING_UPGRADED':
      return [...coins(-e.gold), ...Object.entries(e.materials).flatMap(([id, n]) => removed(id, n ?? 0))];
    case 'CLOUD_PLOTS_BOUGHT':
    case 'CLOUD_CAULDRON_BUILT':
      return coins(-e.gold);
    case 'CLOUD_BREW_STARTED': {
      const recipe = RECIPES[e.recipeId];
      return recipe ? each(recipe.inputs, e.batches, removed) : [];
    }
    case 'CLOUD_BREW_COLLECTED': {
      const recipe = RECIPES[e.recipeId];
      if (!recipe) return [];
      const made: WorldEvent[] = Object.entries(recipe.outputs).map(([itemId, n]) => ({ type: 'potion.brewed', area, itemId, quantity: n * e.batches }));
      return [...each(recipe.outputs, e.batches, added), ...made];
    }
    case 'CLOUD_LEVEL_UP':
      return [{ type: 'area.levelUp', area, level: e.level }];
    default:
      return [];
  }
}

export const cloudEventsToWorld = (events: readonly EventBase[]): WorldEvent[] => events.filter(isCloudEvent).flatMap(cloudWorldEvents);
