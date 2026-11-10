// What the Garden's events say and play (spec §11.3): sound and toast per event, data-driven like the farm's table.
// Handed to the FeedbackDirector, the one place that turns events into presentation. Pure.
import type { AudioKey } from '../../core/config/assetIds';
import { RECIPES } from '../../core/config/recipes';
import type { ItemId } from '../../core/config/ids';
import type { AreaVfx, EventBase } from '../../core/events';
import { upgradeVfx } from '../../systems/animation/upgradeFx';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { CROPS, GARDEN_TIERS, type BuildingId } from './logic/config/content';
import { isGardenEvent } from './logic/events';

export interface Presentation {
  sound: AudioKey | null;
  toast: string | null;
  /** A one-shot picture the scene plays (decision 057, B6: the upgrade effect). */
  vfx?: AreaVfx;
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
      return { sound: 'water_splash', toast: e.tip ? t(T.wateredTip, { count: e.plots, tip: e.tip }) : t(T.watered, { count: e.plots }) };
    case 'GARDEN_FERTILIZED':
      return { sound: 'water_splash', toast: t(T.fertilized, { count: e.plots.length }) };
    case 'GARDEN_HARVESTED': {
      const name = itemName(CROPS[e.cropId]?.produceItem ?? '');
      return { sound: 'feed_munch', toast: t(e.bonus > 0 ? T.harvestedBonus : T.harvested, { quantity: e.quantity, name, bonus: e.bonus }) };
    }
    case 'GARDEN_CROP_RIPE':
      return { sound: 'notify', toast: t(T.ripe, { count: e.count }) };
    case 'GARDEN_CROP_WILTED':
      return { sound: 'notify', toast: t(T.wilted, { count: e.count }) };
    case 'GARDEN_PLOTS_BOUGHT':
      return { sound: 'level_up', toast: e.zone !== undefined ? t(T.zone, { name: vi.garden.zoneNames[e.zone] ?? '' }) : t(T.plots, { plots: e.plots }), ...(e.zone !== undefined ? { vfx: upgradeVfx({ area: 'garden', group: e.zone, rank: 1, opened: true }) } : {}) };
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
    case 'GARDEN_SHOP_BOUGHT':
      return { sound: 'coin_collect', toast: t(T.bought, { count: formatInt(e.count), name: itemName(e.itemId) }) };
    case 'GARDEN_CROSSED': {
      const L = vi.lab.toast;
      const name = CROPS[e.cropId]?.nameVi ?? '';
      if (e.success) return { sound: 'level_up', toast: e.firstTime ? t(L.first, { name }) : t(L.success, { count: e.seeds, name: itemName(e.seedItem ?? '') }) };
      return { sound: 'notify', toast: e.seeds > 0 && e.seedItem ? t(L.fail, { count: e.seeds, name: itemName(e.seedItem) }) : L.failEmpty };
    }
    case 'GARDEN_ZONE_UPGRADED': {
      const id = GARDEN_TIERS.ids[e.tier - 1] ?? '';
      return { sound: 'level_up', toast: t(T.rankUp, { zone: vi.garden.zoneNames[e.group] ?? '', rank: e.tier, name: vi.garden.rankNames[id as keyof typeof vi.garden.rankNames] ?? id }), vfx: upgradeVfx({ area: 'garden', group: e.group, rank: e.tier, opened: false }) };
    }
    case 'GARDEN_SKIN_APPLIED': {
      const group = vi.garden.zoneNames[e.group] ?? '';
      return { sound: 'notify', toast: e.skinId ? t(vi.plotSkin.applied, { group, name: vi.plotSkin.names[e.skinId as keyof typeof vi.plotSkin.names] ?? e.skinId }) : t(vi.plotSkin.plained, { group }) };
    }
    case 'GARDEN_LEVEL_UP':
      return { sound: 'level_up', toast: t(T.levelUp, { level: e.level }) };
  }
}

