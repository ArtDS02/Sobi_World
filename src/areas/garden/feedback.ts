// What the Garden's events say and play (spec §11.3): sound and toast per event, data-driven like the farm's table.
// Handed to the FeedbackDirector, the one place that turns events into presentation. Pure.
import type { AudioKey } from '../../core/config/assetIds';
import { RECIPES } from '../../core/config/recipes';
import type { ItemId } from '../../core/config/ids';
import type { EventBase } from '../../core/events';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { CROPS, type BuildingId } from './logic/config/content';
import { isGardenEvent } from './logic/events';

export interface Presentation {
  sound: AudioKey | null;
  toast: string | null;
}

const T = vi.garden.toast;
const itemName = (id: string) => vi.shop[id as ItemId] ?? id;
const buildingName = (b: BuildingId) => (b === 'mill' ? vi.garden.mill : vi.garden.composter);

/** A catch-up is never replayed (§9.5): the away summary covers it. */
export function gardenPresentation(e: EventBase, origin: 'action' | 'tick' | 'catchup'): Presentation | null {
  if (!isGardenEvent(e) || origin === 'catchup') return null;
  switch (e.type) {
    case 'GARDEN_PLANTED':
      return { sound: null, toast: t(T.planted, { count: e.plots.length, name: CROPS[e.cropId]?.nameVi ?? '' }) };
    case 'GARDEN_WATERED':
      return { sound: 'water_splash', toast: t(T.watered, { count: e.plots }) };
    case 'GARDEN_FERTILIZED':
      return { sound: 'water_splash', toast: t(T.fertilized, { count: e.plots.length }) };
    case 'GARDEN_HARVESTED': {
      const name = itemName(CROPS[e.cropId]?.produceItem ?? '');
      return { sound: 'feed_munch', toast: t(e.left > 0 ? T.harvestedLeft : T.harvested, { quantity: e.quantity, name, left: e.left }) };
    }
    case 'GARDEN_CROP_RIPE':
      return { sound: 'notify', toast: t(T.ripe, { count: e.count }) };
    case 'GARDEN_CROP_WILTED':
      return { sound: 'notify', toast: t(T.wilted, { count: e.count }) };
    case 'GARDEN_PLOTS_BOUGHT':
      return { sound: 'level_up', toast: t(T.plots, { plots: e.plots }) };
    case 'GARDEN_SPRINKLER_BOUGHT':
      return { sound: 'level_up', toast: t(T.sprinkler, { level: e.level }) };
    case 'GARDEN_BUILT':
      return { sound: 'level_up', toast: t(T.built, { name: buildingName(e.building) }) };
    case 'GARDEN_CRAFT_STARTED':
      return { sound: null, toast: t(T.started, { name: buildingName(e.building), batches: e.batches }) };
    case 'GARDEN_BATCH_DONE':
      return { sound: 'notify', toast: t(T.batchDone, { name: buildingName(e.building), batches: e.batches }) };
    case 'GARDEN_CRAFT_COLLECTED': {
      const recipe = RECIPES[e.recipeId];
      const items = recipe ? Object.entries(recipe.outputs).map(([id, n]) => `${formatInt(n * e.batches)} ${itemName(id)}`).join(', ') : '';
      return { sound: 'coin_collect', toast: t(T.collected, { items }) };
    }
    case 'GARDEN_LEVEL_UP':
      return { sound: 'level_up', toast: t(T.levelUp, { level: e.level }) };
  }
}

