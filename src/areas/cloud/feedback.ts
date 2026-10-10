// What the Cloud's events say and play (spec §11.3): sound and toast per event, data-driven like the Garden's table.
// Handed to the FeedbackDirector, the one place that turns events into presentation. Pure.
import type { AudioKey } from '../../core/config/assetIds';
import { RECIPES } from '../../core/config/recipes';
import type { ItemId } from '../../core/config/ids';
import type { EventBase } from '../../core/events';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { FLOWERS } from './logic/config/content';
import { isCloudEvent } from './logic/events';

export interface Presentation {
  sound: AudioKey | null;
  toast: string | null;
}

const T = vi.cloud.toast;
const itemName = (id: string) => vi.shop[id as ItemId] ?? id;

/** A catch-up is never replayed (§9.5): the away summary covers it. */
export function cloudPresentation(e: EventBase, origin: 'action' | 'tick' | 'catchup'): Presentation | null {
  if (!isCloudEvent(e) || origin === 'catchup') return null;
  switch (e.type) {
    case 'CLOUD_PLANTED':
      return { sound: null, toast: t(T.planted, { count: e.plots.length, name: FLOWERS[e.flowerId]?.nameVi ?? '' }) };
    case 'CLOUD_WATERED':
      return { sound: 'water_splash', toast: t(T.watered, { count: e.plots }) };
    case 'CLOUD_FERTILIZED':
      return { sound: 'water_splash', toast: t(T.fertilized, { count: e.plots.length }) };
    case 'CLOUD_HARVESTED': {
      const name = itemName(FLOWERS[e.flowerId]?.produceItem ?? '');
      const text = e.left > 0 ? T.harvestedLeft : e.night ? T.harvestedNight : T.harvested;
      return { sound: 'feed_munch', toast: t(text, { quantity: e.quantity, name, left: e.left }) };
    }
    case 'CLOUD_FLOWER_RIPE':
      return { sound: 'notify', toast: t(T.ripe, { count: e.count }) };
    case 'CLOUD_FLOWER_WILTED':
      return { sound: 'notify', toast: t(T.wilted, { count: e.count }) };
    case 'CLOUD_PLOTS_BOUGHT':
      return { sound: 'level_up', toast: t(T.plots, { plots: e.plots }) };
    case 'CLOUD_WATER_COLLECTED':
      return { sound: 'water_splash', toast: t(e.left > 0 ? T.waterLeft : T.water, { quantity: e.quantity, left: e.left }) };
    case 'CLOUD_SPRING_UPGRADED':
      return { sound: 'level_up', toast: t(T.spring, { level: e.level }) };
    case 'CLOUD_CAULDRON_BUILT':
      return { sound: 'level_up', toast: T.built };
    case 'CLOUD_BREW_STARTED':
      return { sound: null, toast: t(T.started, { batches: e.batches }) };
    case 'CLOUD_BREW_DONE':
      return { sound: 'notify', toast: t(T.brewDone, { batches: e.batches }) };
    case 'CLOUD_BREW_COLLECTED': {
      const recipe = RECIPES[e.recipeId];
      const items = recipe ? Object.entries(recipe.outputs).map(([id, n]) => `${formatInt(n * e.batches)} ${itemName(id)}`).join(', ') : '';
      return { sound: 'coin_collect', toast: t(T.collected, { items }) };
    }
    case 'CLOUD_LEVEL_UP':
      return { sound: 'level_up', toast: t(T.levelUp, { level: e.level }) };
  }
}
