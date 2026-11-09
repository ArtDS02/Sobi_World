// The rank (upgrade tier) side of the Cloud's screens (decision 056): the dialog's data for one cloud tier.
import { WORLD_LEVELS } from '../../../core/config/progression';
import { worldLevel } from '../../../core/progression/levels';
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { rankLine, rankOfGroup, tierUpgradeVm, type TierUpgradeVm } from '../../../ui/world/tierUpgradeVm';
import { CLOUD_TIERS, PLOTS_PER_TIER, tierOf } from '../logic/config/content';
import { cloudTierLevel } from '../logic/derived';
import { cloudOf } from '../logic/save/lens';
import type { CloudState } from '../logic/state';

export const cloudRankName = (id: string): string => vi.cloud.rankNames[id as keyof typeof vi.cloud.rankNames] ?? id;

/** The upgrade dialog of cloud tier `group` (0-based). */
export function tierRankVm(world: WorldSave, group: number): TierUpgradeVm {
  const g = cloudOf(world);
  return tierUpgradeVm({
    rules: CLOUD_TIERS,
    rankName: cloudRankName,
    groupName: t(vi.cloud.tierTitle, { n: group + 1, name: vi.cloud.tierNames[group] ?? '' }),
    group,
    rank: cloudTierLevel(g, group),
    plotsOwned: g.plots.length,
    plotsPerGroup: PLOTS_PER_TIER,
    worldLevel: worldLevel(world, WORLD_LEVELS),
    coins: world.wallet.coins,
    bag: world.inventory.items,
  });
}

/** The rank and bonus of the cloud tier plot `index` stands on, as one line for the plot card. */
export const plotRankLine = (g: Pick<CloudState, 'tierLevels'>, index: number): string =>
  rankLine(rankOfGroup(CLOUD_TIERS, cloudRankName, cloudTierLevel(g, tierOf(index))), CLOUD_TIERS);
