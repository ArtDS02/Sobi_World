// What the balance bot does with the plot upgrade ranks and the plot skins (decision 056), carefully: it raises the lowest-ranked
// cloud tier / garden zone that is complete and open once the coins and the materials are in hand with a cushion left, and it
// forges a skin with Gems it would otherwise never spend (never with coins). It keeps the materials these two need instead of
// selling them. Imports only src/.
import { GOALS } from '../../src/app/goals';
import { upgradeTier } from '../../src/areas/cloud/logic/actions/buildings';
import { CLOUD_TIERS, TIER_COUNT } from '../../src/areas/cloud/logic/config/content';
import { cloudTierUpgrade } from '../../src/areas/cloud/logic/derived';
import { cloudOf, hasCloud } from '../../src/areas/cloud/logic/save/lens';
import { upgradeZone } from '../../src/areas/garden/logic/actions/buildings';
import { GARDEN_TIERS, ZONE_COUNT } from '../../src/areas/garden/logic/config/content';
import { gardenZoneUpgrade } from '../../src/areas/garden/logic/derived';
import { gardenOf, hasGarden } from '../../src/areas/garden/logic/save/lens';
import { PLOT_SKINS } from '../../src/core/config/plotSkins';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { levelFromXp, worldXp } from '../../src/core/progression/levels';
import { skinStatus } from '../../src/core/plots/skins';
import type { Bot } from './week';

/** Coins left after an upgrade so feeds, seeds and cures are never unaffordable. */
const CUSHION = 5000;
/** Gems left after a forge: the Gems keep one more use (rerolling an order). */
const GEM_CUSHION = 100;

export interface PlotStats {
  /** Upgrades bought, and the hour (since the start) each rank was first reached in each Area. */
  upgrades: number;
  firstRankAtHour: Record<string, number>;
  upgradeCoins: number;
  skinsForged: number;
  skinGems: number;
  /** Extra items the yield bonus gave. */
  bonusItems: number;
}

export const newPlotStats = (): PlotStats => ({ upgrades: 0, firstRankAtHour: {}, upgradeCoins: 0, skinsForged: 0, skinGems: 0, bonusItems: 0 });

/** How many of an item the bot must hold for the most demanding upgrade step: it is not sold below this. */
export function keepForUpgrades(id: string): number {
  let most = 0;
  for (const rules of [CLOUD_TIERS, GARDEN_TIERS]) for (const step of rules.steps) most = Math.max(most, step.items[id] ?? 0);
  return most;
}

const hours = (b: Bot) => (b.now - b.start) / 3_600_000;

export function plotRoutine(b: Bot) {
  const level = levelFromXp(worldXp(b.world), WORLD_LEVELS);
  // The lowest rank first, so ranks rise evenly instead of one tier racing ahead.
  const candidates: { area: 'cloud' | 'garden'; group: number; rank: number; coins: number }[] = [];
  if (hasCloud(b.world)) {
    for (let group = 0; group < TIER_COUNT; group += 1) {
      const { step, block } = cloudTierUpgrade(cloudOf(b.world), group, level);
      if (step && block === null) candidates.push({ area: 'cloud', group, rank: step.tier - 1, coins: step.coins });
    }
  }
  if (hasGarden(b.world)) {
    for (let group = 0; group < ZONE_COUNT; group += 1) {
      const { step, block } = gardenZoneUpgrade(gardenOf(b.world), group, level);
      if (step && block === null) candidates.push({ area: 'garden', group, rank: step.tier - 1, coins: step.coins });
    }
  }
  candidates.sort((x, y) => x.rank - y.rank || x.coins - y.coins);
  for (const c of candidates) {
    if (b.coins() < c.coins + CUSHION) continue;
    const before = b.coins();
    const run = c.area === 'cloud' ? (w: Parameters<typeof upgradeTier>[0], ctx: Parameters<typeof upgradeTier>[2]) => upgradeTier(w, { group: c.group }, ctx) : (w: Parameters<typeof upgradeZone>[0], ctx: Parameters<typeof upgradeZone>[2]) => upgradeZone(w, { group: c.group }, ctx);
    if (!b.act('tier upgrade', run)) continue;
    b.plot.upgrades += 1;
    b.plot.upgradeCoins += before - b.coins();
    b.plot.firstRankAtHour[`${c.area} rank ${c.rank + 1}`] ??= hours(b);
    break; // one at a time: the next waits for the next session
  }
  // Skins: only with Gems.
  for (const skin of PLOT_SKINS) {
    if (skinStatus(b.world, skin, WORLD_LEVELS) !== 'forgeable' || b.world.wallet.gems < skin.gems + GEM_CUSHION) continue;
    const gems = b.world.wallet.gems;
    if (b.act('skin forge', GOALS.forgeSkin(skin.id, 'gems'))) {
      b.plot.skinsForged += 1;
      b.plot.skinGems += gems - b.world.wallet.gems;
    }
  }
}
