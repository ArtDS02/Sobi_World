// Decision 056, the screens: the upgrade dialog's data (before / after, have / need, why the button is off), the banner / chip
// state of a cloud tier and a garden zone, and the rank line of the plot cards (the dialog's DOM is checked in the sandbox run).
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { cloudArea } from '../../src/areas/cloud';
import { sceneState } from '../../src/areas/cloud/logic/derived';
import { CLOUD_TIERS, PLOTS_PER_TIER } from '../../src/areas/cloud/logic/config/content';
import { cloudOf, withCloud } from '../../src/areas/cloud/logic/save/lens';
import { plotRankLine, tierRankVm } from '../../src/areas/cloud/ui/cloudRankVm';
import { gardenArea } from '../../src/areas/garden';
import { PLOTS_PER_ZONE } from '../../src/areas/garden/logic/config/content';
import { gardenOf, withGarden } from '../../src/areas/garden/logic/save/lens';
import { zoneVm } from '../../src/areas/garden/ui/gardenZoneVm';
import { plotCardVm as gardenPlotCard } from '../../src/areas/garden/ui/gardenVm';
import { zoneRankVm } from '../../src/areas/garden/ui/gardenRankVm';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { tierUpgradeVm } from '../../src/ui/world/tierUpgradeVm';
import { emptyPlot, sow } from '../../src/systems/plants/plot';
import { vi } from '../../src/i18n/vi';

const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number): ActionContext => ({ now, rng: mulberry32(3) });
const atLevel = (w: WorldSave, level: number): WorldSave => ({
  ...w,
  progression: { ...w.progression, areas: { ...w.progression.areas, world: { xp: WORLD_LEVELS.xp[level - 1]! } } },
});
function cloudWorld(plots: number, level: number, coins: number, bag: Record<string, number> = {}): WorldSave {
  const opened = cloudArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
  const w = atLevel({ ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: bag } }, level);
  return withCloud(w, { ...cloudOf(w), plots: Array.from({ length: plots }, emptyPlot) });
}
function gardenWorld(plots: number, level: number, coins: number, bag: Record<string, number> = {}): WorldSave {
  const opened = gardenArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
  const w = atLevel({ ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: bag } }, level);
  return withGarden(w, { ...gardenOf(w), plots: Array.from({ length: plots }, emptyPlot) });
}

describe('the upgrade dialog data', () => {
  it('names the reason, in order: plots, level, coins, items — and nothing when it can be bought', () => {
    const bag = { item_flower_cloud_daisy: 30 };
    expect(tierRankVm(cloudWorld(12, 60, 1e6, bag), 0).button.reason).toBe('Cần đủ 15 ô');
    expect(tierRankVm(cloudWorld(15, 11, 1e6, bag), 0).button.reason).toBe('Cần cấp 12');
    expect(tierRankVm(cloudWorld(15, 12, 2500, bag), 0).button.reason).toBe('Thiếu 500 Sobi Coin');
    expect(tierRankVm(cloudWorld(15, 12, 3000, { item_flower_cloud_daisy: 29 }), 0).button.reason).toBe('Thiếu vật phẩm (xem dòng ✗)');
    expect(tierRankVm(cloudWorld(15, 12, 3000, bag), 0).button.reason).toBeNull();
  });
  it('shows before / after, the cost as have / need, and where a missing item comes from', () => {
    const vm = zoneRankVm(gardenWorld(24, 12, 1000, { item_corn: 10 }), 0);
    expect(vm.now).toMatchObject({ rank: 1, name: 'Đất Vườn', bonus: 0 });
    expect(vm.after).toMatchObject({ rank: 2, name: 'Đất Mùn Tơi', bonus: 5 });
    expect(vm.rows.map((r) => [r.id, r.have, r.need, r.ok])).toEqual([
      ['coins', 1000, 4000, false],
      ['item_corn', 10, 40, false],
      ['item_fertilizer', 0, 20, false],
    ]);
    expect(vm.xp).toBe(100);
    const scales = tierRankVm(cloudWorld(15, 60, 1e6, { item_flower_cloud_daisy: 30 }), 0);
    expect(scales.after?.name).toBe('Mây Sương Sớm');
  });
  it('at the top rank there is no next step and the button says so', () => {
    const w = cloudWorld(15, 60, 1e6);
    const g = cloudOf(w);
    const top = tierRankVm(withCloud(w, { ...g, tierLevels: [5] }), 0);
    expect(top.after).toBeNull();
    expect(top.rows).toEqual([]);
    expect(top.button.reason).toBe(vi.plotTier.maxed);
  });
  it('tierUpgradeVm needs no Area: it reads rules and a bag', () => {
    const vm = tierUpgradeVm({ rules: CLOUD_TIERS, rankName: (id) => id, groupName: 'g', group: 1, rank: 1, plotsOwned: 30, plotsPerGroup: PLOTS_PER_TIER, worldLevel: 99, coins: 3600, bag: { item_flower_cloud_daisy: 30 } });
    expect(vm.rows[0]).toMatchObject({ need: 3600, ok: true });
    expect(vm.button.reason).toBeNull();
  });
});

describe('the banner and the zone chip', () => {
  it('a cloud tier offers the upgrade only when it owns all its plots; the rank and bonus ride along', () => {
    const half = cloudOf(cloudWorld(12, 60, 0));
    expect(sceneState(half, T0).ranks[0]).toEqual({ rank: 1, bonus: 0, open: false });
    const full = cloudOf(cloudWorld(15, 60, 0));
    expect(sceneState(full, T0).ranks[0]!.open).toBe(true);
    expect(sceneState({ ...full, tierLevels: [3] }, T0).ranks[0]).toEqual({ rank: 3, bonus: 10, open: true });
    expect(sceneState({ ...full, tierLevels: [5] }, T0).ranks[0]).toEqual({ rank: 5, bonus: 20, open: false });
  });
  it('a garden zone chip shows the rank, its bonus, and the upgrade once the zone is full', () => {
    expect(zoneVm(gardenWorld(21, 60, 0), 0).rank?.open).toBe(false);
    const full = gardenWorld(PLOTS_PER_ZONE, 60, 0);
    expect(zoneVm(full, 0).rank).toMatchObject({ short: 'Bậc 1', open: true });
    const g = gardenOf(full);
    expect(zoneVm(withGarden(full, { ...g, zoneLevels: [4] }), 0).rank).toMatchObject({ short: 'Bậc 4 · +15%', open: true });
    expect(zoneVm(full, 1).rank).toBeNull(); // a zone that is not open has no rank
  });
});

describe('plot cards carry the rank line', () => {
  it('Cloud and Garden both say the rank and the bonus of the group the plot is in', () => {
    const cw = cloudWorld(15, 60, 0);
    const cg = cloudOf(cw);
    const grown = withCloud(cw, { ...cg, tierLevels: [2], plots: cg.plots.map((p, i) => (i === 0 ? sow('flower_cloud_daisy') : p)) });
    const none = () => ({ ok: false as const, error: 'NOTHING_TO_DO' as const });
    expect(plotRankLine(cloudOf(grown), 0)).toBe('Bậc 2/5 · Mây Sương Sớm · +5% bội thu');
    const gw = gardenWorld(24, 60, 0);
    const gg = gardenOf(gw);
    const gcard = gardenPlotCard(withGarden(gw, { ...gg, zoneLevels: [1], plots: gg.plots.map((p, i) => (i === 0 ? sow('crop_wheat') : p)) }), 0, T0, { water: none, fertilize: none, harvest: none });
    expect(gcard?.rankLine).toBe('Bậc 1/5 · Đất Vườn');
  });
});
