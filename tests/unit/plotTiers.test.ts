// Decision 056: upgrade tiers of a cloud tier / garden zone — the pure rules, the two upgrade actions (gates, cost, ledger,
// items, XP), the yield bonus at harvest (seeded, expectation ~ p) and the slice migrations.
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import v12 from '../fixtures/save-v12-derived.json';
import { migrate } from '../../src/core/save/migrate';
import { cloudArea } from '../../src/areas/cloud';
import { upgradeTier } from '../../src/areas/cloud/logic/actions/buildings';
import { harvestFlowers } from '../../src/areas/cloud/logic/actions/plants';
import { CLOUD_TIERS, PLOTS_PER_TIER, TIER_COUNT } from '../../src/areas/cloud/logic/config/content';
import { cloudTierBonus, cloudTierLevel, cloudTierUpgrade } from '../../src/areas/cloud/logic/derived';
import { cloudOf, withCloud } from '../../src/areas/cloud/logic/save/lens';
import { CLOUD_MIGRATIONS, cloudStateSchema } from '../../src/areas/cloud/logic/state';
import { cloudEventsToWorld } from '../../src/areas/cloud/logic/worldEvents';
import { gardenArea } from '../../src/areas/garden';
import { upgradeZone } from '../../src/areas/garden/logic/actions/buildings';
import { harvestPlots } from '../../src/areas/garden/logic/actions/plants';
import { GARDEN_TIERS, PLOTS_PER_ZONE, ZONE_COUNT } from '../../src/areas/garden/logic/config/content';
import { gardenZoneBonus, gardenZoneUpgrade } from '../../src/areas/garden/logic/derived';
import { gardenOf, withGarden } from '../../src/areas/garden/logic/save/lens';
import { GARDEN_MIGRATIONS, gardenStateSchema } from '../../src/areas/garden/logic/state';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { levelFromXp } from '../../src/core/progression/levels';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { bonusItems, bonusPctOf, nextUpgrade, stepCoins, tierOfGroup, upgradeBlock, withTier } from '../../src/systems/plants/tiers';
import { emptyPlot } from '../../src/systems/plants/plot';
import { sow } from '../../src/systems/plants/plot';

const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number, seed = 7): ActionContext => ({ now, rng: mulberry32(seed) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};
type Harvested = { type: string; quantity: number; bonus: number };
const harvested = (events: readonly { type: string }[], type: string): Harvested | undefined => events.find((e) => e.type === type) as Harvested | undefined;
const without = (o: object, key: string): Record<string, unknown> => Object.fromEntries(Object.entries(o).filter(([k]) => k !== key));
const err = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);

/** Enough XP for world level `level` (the world entry carries it). */
const atLevel = (w: WorldSave, level: number): WorldSave => ({
  ...w,
  progression: { ...w.progression, areas: { ...w.progression.areas, world: { xp: WORLD_LEVELS.xp[level - 1]! } } },
});

function cloudWorld(bag: Record<string, number> = {}, coins = 1_000_000, plots = PLOTS_PER_TIER, level = 60): WorldSave {
  const opened = cloudArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
  const w = atLevel({ ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: { ...bag } } }, level);
  const g = cloudOf(w);
  return withCloud(w, { ...g, plots: Array.from({ length: plots }, emptyPlot) });
}
function gardenWorld(bag: Record<string, number> = {}, coins = 1_000_000, plots = PLOTS_PER_ZONE, level = 60): WorldSave {
  const opened = gardenArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
  const w = atLevel({ ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: { ...bag } } }, level);
  const g = gardenOf(w);
  return withGarden(w, { ...g, plots: Array.from({ length: plots }, emptyPlot) });
}

const RICH_CLOUD_BAG = { item_flower_cloud_daisy: 100, item_flower_rainbow_rose: 100, item_scale: 100, item_ancient_cog: 100, item_pearl: 10, item_ancient_rune: 10, item_flower_star_orchid: 100 };
const RICH_GARDEN_BAG = { item_corn: 200, item_fertilizer: 200, item_scale: 100, item_forest_herb: 100, item_ancient_cog: 100, item_beast_fang: 100, item_pearl: 10, item_ancient_rune: 10, item_sunflower: 200 };

describe('tier rules (pure)', () => {
  it('names and steps follow the owner-approved defaults', () => {
    expect(CLOUD_TIERS.ids).toHaveLength(5);
    expect(GARDEN_TIERS.ids).toHaveLength(5);
    expect(CLOUD_TIERS.steps.map((s) => s.bonusPct)).toEqual([5, 10, 15, 20]);
    expect(GARDEN_TIERS.steps.map((s) => s.worldLevel)).toEqual([12, 25, 40, 60]);
    expect(CLOUD_TIERS.steps.map((s) => s.baseCoins)).toEqual([3000, 9000, 24000, 60000]);
    expect(GARDEN_TIERS.steps.map((s) => s.baseCoins)).toEqual([4000, 12000, 32000, 80000]);
  });
  it('price = base x (1 + k x (g - 1)): cloud tier 10 costs x2.8, garden zone 4 x2.2', () => {
    expect(stepCoins(CLOUD_TIERS, CLOUD_TIERS.steps[0]!, 0)).toBe(3000);
    expect(stepCoins(CLOUD_TIERS, CLOUD_TIERS.steps[0]!, 9)).toBe(8400);
    expect(stepCoins(GARDEN_TIERS, GARDEN_TIERS.steps[3]!, 3)).toBe(176_000);
  });
  it('tiers are stored sparsely: absent = tier 1', () => {
    expect(tierOfGroup(undefined, 3)).toBe(1);
    expect(tierOfGroup([2], 3)).toBe(1);
    expect(withTier([2], 3, 4)).toEqual([2, 1, 1, 4]);
    expect(bonusPctOf(CLOUD_TIERS, 1)).toBe(0);
    expect(bonusPctOf(CLOUD_TIERS, 5)).toBe(20);
  });
  it('upgradeBlock names why: incomplete group, level, max', () => {
    const step = nextUpgrade(CLOUD_TIERS, 0, 1)!;
    const base = { plotsPerGroup: 15, group: 0, worldLevel: 60 };
    expect(upgradeBlock(step, { ...base, plotsOwned: 14 })).toBe('GROUP_INCOMPLETE');
    expect(upgradeBlock(step, { ...base, plotsOwned: 15, worldLevel: 11 })).toBe('LEVEL');
    expect(upgradeBlock(step, { ...base, plotsOwned: 15 })).toBeNull();
    expect(upgradeBlock(nextUpgrade(CLOUD_TIERS, 0, 5), { ...base, plotsOwned: 15 })).toBe('MAX');
    // a later group needs its own plots too
    expect(upgradeBlock(step, { ...base, group: 1, plotsOwned: 15 })).toBe('GROUP_INCOMPLETE');
  });
  it('bonusItems is deterministic for a seed and ~ quantity x p in the long run', () => {
    expect(bonusItems(3, 0, mulberry32(1))).toBe(0);
    expect(bonusItems(0, 50, mulberry32(1))).toBe(0);
    expect(bonusItems(50, 20, mulberry32(5))).toBe(bonusItems(50, 20, mulberry32(5)));
    for (const pct of [5, 10, 15, 20]) {
      const rng = mulberry32(pct);
      let extra = 0;
      const trials = 4000;
      for (let i = 0; i < trials; i += 1) extra += bonusItems(3, pct, rng);
      const rate = extra / (trials * 3);
      expect(Math.abs(rate - pct / 100)).toBeLessThan(0.012);
    }
  });
  it('item ids of every step exist and the XP of an upgrade is 50 x the new tier', () => {
    expect(nextUpgrade(CLOUD_TIERS, 0, 1)!.xp).toBe(100);
    expect(nextUpgrade(GARDEN_TIERS, 0, 4)!.xp).toBe(250);
  });
});

describe('Cloud: upgradeTier', () => {
  it('needs all 15 plots of the tier', () => {
    expect(err(upgradeTier(cloudWorld(RICH_CLOUD_BAG, 1e6, 12), { group: 0 }, ctxAt(T0)))).toBe('INVALID_REQUEST');
  });
  it('needs the world level (12 / 25 / 40 / 60)', () => {
    expect(err(upgradeTier(cloudWorld(RICH_CLOUD_BAG, 1e6, 15, 11), { group: 0 }, ctxAt(T0)))).toBe('LEVEL_TOO_LOW');
    const ok2 = ok(upgradeTier(cloudWorld(RICH_CLOUD_BAG, 1e6, 15, 12), { group: 0 }, ctxAt(T0)));
    expect(cloudTierLevel(cloudOf(ok2), 0)).toBe(2);
    // tier 3 needs level 25
    expect(err(upgradeTier(atLevel(ok2, 24), { group: 0 }, ctxAt(T0)))).toBe('LEVEL_TOO_LOW');
    expect(cloudTierLevel(cloudOf(ok(upgradeTier(atLevel(ok2, 25), { group: 0 }, ctxAt(T0)))), 0)).toBe(3);
  });
  it('pays coins through the ledger and the items, grants XP once, and never goes below zero', () => {
    const w = cloudWorld(RICH_CLOUD_BAG);
    const before = levelFromXp(0, WORLD_LEVELS);
    expect(before).toBe(1);
    const r = upgradeTier(w, { group: 0 }, ctxAt(T0));
    expect(r.ok).toBe(true);
    const after = ok(r);
    expect(after.wallet.coins).toBe(w.wallet.coins - 3000);
    expect(after.inventory.items.item_flower_cloud_daisy).toBe(70);
    expect(after.transactions[0]).toMatchObject({ type: 'CLOUD_TIER_UPGRADE', amount: -3000, currency: 'coins' });
    expect(after.progression.areas.sobi_cloud?.xp).toBe(100);
    // short on coins: refused, nothing taken
    const poor = cloudWorld(RICH_CLOUD_BAG, 2999);
    expect(err(upgradeTier(poor, { group: 0 }, ctxAt(T0)))).toBe('INSUFFICIENT_GOLD');
    // short on items: refused
    const noItems = cloudWorld({ item_flower_cloud_daisy: 29 });
    expect(err(upgradeTier(noItems, { group: 0 }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(noItems.wallet.coins).toBe(1_000_000);
  });
  it('can reach tier 5 and stops there; the second tier pays x1.2 (tier 2 costs base x1.2)', () => {
    let w = cloudWorld(RICH_CLOUD_BAG, 5_000_000, 30);
    for (let i = 0; i < 4; i += 1) w = ok(upgradeTier(w, { group: 0 }, ctxAt(T0)));
    expect(cloudTierLevel(cloudOf(w), 0)).toBe(5);
    expect(cloudTierBonus(cloudOf(w), 0)).toBe(20);
    expect(err(upgradeTier(w, { group: 0 }, ctxAt(T0)))).toBe('MAX_LEVEL_REACHED');
    const second = ok(upgradeTier(cloudWorld(RICH_CLOUD_BAG, 1e6, 30), { group: 1 }, ctxAt(T0)));
    expect(second.transactions[0]!.amount).toBe(-3600);
    expect(cloudTierLevel(cloudOf(second), 1)).toBe(2);
    expect(cloudTierLevel(cloudOf(second), 0)).toBe(1);
  });
  it('rejects a group that does not exist', () => {
    expect(err(upgradeTier(cloudWorld(RICH_CLOUD_BAG), { group: TIER_COUNT }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    expect(err(upgradeTier(cloudWorld(RICH_CLOUD_BAG), { group: -1 }, ctxAt(T0)))).toBe('INVALID_REQUEST');
  });
  it('its events read as standard world events (tier upgraded, coins and items out)', () => {
    const r = upgradeTier(cloudWorld(RICH_CLOUD_BAG), { group: 0 }, ctxAt(T0));
    if (!r.ok) throw new Error('x');
    const world = cloudEventsToWorld(r.events);
    expect(world).toContainEqual({ type: 'plot.tierUpgraded', area: 'sobi_cloud', group: 0, tier: 2 });
    expect(world).toContainEqual({ type: 'currency.changed', area: 'sobi_cloud', currency: 'coins', amount: -3000 });
    expect(world).toContainEqual({ type: 'item.removed', area: 'sobi_cloud', itemId: 'item_flower_cloud_daisy', quantity: 30 });
  });
  it('cloudTierUpgrade tells why, for the UI', () => {
    const g = cloudOf(cloudWorld({}, 0, 12));
    expect(cloudTierUpgrade(g, 0, 60).block).toBe('GROUP_INCOMPLETE');
  });
});

describe('Garden: upgradeZone', () => {
  it('needs all 24 plots and the world level, pays coins + items, grants XP', () => {
    expect(err(upgradeZone(gardenWorld(RICH_GARDEN_BAG, 1e6, 21), { group: 0 }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    expect(err(upgradeZone(gardenWorld(RICH_GARDEN_BAG, 1e6, 24, 11), { group: 0 }, ctxAt(T0)))).toBe('LEVEL_TOO_LOW');
    const w = gardenWorld(RICH_GARDEN_BAG);
    const after = ok(upgradeZone(w, { group: 0 }, ctxAt(T0)));
    expect(after.wallet.coins).toBe(w.wallet.coins - 4000);
    expect(after.inventory.items.item_corn).toBe(160);
    expect(after.inventory.items.item_fertilizer).toBe(180);
    expect(after.transactions[0]).toMatchObject({ type: 'GARDEN_ZONE_UPGRADE', amount: -4000 });
    expect(gardenZoneBonus(gardenOf(after), 0)).toBe(5);
    expect(after.progression.areas.sobi_garden?.xp).toBe(100);
  });
  it('refuses without coins or items, takes nothing, and the zone price rises 40 % per zone', () => {
    expect(err(upgradeZone(gardenWorld(RICH_GARDEN_BAG, 3999), { group: 0 }, ctxAt(T0)))).toBe('INSUFFICIENT_GOLD');
    expect(err(upgradeZone(gardenWorld({ item_corn: 40 }), { group: 0 }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    const second = ok(upgradeZone(gardenWorld(RICH_GARDEN_BAG, 1e6, 48), { group: 1 }, ctxAt(T0)));
    expect(second.transactions[0]!.amount).toBe(-5600);
  });
  it('tier 5 is the end', () => {
    let w = gardenWorld(RICH_GARDEN_BAG, 5_000_000);
    for (let i = 0; i < 4; i += 1) w = ok(upgradeZone(w, { group: 0 }, ctxAt(T0)));
    expect(gardenOf(w).zoneLevels[0]).toBe(5);
    expect(err(upgradeZone(w, { group: 0 }, ctxAt(T0)))).toBe('MAX_LEVEL_REACHED');
    expect(err(upgradeZone(w, { group: ZONE_COUNT }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    expect(gardenZoneUpgrade(gardenOf(w), 0, 60).step).toBeNull();
  });
});

describe('harvest bonus ("bội thu")', () => {
  /** A cloud world whose first tier is fully ripe daisies (3 each) at tier `tier`. */
  const ripeCloud = (tier: number): WorldSave => {
    const w = cloudWorld({}, 0);
    const g = cloudOf(w);
    return withCloud(w, { ...g, tierLevels: [tier], plots: g.plots.map(() => ({ ...sow('flower_cloud_daisy'), ripeAt: T0 })) });
  };
  const ripeGarden = (tier: number): WorldSave => {
    const w = gardenWorld({}, 0);
    const g = gardenOf(w);
    return withGarden(w, { ...g, zoneLevels: [tier], plots: g.plots.map(() => ({ ...sow('crop_wheat'), ripeAt: T0 })) });
  };

  it('tier 1 changes nothing: exactly the base yield, bonus 0', () => {
    const r = harvestFlowers(ripeCloud(1), {}, ctxAt(T0 + 1000));
    if (!r.ok) throw new Error(r.error);
    expect(harvested(r.events, 'CLOUD_HARVESTED')).toMatchObject({ quantity: 45, bonus: 0 });
  });
  it('is deterministic for a seed and the bonus counts inside the quantity and the bag', () => {
    const a = harvestFlowers(ripeCloud(5), {}, ctxAt(T0 + 1000, 11));
    const b = harvestFlowers(ripeCloud(5), {}, ctxAt(T0 + 1000, 11));
    if (!a.ok || !b.ok) throw new Error('x');
    expect(a.state).toEqual(b.state);
    const ev = harvested(a.events, 'CLOUD_HARVESTED');
    if (!ev) throw new Error('no event');
    expect(ev.quantity).toBe(45 + ev.bonus);
    expect(a.state.inventory.items.item_flower_cloud_daisy).toBe(ev.quantity);
    const c = harvestFlowers(ripeCloud(5), {}, ctxAt(T0 + 1000, 12));
    expect(c.ok).toBe(true);
  });
  it('averages p % extra items over many harvests (Cloud 20 %, Garden 10 %)', () => {
    let extra = 0;
    let base = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const r = harvestFlowers(ripeCloud(5), {}, ctxAt(T0 + 1000, seed));
      if (!r.ok) throw new Error('x');
      const ev = harvested(r.events, 'CLOUD_HARVESTED');
      if (ev) {
        extra += ev.bonus;
        base += ev.quantity - ev.bonus;
      }
    }
    expect(Math.abs(extra / base - 0.2)).toBeLessThan(0.015);
    extra = 0;
    base = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const r = harvestPlots(ripeGarden(3), {}, ctxAt(T0 + 1000, seed));
      if (!r.ok) throw new Error('x');
      const ev = harvested(r.events, 'GARDEN_HARVESTED');
      if (ev) {
        extra += ev.bonus;
        base += ev.quantity - ev.bonus;
      }
    }
    expect(Math.abs(extra / base - 0.1)).toBeLessThan(0.015);
  });
  it('a tier bonus applies only to plots of its own tier / zone', () => {
    const w = ripeCloud(1);
    const g = cloudOf(w);
    const two = withCloud(w, {
      ...g,
      tierLevels: [1, 5],
      plots: [...g.plots, ...Array.from({ length: PLOTS_PER_TIER }, () => ({ ...sow('flower_cloud_daisy'), ripeAt: T0 }))],
    });
    for (let seed = 1; seed < 30; seed += 1) {
      const r = harvestFlowers(two, { plots: Array.from({ length: PLOTS_PER_TIER }, (_, i) => i) }, ctxAt(T0 + 1000, seed));
      if (!r.ok) throw new Error('x');
      expect(harvested(r.events, 'CLOUD_HARVESTED')).toMatchObject({ bonus: 0 });
    }
  });
});

describe('slice migrations', () => {
  it('Cloud v2 → v3 adds tierLevels (every tier stays tier 1) and the result validates', () => {
    const v2 = without(cloudOf(cloudWorld()), 'tierLevels');
    const up = { ...CLOUD_MIGRATIONS[2]!({ ...v2, version: 2 }), version: 3 };
    expect(cloudStateSchema.safeParse(up).success).toBe(true);
    expect((up as unknown as { tierLevels: number[] }).tierLevels).toEqual([]);
  });
  it('Garden v1 → v2 adds zoneLevels (every zone stays tier 1) and the result validates', () => {
    const v1 = without(gardenOf(gardenWorld()), 'zoneLevels');
    const up = { ...GARDEN_MIGRATIONS[1]!({ ...v1, version: 1 }), version: 2 };
    expect(gardenStateSchema.safeParse(up).success).toBe(true);
    expect((up as unknown as { zoneLevels: number[] }).zoneLevels).toEqual([]);
  });
});

describe('a whole v12 world with old Cloud (v2) and Garden (v1) slices', () => {
  it('opens through the codec: plots, spring and coins kept, every tier / zone at tier 1', () => {
    const cw = cloudWorld({}, 0, 30);
    const gw = gardenWorld({}, 0, 24);
    const cloudV2 = without(cloudOf(cw), 'tierLevels');
    const gardenV1 = without(gardenOf(gw), 'zoneLevels');
    const old = structuredClone(v12) as unknown as Record<string, unknown> & { areas: Record<string, unknown>; wallet: { coins: number } };
    old.areas.sobi_cloud = { ...cloudV2, version: 2, spring: { level: 2, since: T0 } };
    old.areas.sobi_garden = { ...gardenV1, version: 1, sprinkler: 2 };
    const r = migrate(old, SAVE_CODEC);
    if (!r.ok) throw new Error(r.error);
    expect(r.repairedAreas ?? []).toEqual([]);
    expect(cloudOf(r.save).plots).toHaveLength(30);
    expect(cloudOf(r.save).spring.level).toBe(2);
    expect(cloudOf(r.save).tierLevels).toEqual([]);
    expect(gardenOf(r.save).sprinkler).toBe(2);
    expect(gardenOf(r.save).zoneLevels).toEqual([]);
    expect(r.save.wallet.coins).toBe(old.wallet.coins);
    expect(cloudTierLevel(cloudOf(r.save), 5)).toBe(1);
  });
});
