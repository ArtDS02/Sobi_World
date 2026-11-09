// What the upgrade dialog of a cloud tier / garden zone shows (decision 056): the rank now and after, what it costs against
// what the player has, where to get the missing items, and a button that always says why it is off. Pure; shared by the Cloud and
// the Garden (each passes its own rules and rank names).
import { ITEMS } from '../../core/config/items';
import type { ItemId } from '../../core/config/ids';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { bonusPctOf, maxTier, nextUpgrade, upgradeBlock, type TierRules } from '../../systems/plants/tiers';

export interface RankVm {
  /** 1..5 */
  rank: number;
  name: string;
  /** Yield bonus, percent. */
  bonus: number;
}

export interface CostRowVm {
  /** `coins` or an item id. */
  id: string;
  label: string;
  have: number;
  need: number;
  ok: boolean;
  /** Where the item comes from (empty for coins). */
  source: string;
}

export interface TierUpgradeVm {
  /** "Tầng 2 · Tầng Mây Cầu Vồng". */
  groupName: string;
  now: RankVm;
  /** Null at the top rank. */
  after: RankVm | null;
  rows: CostRowVm[];
  /** The one-off XP of the upgrade. */
  xp: number;
  button: { label: string; reason: string | null };
}

export interface TierUpgradeInput {
  rules: TierRules;
  /** Rank name by tier id (string tables). */
  rankName: (tierId: string) => string;
  groupName: string;
  group: number;
  /** Current rank (1..5). */
  rank: number;
  plotsOwned: number;
  plotsPerGroup: number;
  worldLevel: number;
  coins: number;
  bag: Readonly<Record<string, number | undefined>>;
}

const rankOf = (rules: TierRules, name: (id: string) => string, rank: number): RankVm => ({
  rank,
  name: name(rules.ids[rank - 1] ?? ''),
  bonus: bonusPctOf(rules, rank),
});

/** "Aquarium" for a scale, "Adventure" for a cog… from the item's own Area. */
const sourceOf = (itemId: string): string => {
  const area = ITEMS[itemId as ItemId]?.area;
  return area ? (vi.plotTier.from[area as keyof typeof vi.plotTier.from] ?? '') : '';
};

export function tierUpgradeVm(i: TierUpgradeInput): TierUpgradeVm {
  const step = nextUpgrade(i.rules, i.group, i.rank);
  const now = rankOf(i.rules, i.rankName, i.rank);
  const after = step ? rankOf(i.rules, i.rankName, step.tier) : null;
  const rows: CostRowVm[] = [];
  if (step) {
    rows.push({ id: 'coins', label: vi.plotTier.coins, have: i.coins, need: step.coins, ok: i.coins >= step.coins, source: '' });
    for (const [itemId, need] of Object.entries(step.items)) {
      const have = i.bag[itemId] ?? 0;
      rows.push({ id: itemId, label: vi.shop[itemId as ItemId] ?? itemId, have, need, ok: have >= need, source: sourceOf(itemId) });
    }
  }
  const block = upgradeBlock(step, { plotsOwned: i.plotsOwned, plotsPerGroup: i.plotsPerGroup, group: i.group, worldLevel: i.worldLevel });
  let reason: string | null = null;
  if (block === 'MAX') reason = vi.plotTier.maxed;
  else if (block === 'GROUP_INCOMPLETE') reason = t(vi.plotTier.needPlots, { plots: (i.group + 1) * i.plotsPerGroup });
  else if (block === 'LEVEL') reason = t(vi.plotTier.needLevel, { level: step?.worldLevel ?? 0 });
  else if (rows[0] && !rows[0].ok) reason = t(vi.plotTier.needCoins, { n: formatInt(rows[0].need - rows[0].have) });
  else if (rows.some((r) => !r.ok)) reason = vi.plotTier.needItems;
  return {
    groupName: i.groupName,
    now,
    after,
    rows,
    xp: step?.xp ?? 0,
    button: { label: step ? t(vi.plotTier.upgradeTo, { rank: step.tier }) : vi.plotTier.maxed, reason },
  };
}

/** The one-line rank + bonus of a group, for the banner and the plot card. */
export const rankLine = (rank: RankVm, rules: TierRules): string =>
  rank.bonus > 0
    ? t(vi.plotTier.line, { rank: rank.rank, max: maxTier(rules), name: rank.name, bonus: rank.bonus })
    : t(vi.plotTier.lineBase, { rank: rank.rank, max: maxTier(rules), name: rank.name });

export const rankOfGroup = (rules: TierRules, rankName: (id: string) => string, rank: number): RankVm => rankOf(rules, rankName, rank);
