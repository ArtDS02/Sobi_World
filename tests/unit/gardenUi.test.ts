// The Garden's screens as data (hud, palette, bulk buttons, plot and workshop cards), the scene's pure parts, the
// presentation of its events, the admin time travel and the art it needs in the manifest.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { gardenArea } from '../../src/areas/garden';
import { gardenPresentation } from '../../src/areas/garden/feedback';
import { gardenArtIds } from '../../src/areas/garden/logic/art';
import { buildWorkshop, startCraft, upgradeSprinkler } from '../../src/areas/garden/logic/actions/buildings';
import { harvestPlots, plantCrops, waterPlots } from '../../src/areas/garden/logic/actions/plants';
import { GB } from '../../src/areas/garden/logic/config/content';
import { sceneState } from '../../src/areas/garden/logic/derived';
import { rewindGarden, rewindGardenInWorld } from '../../src/areas/garden/logic/rewind';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import { simulateGarden } from '../../src/areas/garden/logic/simulate';
import { cropStageOf, plotCentre, slotsToDraw, GARDEN_DESIGN } from '../../src/areas/garden/scene/gardenView';
import { bulkVm, hudVm, paletteVm, plotCardVm, sprinklerVm, workshopVm } from '../../src/areas/garden/ui/gardenVm';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { rewind } from '../../tools/admin/userEdits';

const H = 3_600_000;
const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number): ActionContext => ({ now, rng: mulberry32(5) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state!;
};
function base(bag: Record<string, number> = {}, gold = 10_000): WorldSave {
  const w = gardenArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
  return { ...w, wallet: { ...w.wallet, coins: gold }, inventory: { items: { ...bag } } };
}
const run = {
  water: (w: WorldSave, c: ActionContext) => waterPlots(w, {}, c),
  harvest: (w: WorldSave, c: ActionContext) => harvestPlots(w, {}, c),
  plantAll: (w: WorldSave, c: ActionContext) => plantCrops(w, { cropId: 'crop_wheat', plots: [0, 1, 2, 3, 4, 5] }, c),
};

describe('hud and palette', () => {
  it('shows the wallet, the level and the way to the next one', () => {
    const w = { ...base(), progression: { ...base().progression, areas: { sobi_garden: { xp: 150 } } } };
    const v = hudVm(w);
    expect(v.level).toBe('Cấp 2');
    expect(v.xp).toBe('150/383 KN');
    expect(v.xpProgress).toBe(17); // (150 − 100) / (383 − 100)
    expect(hudVm({ ...w, progression: { ...w.progression, areas: { sobi_garden: { xp: 99_999 } } } }).xp).toBe('Cấp cao nhất');
  });

  it('lists the five seeds with their price, what the bag holds and the growth time', () => {
    const items = paletteVm(base({ item_seed_corn: 3 }), 'crop_corn');
    expect(items.map((s) => s.name)).toEqual(['Cỏ', 'Lúa mì', 'Bắp', 'Khoai tây', 'Cà rốt']);
    expect(items.find((s) => s.cropId === 'crop_corn')).toMatchObject({ selected: true, line: '5 Sobi Coin · có 3', art: 'ui_item_seed_corn', growsIn: expect.stringContaining('4') });
    expect(items.filter((s) => s.selected)).toHaveLength(1);
  });
});

describe('bulk buttons say why they are off', () => {
  it('an empty garden: nothing to water or harvest, plant and expand work', () => {
    const v = bulkVm(base(), T0, 'crop_wheat', run);
    expect(v.water.reason).toBe('Chưa có cây');
    expect(v.harvest.reason).toBe('Chưa có cây chín');
    expect(v.plantAll.reason).toBeNull();
    expect(v.expand).toMatchObject({ reason: null, label: 'Mở thêm ô (200)' });
  });

  it('a full, watered garden; a poor player', () => {
    const w = ok(waterPlots(ok(plantCrops(base(), { cropId: 'crop_wheat', plots: [0, 1, 2, 3, 4, 5] }, ctxAt(T0))), {}, ctxAt(T0)));
    const v = bulkVm(w, T0, 'crop_wheat', run);
    expect(v.water.reason).toBe('Cây đã đủ nước');
    expect(v.plantAll.reason).toBe('Không còn ô trống');
    expect(bulkVm(base({}, 10), T0, 'crop_wheat', run).plantAll.reason).toBe('Thiếu Sobi Coin');
    expect(bulkVm(base({}, 10), T0, 'crop_wheat', run).expand.reason).toBe('Thiếu Sobi Coin');
  });
});

describe('plot card', () => {
  const sown = () => ok(plantCrops(base({ item_fertilizer: 1 }), { cropId: 'crop_corn', plots: [0, 1] }, ctxAt(T0)));
  const runs = { water: (w: WorldSave, c: ActionContext) => waterPlots(w, { plots: [0] }, c), fertilize: (w: WorldSave, c: ActionContext) => harvestPlots(w, { plots: [0] }, c), harvest: (w: WorldSave, c: ActionContext) => harvestPlots(w, { plots: [0] }, c) };

  it('a growing plot: progress, time to ripe (dry = twice as long), water and fertiliser buttons', () => {
    const card = plotCardVm(sown(), 0, T0, runs)!;
    expect(card).toMatchObject({ stage: 'growing', cropName: 'Bắp', title: 'Ô đất 1' });
    expect(card.lines.join(' ')).toContain('Tiến độ 0%');
    expect(card.lines.join(' ')).toContain('Đang khô');
    expect(card.lines.find((l) => l.startsWith('Chín sau'))).toContain('8'); // 4 h dry = 8 h
    expect(card.water?.reason).toBeNull();
    expect(card.fertilize).toMatchObject({ reason: null, label: 'Bón phân (có 1)' });
    expect(card.harvest).toBeNull();
  });

  it('watered: the water button explains itself; the sprinkler is named', () => {
    const watered = ok(waterPlots(sown(), { plots: [0] }, ctxAt(T0)));
    expect(plotCardVm(watered, 0, T0, runs)!.water!.reason).toBe('Đủ nước');
    const sprung = ok(upgradeSprinkler(sown(), ctxAt(T0)));
    expect(plotCardVm(sprung, 0, T0, runs)!.lines.join(' ')).toContain('Vòi tưới đang tưới');
  });

  it('a ripe plot offers the harvest and tells when it wilts; an empty or missing plot has no card text', () => {
    const w = ok(upgradeSprinkler(sown(), ctxAt(T0)));
    const later = simulateGarden(gardenOf(w), T0 + 5 * H).state;
    const card = plotCardVm({ ...w, areas: { ...w.areas, sobi_garden: later } }, 0, T0 + 5 * H, runs)!;
    expect(card.stage).toBe('ripe');
    expect(card.harvest).not.toBeNull();
    expect(card.lines.join(' ')).toContain('Héo sau');
    expect(card.lines.join(' ')).toContain('Thu được 3 Bắp');
    expect(plotCardVm(w, 99, T0, runs)).toBeNull();
    expect(plotCardVm(w, 3, T0, runs)).toMatchObject({ stage: 'empty', lines: [] });
  });
});

describe('workshop card', () => {
  it('not built: the price and why it cannot be bought', () => {
    expect(workshopVm(base(), 'mill', T0)).toMatchObject({ built: false, buildReason: null });
    expect(workshopVm(base({}, 10), 'mill', T0).buildReason).toBe('Thiếu Sobi Coin');
  });

  it('idle: recipes with what is missing; running: batches done and the next one', () => {
    let w = ok(buildWorkshop(base({ item_corn: 4, item_wheat: 2 }), { building: 'mill' }, ctxAt(T0)));
    const idle = workshopVm(w, 'mill', T0);
    expect(idle.job).toBeNull();
    expect(idle.recipes.map((r) => r.recipe.id)).toEqual(['recipe_pig_feed', 'recipe_premium_feed', 'recipe_fish_feed']);
    expect(idle.recipes[0]).toMatchObject({ maxBatches: 2, name: 'Thức ăn heo' });
    expect(idle.recipes[0]!.inputs).toEqual([{ name: 'Bắp', have: 4, need: 2 }, { name: 'Lúa mì', have: 2, need: 1 }]);
    expect(idle.recipes[1]!.maxBatches).toBe(0); // no carrot
    w = ok(startCraft(w, { building: 'mill', recipeId: 'recipe_pig_feed', batches: 2 }, ctxAt(T0)));
    const running = workshopVm(w, 'mill', T0 + 15 * 60_000);
    expect(running.job).toMatchObject({ done: 1, total: 2, ready: 1, name: 'Thức ăn heo' });
    expect(running.job!.nextIn).not.toBeNull();
    expect(workshopVm(w, 'mill', T0 + 3 * H).job).toMatchObject({ done: 2, ready: 2, nextIn: null });
  });

  it('the sprinkler card walks through its levels', () => {
    let w = base();
    expect(sprinklerVm(w)).toMatchObject({ level: 0, next: { level: 1, reason: null } });
    w = ok(upgradeSprinkler(w, ctxAt(T0)));
    expect(sprinklerVm(w).text).toContain('6 ô');
    expect(sprinklerVm(w).next).toMatchObject({ level: 2 });
    // Levels 2 and 3 take the Aquarium's materials: coins alone are not enough.
    const rich = { ...w, wallet: { ...w.wallet, coins: 100_000 } };
    expect(sprinklerVm(rich).next?.reason).toContain('Vảy cá');
    w = { ...rich, inventory: { items: { ...rich.inventory.items, item_scale: 30, item_pearl: 5 } } };
    w = ok(upgradeSprinkler(ok(upgradeSprinkler(w, ctxAt(T0))), ctxAt(T0)));
    expect(w.inventory.items.item_scale).toBe(30 - 8 - 15);
    expect(w.inventory.items.item_pearl).toBe(5 - 2);
    expect(sprinklerVm(w).next).toBeNull();
  });
});

describe('the scene', () => {
  it('draws the crop picture of its growth', () => {
    expect(cropStageOf({ stage: 'growing', share: 0.2 })).toBe('sprout');
    expect(cropStageOf({ stage: 'growing', share: 0.7 })).toBe('grow');
    expect(cropStageOf({ stage: 'ripe', share: 1 })).toBe('ripe');
    expect(cropStageOf({ stage: 'wilted', share: 1 })).toBe('wilt');
  });

  it('keeps every plot inside the frame and the field clear of the dock', () => {
    for (let i = 0; i < 24; i += 1) {
      const { x, y } = plotCentre(i);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(GARDEN_DESIGN.width);
      expect(y).toBeLessThan(GARDEN_DESIGN.height * 0.8 * 2); // the last rows are scrolled off only in later phases
    }
    expect(slotsToDraw(6, 24)).toBe(12); // owned + one more row of locked ground
    expect(slotsToDraw(24, 24)).toBe(24);
    expect(slotsToDraw(9, 24)).toBe(12);
  });

  it('the scene state reads plots, sprinkler and workshops off the slice', () => {
    const w = ok(upgradeSprinkler(ok(buildWorkshop(base(), { building: 'composter' }, ctxAt(T0))), ctxAt(T0)));
    const s = sceneState(gardenOf(w), T0);
    expect(s.plots).toHaveLength(6);
    expect(s.sprinkler).toBe(1);
    expect(s.composter).toEqual({ built: true, busy: false, ready: 0 });
    expect(s.mill.built).toBe(false);
  });
});

describe('presentation of the Garden events', () => {
  it('a toast and a sound for what matters, nothing for a catch-up', () => {
    const harvested = gardenPresentation({ type: 'GARDEN_HARVESTED', cropId: 'crop_corn', quantity: 6, plots: 2, wilted: 0, left: 0 } as never, 'action');
    expect(harvested).toEqual({ sound: 'feed_munch', toast: 'Thu hoạch 6 Bắp' });
    expect(gardenPresentation({ type: 'GARDEN_HARVESTED', cropId: 'crop_corn', quantity: 3, plots: 1, wilted: 0, left: 2 } as never, 'action')!.toast).toContain('Túi đồ đầy, còn 2 ô');
    expect(gardenPresentation({ type: 'GARDEN_CROP_RIPE', cropId: 'crop_corn', count: 4 } as never, 'tick')).toEqual({ sound: 'notify', toast: '4 cây đã chín!' });
    expect(gardenPresentation({ type: 'GARDEN_CROP_RIPE', cropId: 'crop_corn', count: 4 } as never, 'catchup')).toBeNull();
    expect(gardenPresentation({ type: 'PIG_FED' } as never, 'action')).toBeNull();
    expect(gardenPresentation({ type: 'GARDEN_LEVEL_UP', level: 2 } as never, 'action')).toEqual({ sound: 'level_up', toast: 'Sobi World lên cấp 2!' });
  });
});

describe('admin time travel', () => {
  it('moves the garden clocks: the next catch-up grows the crops and runs the workshop', () => {
    let w = ok(plantCrops(ok(upgradeSprinkler(ok(buildWorkshop(base({ item_corn: 2, item_wheat: 1 }), { building: 'mill' }, ctxAt(T0))), ctxAt(T0))), { cropId: 'crop_corn', plots: [0] }, ctxAt(T0)));
    w = ok(startCraft(w, { building: 'mill', recipeId: 'recipe_pig_feed', batches: 1 }, ctxAt(T0)));
    expect(simulateGarden(gardenOf(w), T0).events).toEqual([]);
    const away = rewindGardenInWorld(w, 6 * H);
    expect(gardenOf(away).lastTickedAt).toBe(T0 - 6 * H);
    const caught = simulateGarden(gardenOf(away), T0);
    expect(caught.events.map((e) => e.type).sort()).toEqual(['GARDEN_BATCH_DONE', 'GARDEN_CROP_RIPE']);
    expect(rewindGardenInWorld(w, 0)).toBe(w);
    // the dashboard's edit carries the time so it can move the garden when it writes the world
    expect(rewind(3_600_000).rewindMs).toBe(3_600_000);
    expect(rewindGarden(gardenOf(w), H).plots[0]!.wetUntil).toBe(0);
  });
});

describe('art', () => {
  it('every picture the garden draws is a row of the manifest', () => {
    const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as Record<string, { id: string }[]>;
    const ids = new Set(Object.values(manifest).flatMap((rows) => (Array.isArray(rows) ? rows.map((r) => r.id) : [])));
    expect(gardenArtIds().filter((id) => !ids.has(id))).toEqual([]);
    expect(gardenArtIds()).toContain(GB.buildings.mill.art);
    expect(gardenArtIds()).toContain('crop_corn_ripe');
    expect(gardenArtIds()).toContain('ui_item_food_premium');
  });
});
