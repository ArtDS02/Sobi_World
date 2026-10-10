// The Garden's events as standard world events (ARCHITECTURE §7): what other Areas and world systems
// (goals, codex, achievements) may react to. The Garden's screens keep using its own detailed events.
import type { EventBase, WorldEvent } from '../../../core/events';
import { RECIPES } from '../../../core/config/recipes';
import { CROPS, GARDEN_AREA_ID } from './config/content';
import { isGardenEvent, type GardenEvent } from './events';

const area = GARDEN_AREA_ID;
const coins = (amount: number): WorldEvent[] => (amount === 0 ? [] : [{ type: 'currency.changed', area, currency: 'coins', amount }]);
const added = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.added', area, itemId, quantity }] : []);
const removed = (itemId: string, quantity: number): WorldEvent[] => (quantity > 0 ? [{ type: 'item.removed', area, itemId, quantity }] : []);
const each = (counts: Readonly<Record<string, number>>, times: number, make: typeof added): WorldEvent[] =>
  Object.entries(counts).flatMap(([id, n]) => make(id, n * times));

export function gardenWorldEvents(e: GardenEvent): WorldEvent[] {
  switch (e.type) {
    case 'GARDEN_PLANTED': {
      const crop = CROPS[e.cropId];
      const sown: WorldEvent[] = e.plots.map((i) => ({ type: 'crop.planted', area, plotId: `plot_${i}`, cropId: e.cropId }));
      return [...sown, ...(crop ? removed(crop.seedItem, e.plots.length - e.bought) : []), ...coins(-e.gold)];
    }
    case 'GARDEN_FERTILIZED':
      return removed('item_fertilizer', e.plots.length);
    case 'GARDEN_HARVESTED': {
      const crop = CROPS[e.cropId];
      return [{ type: 'crop.harvested', area, plotId: 'garden', cropId: e.cropId, quantity: e.quantity }, ...(crop ? added(crop.produceItem, e.quantity) : [])];
    }
    case 'GARDEN_PLOTS_BOUGHT':
    case 'GARDEN_SPRINKLER_BOUGHT':
    case 'GARDEN_BUILT':
      return coins(-e.gold);
    case 'GARDEN_CRAFT_STARTED': {
      const recipe = RECIPES[e.recipeId];
      return recipe ? each(recipe.inputs, e.batches, removed) : [];
    }
    case 'GARDEN_BATCH_DONE':
      return Array.from({ length: e.batches }, () => ({ type: 'recipe.completed', area, recipeId: e.recipeId }) satisfies WorldEvent);
    case 'GARDEN_CRAFT_COLLECTED': {
      const recipe = RECIPES[e.recipeId];
      return recipe ? each(recipe.outputs, e.batches, added) : [];
    }
    case 'GARDEN_LEVEL_UP':
      return [{ type: 'area.levelUp', area, level: e.level }];
    default:
      return [];
  }
}

export const gardenEventsToWorld = (events: readonly EventBase[]): WorldEvent[] => events.filter(isGardenEvent).flatMap(gardenWorldEvents);
