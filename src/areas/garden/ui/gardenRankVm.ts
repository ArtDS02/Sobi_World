// The rank (upgrade tier) side of the Garden's screens (decision 056): the dialog's data for one garden zone.
import { WORLD_LEVELS } from '../../../core/config/progression';
import { worldLevel } from '../../../core/progression/levels';
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { tierUpgradeVm, type TierUpgradeVm } from '../../../ui/world/tierUpgradeVm';
import { GARDEN_TIERS, PLOTS_PER_ZONE } from '../logic/config/content';
import { gardenZoneLevel } from '../logic/derived';
import { gardenOf } from '../logic/save/lens';
import { gardenRankName } from './gardenZoneVm';

/** The upgrade dialog of garden zone `group` (0-based). */
export function zoneRankVm(world: WorldSave, group: number): TierUpgradeVm {
  const g = gardenOf(world);
  return tierUpgradeVm({
    rules: GARDEN_TIERS,
    rankName: gardenRankName,
    groupName: t(vi.garden.zoneTitle, { n: group + 1, name: vi.garden.zoneNames[group] ?? '' }),
    group,
    rank: gardenZoneLevel(g, group),
    plotsOwned: g.plots.length,
    plotsPerGroup: PLOTS_PER_ZONE,
    worldLevel: worldLevel(world, WORLD_LEVELS),
    coins: world.wallet.coins,
    bag: world.inventory.items,
  });
}
