// Upgrade tiers of a plot group (a cloud tier or a garden zone; decision 056). Pure: the numbers come from the Area's
// content, the dice from the action's seeded rng. A group's tier is stored sparsely: absent = tier 1.
import type { Rng } from '../../core/rng';

export interface TierStep {
  worldLevel: number;
  baseCoins: number;
  items: Readonly<Record<string, number | undefined>>;
  /** Yield bonus (percent) once the group has reached the tier this step opens. */
  bonusPct: number;
}

export interface TierRules {
  /** Tier ids, tier 1 first (names live in the string tables). */
  ids: readonly string[];
  groupFactor: number;
  xpPerTier: number;
  /** `steps[n]` takes a group from tier n + 1 to n + 2. */
  steps: readonly TierStep[];
}

export const maxTier = (rules: TierRules): number => rules.ids.length;

/** The tier of group `group` (0-based) in a sparse list; 1 when nothing is stored. */
export const tierOfGroup = (levels: readonly number[] | undefined, group: number): number => levels?.[group] ?? 1;

/** The list with group `group` set to `tier` (padded with 1). */
export function withTier(levels: readonly number[] | undefined, group: number, tier: number): number[] {
  const next = [...(levels ?? [])];
  while (next.length <= group) next.push(1);
  next[group] = tier;
  return next;
}

/** Yield bonus (percent) of a tier: 0 at tier 1. */
export const bonusPctOf = (rules: TierRules, tier: number): number => (tier <= 1 ? 0 : (rules.steps[Math.min(tier, maxTier(rules)) - 2]?.bonusPct ?? 0));

/** Coins of a step for group `group` (0-based). */
export const stepCoins = (rules: TierRules, step: TierStep, group: number): number => Math.round(step.baseCoins * (1 + rules.groupFactor * group));

export interface UpgradeStep {
  /** The tier it reaches. */
  tier: number;
  worldLevel: number;
  coins: number;
  items: Readonly<Record<string, number>>;
  bonusPct: number;
  xp: number;
}

/** The step that takes group `group` from `tier` to the next one, or null at the top. */
export function nextUpgrade(rules: TierRules, group: number, tier: number): UpgradeStep | null {
  const step = rules.steps[tier - 1];
  if (!step || tier >= maxTier(rules)) return null;
  const items = Object.fromEntries(Object.entries(step.items).filter((e): e is [string, number] => (e[1] ?? 0) > 0));
  return { tier: tier + 1, worldLevel: step.worldLevel, coins: stepCoins(rules, step, group), items, bonusPct: step.bonusPct, xp: rules.xpPerTier * (tier + 1) };
}

/** Why an upgrade is not available (the UI says it; `null` = it can be bought now apart from coins and items). */
export type UpgradeBlock = 'MAX' | 'GROUP_INCOMPLETE' | 'LEVEL';

export function upgradeBlock(step: UpgradeStep | null, input: { plotsOwned: number; plotsPerGroup: number; group: number; worldLevel: number }): UpgradeBlock | null {
  if (!step) return 'MAX';
  if (input.plotsOwned < (input.group + 1) * input.plotsPerGroup) return 'GROUP_INCOMPLETE';
  if (input.worldLevel < step.worldLevel) return 'LEVEL';
  return null;
}

/**
 * Items of one harvest after the tier bonus: each of the `quantity` items has `pct` % to come with one more. Deterministic
 * for a seeded rng; the expectation is quantity x pct / 100. Returns the extra items only.
 */
export function bonusItems(quantity: number, pct: number, rng: Rng): number {
  if (pct <= 0 || quantity <= 0) return 0;
  let extra = 0;
  for (let i = 0; i < quantity; i += 1) if (rng.next() * 100 < pct) extra += 1;
  return extra;
}
