// Sobi Garden (GĐ5): opening, the plot and workshop actions, and the loop with the farm
// (manure → fertiliser → crops → feed → pigs) — the same numbers in every simulation mode.
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { SAVE_CODEC, parseWorldSave } from '../../src/app/saveCodec';
import { feedPig } from '../../src/areas/farm/logic/actions/feedPig';
import { cleanManure } from '../../src/areas/farm/logic/actions/cleanManure';
import { farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { CROPS, GARDEN_AREA_ID, GB, gardenLevel } from '../../src/areas/garden/logic/config/content';
import { plotViews, nextExpansion, nextSprinkler } from '../../src/areas/garden/logic/derived';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import {
  buildWorkshop,
  buyPlots,
  collectCraft,
  startCraft,
  upgradeSprinkler,
} from '../../src/areas/garden/logic/actions/buildings';
import { fertilizePlots, harvestPlots, plantCrops, waterPlots } from '../../src/areas/garden/logic/actions/plants';
import { gardenSummaryLines } from '../../src/areas/garden/logic/summary';
import { gardenArea } from '../../src/areas/garden';
import { INVENTORY } from '../../src/core/config/inventory';
import { mulberry32 } from '../../src/core/rng';
import { WORLD_SAVE_VERSION, type WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { pigActions } from '../../src/areas/farm/ui/actionsVm';
import { makePig } from './pigFactory';

const H = 3_600_000;
const MIN = 60_000;
const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number): ActionContext => ({ now, rng: mulberry32(7) });
const ok = <S>(r: { ok: boolean; state?: S; error?: string }): S => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as S;
};
const items = (w: WorldSave) => w.inventory.items;
const coins = (w: WorldSave) => w.wallet.coins;

/** A world with the garden open at T0, `coins` in the wallet and the given bag. */
function gardenWorld(bag: Record<string, number> = {}, gold = 10_000): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt(T0));
  const opened = gardenArea.init(fresh, ctxAt(T0));
  return { ...opened, wallet: { ...opened.wallet, coins: gold }, inventory: { items: { ...bag } } }; // the starter bag is left out: tests count exactly what they put in
}
const farmLevel3 = (w: WorldSave): WorldSave => ({
  ...w,
  progression: { ...w.progression, areas: { ...w.progression.areas, sobi_farm: { xp: 100_000 } } },
});
/** Moves every Area to `now` the way the store does in a mode. */
const advance = (w: WorldSave, now: number, mode: 'online' | 'offline' = 'online') => AREAS.advance(w, now, mulberry32(3), 0, mode);

describe('opening the garden', () => {
  it('stays closed below Farm Lv3 and opens, once, when the farm gets there', () => {
    const fresh = SAVE_CODEC.newWorld(ctxAt(T0));
    expect(fresh.world.unlockedAreas).toEqual(['sobi_farm']);
    expect(GARDEN_AREA_ID in fresh.areas).toBe(false);
    expect(advance(fresh, T0 + H).events.some((e) => e.type === 'AREA_UNLOCKED')).toBe(false);

    const opened = advance(farmLevel3(fresh), T0 + H);
    expect(opened.events.filter((e) => e.type === 'AREA_UNLOCKED')).toEqual([{ type: 'AREA_UNLOCKED', areaId: 'sobi_garden' }]);
    expect(opened.state.world.unlockedAreas).toEqual(['sobi_farm', 'sobi_garden']);
    expect(gardenOf(opened.state).plots).toHaveLength(GB.startPlots);
    expect(advance(opened.state, T0 + 2 * H).events.some((e) => e.type === 'AREA_UNLOCKED')).toBe(false);
    expect(AREAS.toWorldEvents(opened.events)).toContainEqual({ type: 'area.unlocked', area: 'sobi_garden' });
  });

  it('a save with the garden survives the codec', () => {
    const w = ok(plantCrops(gardenWorld(), { cropId: 'crop_corn', plots: [0, 1] }, ctxAt(T0)));
    const parsed = parseWorldSave(JSON.stringify(w));
    expect(parsed.ok && parsed.save).toEqual(w);
    expect(WORLD_SAVE_VERSION).toBe(9); // the garden is a slice: no world migration needed
  });

  it('a corrupt garden slice is refused, not played', () => {
    const w = gardenWorld();
    const bad = { ...w, areas: { ...w.areas, sobi_garden: { ...gardenOf(w), plots: [] } } };
    expect(parseWorldSave(JSON.stringify(bad)).ok).toBe(false);
  });
});

describe('sowing', () => {
  it('buys the seeds it lacks at their price and uses the bag first', () => {
    const w = gardenWorld({ item_seed_corn: 1 });
    const r = ok(plantCrops(w, { cropId: 'crop_corn', plots: [0, 1, 2] }, ctxAt(T0)));
    expect(coins(r)).toBe(coins(w) - 2 * 5);
    expect(items(r).item_seed_corn).toBe(0);
    expect(gardenOf(r).plots.slice(0, 3).every((p) => p.cropId === 'crop_corn')).toBe(true);
    expect(r.transactions[0]).toMatchObject({ type: 'GARDEN_SEEDS', amount: -10, currency: 'coins' });
  });

  it('refuses an occupied plot, a missing plot, a bad crop and a poor player — changing nothing', () => {
    const w = ok(plantCrops(gardenWorld(), { cropId: 'crop_corn', plots: [0] }, ctxAt(T0)));
    expect(plantCrops(w, { cropId: 'crop_wheat', plots: [0] }, ctxAt(T0))).toEqual({ ok: false, error: 'PLOT_OCCUPIED' });
    expect(plantCrops(w, { cropId: 'crop_wheat', plots: [99] }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(plantCrops(w, { cropId: 'crop_nope', plots: [1] }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    const poor = gardenWorld({}, 4);
    expect(plantCrops(poor, { cropId: 'crop_corn', plots: [0] }, ctxAt(T0))).toEqual({ ok: false, error: 'INSUFFICIENT_GOLD' });
  });
});

describe('growing, watering, harvesting', () => {
  const sown = (cropId = 'crop_corn') => ok(plantCrops(gardenWorld(), { cropId, plots: [0, 1, 2, 3, 4, 5] }, ctxAt(T0)));

  it('a watered corn plot is ripe in 4 h; an unwatered one in 8 h', () => {
    const w = ok(waterPlots(sown(), { plots: [0] }, ctxAt(T0))); // watered for waterHours (3 h) only
    const at4 = advance(w, T0 + 4 * H).state;
    // plot 0: 3 h wet + 1 h dry (0.5) = 3.5 h of 4 — not ripe yet; the dry ones are at 2 h
    expect(plotViews(gardenOf(at4), T0 + 4 * H)[0]!.stage).toBe('growing');
    const at5 = advance(w, T0 + 5 * H).state;
    expect(plotViews(gardenOf(at5), T0 + 5 * H)[0]!.stage).toBe('ripe');
    expect(plotViews(gardenOf(at5), T0 + 5 * H)[1]!.stage).toBe('growing');
    const at8 = advance(w, T0 + 8 * H).state;
    expect(plotViews(gardenOf(at8), T0 + 8 * H)[1]!.stage).toBe('ripe');
  });

  it('refreshing the water keeps a plot at full speed', () => {
    let w = sown();
    for (let t = 0; t < 4; t += 3) w = ok(waterPlots(w, {}, ctxAt(T0 + t * H)));
    expect(plotViews(gardenOf(advance(w, T0 + 4 * H).state), T0 + 4 * H).every((v) => v.stage === 'ripe')).toBe(true);
  });

  it('harvesting gives the yield, empties the plot, pays XP and tells the world', () => {
    let w = ok(waterPlots(sown(), {}, ctxAt(T0)));
    w = ok(waterPlots(w, {}, ctxAt(T0 + 3 * H)));
    const r = harvestPlots(w, { plots: [0, 1] }, ctxAt(T0 + 4 * H));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(items(r.state).item_corn).toBe(6);
    expect(gardenOf(r.state).plots[0]!.cropId).toBeNull();
    expect(gardenOf(r.state).plots[2]!.cropId).toBe('crop_corn');
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'GARDEN_HARVESTED', cropId: 'crop_corn', quantity: 6, plots: 2 }));
    expect(r.state.progression.areas.sobi_garden!.xp).toBe(6 * GB.xp.plant + 2 * GB.xp.harvest);
    expect(AREAS.toWorldEvents(r.events)).toContainEqual({ type: 'crop.harvested', area: 'sobi_garden', plotId: 'garden', cropId: 'crop_corn', quantity: 6 });
  });

  it('a harvest of everything takes only the ripe plots; nothing ripe is an error', () => {
    expect(harvestPlots(sown(), {}, ctxAt(T0 + H))).toEqual({ ok: false, error: 'NOTHING_TO_DO' });
    expect(harvestPlots(sown(), { plots: [0] }, ctxAt(T0 + H))).toEqual({ ok: false, error: 'NOT_RIPE' });
    const w = ok(plantCrops(gardenWorld(), { cropId: 'crop_grass', plots: [0] }, ctxAt(T0)));
    const r = ok(harvestPlots(ok(waterPlots(w, {}, ctxAt(T0))), {}, ctxAt(T0 + H)));
    expect(items(r).item_grass).toBe(3);
  });

  it('a crop left more than 48 h wilts: half the yield, never lost', () => {
    const w = ok(plantCrops(gardenWorld(), { cropId: 'crop_grass', plots: [0, 1] }, ctxAt(T0)));
    const covered = ok(upgradeSprinkler(w, ctxAt(T0)));
    const later = advance(covered, T0 + 80 * H);
    expect(later.events).toContainEqual({ type: 'GARDEN_CROP_RIPE', cropId: 'crop_grass', count: 2 });
    expect(later.events.filter((e) => e.type === 'GARDEN_CROP_WILTED').length).toBeGreaterThan(0);
    const r = ok(harvestPlots(later.state, {}, ctxAt(T0 + 80 * H)));
    expect(items(r).item_grass).toBe(2); // 2 plots × floor(3 × 0.5)
  });

  it('the wilting is reported once, in whichever mode', () => {
    const w = ok(upgradeSprinkler(ok(plantCrops(gardenWorld(), { cropId: 'crop_grass', plots: [0, 1] }, ctxAt(T0))), ctxAt(T0)));
    let wilted = 0;
    let cur = w;
    for (let t = T0; t < T0 + 80 * H; t += 10 * MIN) {
      const r = advance(cur, t + 10 * MIN, 'offline');
      wilted += r.events.filter((e) => e.type === 'GARDEN_CROP_WILTED').reduce((n, e) => n + (e as unknown as { count: number }).count, 0);
      cur = r.state;
    }
    expect(wilted).toBe(2);
  });

  it('a full bag leaves the rest on the vine, a harvest that fits nothing is refused', () => {
    const w = ok(upgradeSprinkler(ok(plantCrops(gardenWorld({}, 100_000), { cropId: 'crop_grass', plots: [0, 1, 2] }, ctxAt(T0))), ctxAt(T0)));
    const grown = advance(w, T0 + 2 * H).state;
    // every slot is taken but the last stack of grass, which has room for 3 more units: one plot fits, not two
    const full: WorldSave = { ...grown, inventory: { items: { FOOD_BASIC: (INVENTORY.slots - 1) * INVENTORY.stack, item_grass: INVENTORY.stack - 3 } } };
    const r = ok(harvestPlots(full, {}, ctxAt(T0 + 2 * H)));
    expect(items(r).item_grass).toBe(INVENTORY.stack);
    expect(gardenOf(r).plots.filter((p) => p.cropId !== null)).toHaveLength(2);
    const stuck: WorldSave = { ...grown, inventory: { items: { FOOD_BASIC: INVENTORY.slots * INVENTORY.stack } } };
    expect(harvestPlots(stuck, {}, ctxAt(T0 + 2 * H))).toEqual({ ok: false, error: 'INVENTORY_FULL' });
  });
});

describe('the sprinkler and the plots', () => {
  it('waters the first plots for good: no hand watering needed there', () => {
    const w = ok(upgradeSprinkler(gardenWorld(), ctxAt(T0)));
    expect(gardenOf(w).sprinkler).toBe(1);
    expect(coins(w)).toBe(10_000 - GB.sprinkler[0]!.price);
    const sown = ok(plantCrops(w, { cropId: 'crop_wheat', plots: [0, 5] }, ctxAt(T0)));
    expect(waterPlots(sown, {}, ctxAt(T0))).toEqual({ ok: false, error: 'NOTHING_TO_DO' }); // both are covered
    expect(plotViews(gardenOf(advance(sown, T0 + 3 * H).state), T0 + 3 * H).slice(0, 6).filter((v) => v.stage === 'ripe')).toHaveLength(2);
  });

  it('opens three more plots at a time at the listed prices; the sprinkler has levels', () => {
    let w = gardenWorld();
    expect(nextExpansion(gardenOf(w))).toEqual({ plots: 9, price: 200 });
    w = ok(buyPlots(w, ctxAt(T0)));
    expect(gardenOf(w).plots).toHaveLength(9);
    expect(coins(w)).toBe(10_000 - 200);
    expect(nextSprinkler(gardenOf(w))).toMatchObject({ level: 1, plots: 6 });
    for (let i = 0; i < 5; i += 1) w = ok(buyPlots({ ...w, wallet: { ...w.wallet, coins: 1_000_000 } }, ctxAt(T0)));
    expect(gardenOf(w).plots).toHaveLength(24);
    expect(buyPlots(w, ctxAt(T0))).toEqual({ ok: false, error: 'MAX_SLOTS_REACHED' });
    expect(nextExpansion(gardenOf(w))).toBeNull();
  });

  it('cannot afford what costs more than the wallet', () => {
    expect(buyPlots(gardenWorld({}, 10), ctxAt(T0))).toEqual({ ok: false, error: 'INSUFFICIENT_GOLD' });
    expect(upgradeSprinkler(gardenWorld({}, 10), ctxAt(T0))).toEqual({ ok: false, error: 'INSUFFICIENT_GOLD' });
  });
});

describe('workshops', () => {
  const mill = (bag: Record<string, number>) => ok(buildWorkshop(gardenWorld(bag), { building: 'mill' }, ctxAt(T0)));

  it('is built once for its price', () => {
    const w = mill({});
    expect(coins(w)).toBe(10_000 - GB.buildings.mill.price);
    expect(buildWorkshop(w, { building: 'mill' }, ctxAt(T0))).toEqual({ ok: false, error: 'ALREADY_OWNED' });
    expect(buildWorkshop(w, { building: 'oven' }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });

  it('takes the inputs now, finishes a batch every 10 minutes, hands the outputs over on collect', () => {
    const w = ok(startCraft(mill({ item_corn: 4, item_wheat: 2 }), { building: 'mill', recipeId: 'recipe_pig_feed', batches: 2 }, ctxAt(T0)));
    expect(items(w).item_corn).toBe(0);
    expect(collectCraft(w, { building: 'mill' }, ctxAt(T0 + 9 * MIN))).toEqual({ ok: false, error: 'NOTHING_TO_COLLECT' });
    const half = ok(collectCraft(w, { building: 'mill' }, ctxAt(T0 + 10 * MIN)));
    expect(items(half).FOOD_BASIC).toBe(4);
    expect(gardenOf(half).jobs.mill).not.toBeNull();
    expect(startCraft(half, { building: 'mill', recipeId: 'recipe_pig_feed', batches: 1 }, ctxAt(T0 + 10 * MIN))).toEqual({ ok: false, error: 'BUILDING_BUSY' });
    const done = ok(collectCraft(half, { building: 'mill' }, ctxAt(T0 + 3 * H)));
    expect(items(done).FOOD_BASIC).toBe(8);
    expect(gardenOf(done).jobs.mill).toBeNull();
    expect(done.progression.areas.sobi_garden!.xp).toBe(2 * GB.xp.craft);
  });

  it('refuses what it cannot do', () => {
    const w = mill({ item_corn: 1 });
    expect(startCraft(w, { building: 'mill', recipeId: 'recipe_pig_feed', batches: 1 }, ctxAt(T0))).toEqual({ ok: false, error: 'INSUFFICIENT_ITEM' });
    expect(startCraft(w, { building: 'composter', recipeId: 'recipe_fertilizer', batches: 1 }, ctxAt(T0))).toEqual({ ok: false, error: 'NOT_BUILT' });
    expect(startCraft(w, { building: 'mill', recipeId: 'recipe_fertilizer', batches: 1 }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(startCraft(w, { building: 'mill', recipeId: 'recipe_pig_feed', batches: GB.maxBatches + 1 }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });

  it('collects as many batches as the bag has room for', () => {
    const w = ok(startCraft(mill({ item_corn: 4, item_wheat: 2 }), { building: 'mill', recipeId: 'recipe_pig_feed', batches: 2 }, ctxAt(T0)));
    const room = 4; // units of free space left in the bag: one batch (4 units) fits, two do not
    const tight: WorldSave = { ...w, inventory: { items: { ...items(w), FOOD_BASIC: INVENTORY.slots * INVENTORY.stack - room } } };
    const r = ok(collectCraft(tight, { building: 'mill' }, ctxAt(T0 + 30 * MIN)));
    expect(items(r).FOOD_BASIC).toBe(INVENTORY.slots * INVENTORY.stack);
    expect(gardenOf(r).jobs.mill).toMatchObject({ batches: 2, collected: 1 }); // the other batch waits in the workshop
    expect(collectCraft(r, { building: 'mill' }, ctxAt(T0 + 30 * MIN))).toEqual({ ok: false, error: 'INVENTORY_FULL' });
  });
});

describe('the pig panel offers the garden foods', () => {
  it('premium feed and grass buttons appear only while the bag holds them', () => {
    const pig = makePig({ hunger: 10 });
    const with0 = withFarm(gardenWorld({}), { ...farmOf(gardenWorld({})), pigs: [pig] });
    const none = pigActions(farmOf(with0), pig.id, T0);
    expect(none.feedPremium).toBeNull();
    expect(none.feedGrass).toBeNull();
    const stocked = withFarm(with0, { ...farmOf(with0), inventory: { ...farmOf(with0).inventory, FOOD_PREMIUM: 2, item_grass: 5 } });
    const some = pigActions(farmOf(stocked), pig.id, T0);
    expect(some.feedPremium).toMatchObject({ label: 'Ăn cao cấp (x2)', reason: null });
    expect(some.feedGrass).toMatchObject({ label: 'Ăn cỏ (x5)', reason: null });
  });
});

describe('the loop: manure → fertiliser → crops → feed → pigs', () => {
  /** A world one day into a farm with a pig and 3 piles of manure, the workshops built. */
  function start(): WorldSave {
    let w = gardenWorld({ item_grass: 1 }, 100_000);
    const farm = { ...farmOf(w), pigs: [makePig({ hunger: 10 })], manure: 3 };
    w = withFarm(w, farm);
    w = ok(buildWorkshop(w, { building: 'mill' }, ctxAt(T0)));
    return ok(buildWorkshop(w, { building: 'composter' }, ctxAt(T0)));
  }

  it('runs end to end', () => {
    // 1. Rake the pen: manure goes to the bag.
    let w = start();
    w = withFarm(w, ok(cleanManure(farmOf(w), ctxAt(T0))));
    expect(items(w).item_manure).toBe(3);
    // 2. Compost: 3 manure + 1 grass → 2 fertiliser in 30 minutes.
    w = ok(startCraft(w, { building: 'composter', recipeId: 'recipe_fertilizer', batches: 1 }, ctxAt(T0)));
    w = ok(collectCraft(w, { building: 'composter' }, ctxAt(T0 + 30 * MIN)));
    expect(items(w).item_fertilizer).toBe(2);
    // 3. Grow corn, carrots and wheat; fertilise two plots (−25 % time, +1 yield).
    w = ok(plantCrops(w, { cropId: 'crop_corn', plots: [0, 1] }, ctxAt(T0 + 30 * MIN)));
    w = ok(plantCrops(w, { cropId: 'crop_wheat', plots: [2] }, ctxAt(T0 + 30 * MIN)));
    w = ok(plantCrops(w, { cropId: 'crop_carrot', plots: [3] }, ctxAt(T0 + 30 * MIN)));
    w = ok(fertilizePlots(w, { plots: [0, 1] }, ctxAt(T0 + 30 * MIN)));
    expect(items(w).item_fertilizer).toBe(0);
    w = ok(upgradeSprinkler(w, ctxAt(T0 + 30 * MIN)));
    // 4. Time passes with the game closed: one offline catch-up of 8 hours.
    const away = advance(w, T0 + 8.5 * H, 'offline');
    expect(away.events.filter((e) => e.type === 'GARDEN_CROP_RIPE')).toHaveLength(3);
    w = away.state;
    w = ok(harvestPlots(w, {}, ctxAt(T0 + 8.5 * H)));
    expect(items(w)).toMatchObject({ item_corn: 8, item_wheat: 3, item_carrot: 2 }); // corn: 2 plots × (3 + 1)
    // 5. Mill: pig feed (2 corn + 1 wheat → 4) and premium (2 corn + 1 carrot → 2).
    w = ok(startCraft(w, { building: 'mill', recipeId: 'recipe_pig_feed', batches: 2 }, ctxAt(T0 + 9 * H)));
    w = ok(collectCraft(w, { building: 'mill' }, ctxAt(T0 + 9.5 * H)));
    expect(items(w).FOOD_BASIC).toBe(8);
    w = ok(startCraft(w, { building: 'mill', recipeId: 'recipe_premium_feed', batches: 2 }, ctxAt(T0 + 9.5 * H)));
    w = ok(collectCraft(w, { building: 'mill' }, ctxAt(T0 + 10.5 * H)));
    expect(items(w).FOOD_PREMIUM).toBe(4);
    // 6. The pig eats premium feed (more hunger than plain) and grass.
    const pig = farmOf(w).pigs[0]!;
    const plain = ok(feedPig(farmOf(w), { pigId: pig.id }, ctxAt(T0 + 10.5 * H)));
    const premium = ok(feedPig(farmOf(w), { pigId: pig.id, itemId: 'FOOD_PREMIUM' }, ctxAt(T0 + 10.5 * H)));
    expect(premium.pigs[0]!.hunger).toBeGreaterThan(plain.pigs[0]!.hunger);
    expect(premium.inventory.FOOD_PREMIUM).toBe(3);
    expect(feedPig(farmOf(w), { pigId: pig.id, itemId: 'item_corn' as never }, ctxAt(T0)).ok).toBe(false);
  });
});

describe('one result in every mode', () => {
  it('a minute at a time, ten minutes at a time and one jump agree on the garden', () => {
    let start = ok(buyPlots(ok(upgradeSprinkler(gardenWorld({}, 100_000), ctxAt(T0))), ctxAt(T0)));
    start = ok(buildWorkshop(start, { building: 'mill' }, ctxAt(T0)));
    start = ok(plantCrops(start, { cropId: 'crop_corn', plots: [0, 1, 2] }, ctxAt(T0)));
    start = ok(plantCrops(start, { cropId: 'crop_potato', plots: [7] }, ctxAt(T0)));
    start = { ...start, inventory: { items: { ...items(start), item_corn: 8, item_wheat: 4 } } };
    start = ok(startCraft(start, { building: 'mill', recipeId: 'recipe_pig_feed', batches: 4 }, ctxAt(T0)));
    const span = 30 * H;
    const run = (step: number, mode: 'online' | 'offline') => {
      let w = start;
      let ripe = 0;
      let batches = 0;
      for (let t = T0 + step; t <= T0 + span; t += step) {
        const r = advance(w, t, mode);
        w = r.state;
        for (const e of r.events) {
          if (e.type === 'GARDEN_CROP_RIPE') ripe += (e as unknown as { count: number }).count;
          if (e.type === 'GARDEN_BATCH_DONE') batches += (e as unknown as { batches: number }).batches;
        }
      }
      return { g: gardenOf(w), ripe, batches };
    };
    const minute = run(MIN, 'online');
    const ten = run(10 * MIN, 'offline');
    const jump = run(span, 'offline');
    for (const other of [ten, jump]) {
      expect(other.ripe).toBe(minute.ripe);
      expect(other.batches).toBe(minute.batches);
      expect(other.g.plots.map((p) => [p.cropId, p.ripeAt === null ? null : Math.round(p.ripeAt / 100)])).toEqual(
        minute.g.plots.map((p) => [p.cropId, p.ripeAt === null ? null : Math.round(p.ripeAt / 100)]),
      );
      expect(other.g.jobs).toEqual(minute.g.jobs);
    }
    expect(minute.ripe).toBe(4);
    expect(minute.batches).toBe(4);
  });

  it('30 days away: everything ripe has wilted but nothing is lost, and the catch-up is quick', () => {
    const w = ok(upgradeSprinkler(ok(plantCrops(gardenWorld({}, 100_000), { cropId: 'crop_carrot', plots: [0, 1, 2, 3, 4, 5] }, ctxAt(T0))), ctxAt(T0)));
    const t = Date.now();
    const r = advance(w, T0 + 30 * 24 * H, 'offline');
    expect(Date.now() - t).toBeLessThan(3000);
    const g = gardenOf(r.state);
    expect(g.plots.every((p) => p.cropId === 'crop_carrot')).toBe(true);
    const done = ok(harvestPlots(r.state, {}, ctxAt(T0 + 30 * 24 * H)));
    expect(items(done).item_carrot).toBe(6 * Math.floor(CROPS.crop_carrot!.yield * GB.witherYieldFactor));
  });
});

describe('the away summary', () => {
  it('counts what happened and says what waits, with a way to the garden', () => {
    const w = ok(buildWorkshop(ok(plantCrops(gardenWorld({ item_corn: 2, item_wheat: 1 }, 100_000), { cropId: 'crop_grass', plots: [0, 1] }, ctxAt(T0))), { building: 'mill' }, ctxAt(T0)));
    const cooking = ok(startCraft(w, { building: 'mill', recipeId: 'recipe_pig_feed', batches: 1 }, ctxAt(T0)));
    const r = advance(cooking, T0 + 5 * H, 'offline');
    const keys = AREAS.summary(r.events, r.state, T0 + 5 * H).map((l) => l.key);
    expect(keys).toEqual(expect.arrayContaining(['summary.garden.needHarvest', 'summary.garden.needCollect', 'summary.garden.ripe', 'summary.garden.batches']));
    expect(gardenSummaryLines(r.events, gardenOf(r.state), T0 + 5 * H)[0]!.goto).toEqual({ target: 'garden' });
    // dry crops are flagged
    const dry = ok(plantCrops(gardenWorld(), { cropId: 'crop_carrot', plots: [0] }, ctxAt(T0)));
    expect(gardenSummaryLines([], gardenOf(advance(dry, T0 + 4 * H).state), T0 + 4 * H).map((l) => l.key)).toContain('summary.garden.needWater');
  });
});

describe('levels', () => {
  it('rise with XP from the garden table', () => {
    expect(gardenLevel(0)).toBe(1);
    expect(gardenLevel(100)).toBe(2);
    expect(gardenLevel(1_000_000)).toBe(GB.levels.maxLevel);
    expect(gardenArea.level(gardenWorld())).toBe(1);
  });
});
