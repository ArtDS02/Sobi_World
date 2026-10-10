// Sobi Cloud (GĐ9): opening, flowers over time (the same in every slicing), pure water, the cauldron and its potions,
// night flowers, the links to the Farm and the Aquarium (healing, mood, mutation boost) and to the world (events, Codex).
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { SAVE_CODEC, parseWorldSave } from '../../src/app/saveCodec';
import { cloudArea } from '../../src/areas/cloud';
import { buildCauldron, buyPlots, collectBrew, collectWater, startBrew, upgradeSpring } from '../../src/areas/cloud/logic/actions/buildings';
import { fertilizePlots, harvestFlowers, plantFlowers, waterPlots } from '../../src/areas/cloud/logic/actions/plants';
import { CB, CLOUD_AREA_ID, FLOWERS, FLOWER_LIST, SPRING_LEVELS } from '../../src/areas/cloud/logic/config/content';
import { cauldronReady, msToNextWater, nextExpansion, nextSpringLevel, plotViews, springStock } from '../../src/areas/cloud/logic/derived';
import { cloudOf, withCloud } from '../../src/areas/cloud/logic/save/lens';
import { simulateCloud } from '../../src/areas/cloud/logic/simulate';
import { cloudStateSchema } from '../../src/areas/cloud/logic/state';
import { cloudSuggestions } from '../../src/areas/cloud/logic/suggest';
import { cloudSummaryLines } from '../../src/areas/cloud/logic/summary';
import { cloudEventsToWorld } from '../../src/areas/cloud/logic/worldEvents';
import { rewindCloud } from '../../src/areas/cloud/logic/rewind';
import { aquariumArea } from '../../src/areas/aquarium';
import { breedFish } from '../../src/areas/aquarium/logic/actions/breed';
import { useFishPotion } from '../../src/areas/aquarium/logic/actions/care';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import type { Fish } from '../../src/areas/aquarium/logic/state';
import { breedPigs } from '../../src/areas/farm/logic/actions/breedPigs';
import { usePotion } from '../../src/areas/farm/logic/actions/usePotion';
import { healthStage } from '../../src/systems/health/disease';
import { ITEMS } from '../../src/core/config/items';
import { RECIPES } from '../../src/core/config/recipes';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { ctx as farmCtx, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const H = 3_600_000;
const MIN = 60_000;
const T0 = 20_000 * 86_400_000; // local midnight (UTC)
const NOON = T0 + 12 * H;
const ctxAt = (now: number, seed = 7): ActionContext => ({ now, rng: mulberry32(seed) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};
const err = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);
const items = (w: WorldSave) => w.inventory.items;

/** A world with the cloud open at T0, `coins` in the wallet and the given bag (the starter water is left out: tests count exactly what they put in). */
function cloudWorld(bag: Record<string, number> = {}, coins = 100_000): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt(T0));
  const opened = cloudArea.init(fresh, ctxAt(T0));
  return { ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: { ...bag } } };
}
const runTo = (w: WorldSave, now: number): WorldSave => {
  const r = simulateCloud(cloudOf(w), now);
  return withCloud(w, r.state);
};

describe('opening the cloud', () => {
  it('stays closed below its world level and opens, once, with a little water in the bag', () => {
    const fresh = SAVE_CODEC.newWorld(ctxAt(T0));
    expect(CLOUD_AREA_ID in fresh.areas).toBe(false);
    const rich = { ...fresh, progression: { ...fresh.progression, areas: { ...fresh.progression.areas, sobi_farm: { xp: 100_000 } } } };
    const opened = AREAS.advance(rich, T0 + H, mulberry32(3), 0, 'online');
    expect(opened.events.filter((e) => e.type === 'AREA_UNLOCKED').map((e) => (e as unknown as { areaId: string }).areaId)).toContain('sobi_cloud');
    expect(cloudOf(opened.state).plots).toHaveLength(CB.startPlots);
    expect(opened.state.inventory.items.item_pure_water).toBe(CB.start.water);
  });

  it('a save with the cloud survives the codec, and a corrupt slice is refused', () => {
    const w = ok(plantFlowers(cloudWorld({ item_pure_water: 3 }), { flowerId: 'flower_cloud_daisy', plots: [0] }, ctxAt(T0)));
    const parsed = parseWorldSave(JSON.stringify(w));
    expect(parsed.ok && parsed.save).toEqual(w);
    const bad = { ...w, areas: { ...w.areas, sobi_cloud: { ...cloudOf(w), plots: [] } } };
    expect(parseWorldSave(JSON.stringify(bad)).ok).toBe(false);
    expect(cloudStateSchema.safeParse({ ...cloudOf(w), spring: { level: 9, since: 0 } }).success).toBe(false);
  });
});

describe('content', () => {
  it('has common, rare and night flowers, every one with a seed and a produce item', () => {
    expect(new Set(FLOWER_LIST.map((f) => f.kind))).toEqual(new Set(['COMMON', 'RARE', 'NIGHT']));
    for (const f of FLOWER_LIST) {
      expect(ITEMS[f.seedItem as keyof typeof ITEMS]?.category).toBe('SEED');
      expect(ITEMS[f.produceItem as keyof typeof ITEMS]?.category).toBe('FLOWER');
    }
  });

  it('every flower has at least two uses besides the Codex: sell, a potion or a breeding boost, orders', () => {
    const recipes = Object.values(RECIPES).filter((r) => r.building === 'cauldron');
    for (const f of FLOWER_LIST) {
      const item = ITEMS[f.produceItem as keyof typeof ITEMS];
      const uses = [item.sellGold !== undefined, recipes.some((r) => f.produceItem in r.inputs), (item.mutationBoost ?? 0) > 0].filter(Boolean).length;
      expect(uses, f.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('the three potions exist: healing cures, mood lifts, battle waits for the adventure', () => {
    expect(ITEMS.item_potion_healing).toMatchObject({ category: 'POTION', curesSickness: true, moodBoost: 20 });
    expect(ITEMS.item_potion_mood).toMatchObject({ category: 'POTION', curesSickness: false, moodBoost: 40 });
    expect(ITEMS.item_potion_battle.category).toBe('POTION');
    expect(RECIPES.recipe_potion_healing!.inputs).toEqual({ item_flower_rainbow_rose: 1, item_pure_water: 1 }); // GAME_BALANCE §9
  });
});

describe('flowers', () => {
  it('buys the seeds it lacks at their price and uses the bag first', () => {
    const w = cloudWorld({ item_seed_cloud_daisy: 1 });
    const r = ok(plantFlowers(w, { flowerId: 'flower_cloud_daisy', plots: [0, 1, 2] }, ctxAt(T0)));
    expect(items(r).item_seed_cloud_daisy ?? 0).toBe(0);
    expect(r.wallet.coins).toBe(100_000 - 2 * ITEMS.item_seed_cloud_daisy.priceGold);
    expect(cloudOf(r).plots.filter((p) => p.cropId === 'flower_cloud_daisy')).toHaveLength(3);
  });

  it('refuses an occupied plot, a missing plot and a bad flower, changing nothing', () => {
    const w = ok(plantFlowers(cloudWorld(), { flowerId: 'flower_cloud_daisy', plots: [0] }, ctxAt(T0)));
    expect(err(plantFlowers(w, { flowerId: 'flower_cloud_daisy', plots: [0] }, ctxAt(T0)))).toBe('PLOT_OCCUPIED');
    expect(err(plantFlowers(w, { flowerId: 'flower_cloud_daisy', plots: [99] }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    expect(err(plantFlowers(w, { flowerId: 'flower_nope', plots: [1] }, ctxAt(T0)))).toBe('INVALID_REQUEST');
  });

  it('a daisy watered with pure water is ripe in 4 h; unwatered, in 16 h', () => {
    const planted = ok(plantFlowers(cloudWorld({ item_pure_water: 5 }), { flowerId: 'flower_cloud_daisy', plots: [0, 1] }, ctxAt(T0)));
    const watered = ok(waterPlots(planted, { plots: [0] }, ctxAt(T0)));
    expect(items(watered).item_pure_water).toBe(4);
    const at4 = runTo(watered, T0 + 4 * H);
    expect(plotViews(cloudOf(at4), T0 + 4 * H)[0]!.stage).toBe('ripe');
    expect(plotViews(cloudOf(at4), T0 + 4 * H)[1]!.stage).toBe('growing');
    const at16 = runTo(watered, T0 + 16 * H);
    expect(plotViews(cloudOf(at16), T0 + 16 * H)[1]!.stage).toBe('ripe');
  });

  it('watering takes one pure water per plot; with too little the first plots are watered; none is an error', () => {
    const planted = ok(plantFlowers(cloudWorld({ item_pure_water: 2 }), { flowerId: 'flower_cloud_daisy', plots: [0, 1, 2] }, ctxAt(T0)));
    const r = ok(waterPlots(planted, {}, ctxAt(T0)));
    expect(items(r).item_pure_water ?? 0).toBe(0);
    expect(cloudOf(r).plots.map((p) => p.wetUntil > 0)).toEqual([true, true, false, false, false, false]);
    expect(err(waterPlots(r, {}, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(err(waterPlots(cloudWorld(), {}, ctxAt(T0)))).toBe('NOTHING_TO_DO');
  });

  it('picking gives the yield, empties the plot and tells the world, with its Codex entry', () => {
    const planted = ok(plantFlowers(cloudWorld({ item_pure_water: 1 }), { flowerId: 'flower_cloud_daisy', plots: [0] }, ctxAt(T0)));
    const watered = ok(waterPlots(planted, {}, ctxAt(T0)));
    const r = harvestFlowers(runTo(watered, T0 + 4 * H), {}, ctxAt(NOON));
    if (!r.ok) throw new Error(r.error);
    expect(items(r.state).item_flower_cloud_daisy).toBe(FLOWERS.flower_cloud_daisy!.yield);
    expect(cloudOf(r.state).plots[0]!.cropId).toBeNull();
    const world = cloudEventsToWorld(r.events);
    expect(world).toContainEqual(expect.objectContaining({ type: 'flower.harvested', flowerId: 'flower_cloud_daisy', quantity: 3 }));
  });

  it('a night flower picked at night gives double; by day, the plain yield', () => {
    // 8 h of water-time: 4 h watered, then dry at a quarter speed, so ripe 20 h after planting.
    const grow = (now: number) => {
      const planted = ok(plantFlowers(cloudWorld({ item_pure_water: 1 }), { flowerId: 'flower_moon_lily', plots: [0] }, ctxAt(T0)));
      const watered = ok(waterPlots(planted, {}, ctxAt(T0)));
      return harvestFlowers(runTo(watered, now), {}, ctxAt(now));
    };
    const night = grow(T0 + 44 * H); // 20:00
    const day = grow(T0 + 30 * H); // 06:00
    if (!night.ok || !day.ok) throw new Error('harvest failed');
    const base = FLOWERS.flower_moon_lily!.yield;
    expect(items(day.state).item_flower_moon_lily).toBe(base);
    expect(items(night.state).item_flower_moon_lily).toBe(base * CB.nightYieldFactor);
    expect(night.events).toContainEqual(expect.objectContaining({ type: 'CLOUD_HARVESTED', night: true }));
  });

  it('a flower left more than 48 h wilts: half the yield, never lost', () => {
    const planted = ok(plantFlowers(cloudWorld({ item_pure_water: 1 }), { flowerId: 'flower_cloud_daisy', plots: [0] }, ctxAt(T0)));
    const watered = ok(waterPlots(planted, {}, ctxAt(T0)));
    const late = T0 + 4 * H + 49 * H;
    const r = harvestFlowers(runTo(watered, late), {}, ctxAt(late));
    if (!r.ok) throw new Error(r.error);
    expect(items(r.state).item_flower_cloud_daisy).toBe(Math.max(1, Math.floor(3 * CB.witherYieldFactor)));
  });

  it('fertiliser shortens the growth and adds to the yield', () => {
    const planted = ok(plantFlowers(cloudWorld({ item_pure_water: 1, item_fertilizer: 1 }), { flowerId: 'flower_cloud_daisy', plots: [0] }, ctxAt(T0)));
    const fertile = ok(fertilizePlots(ok(waterPlots(planted, {}, ctxAt(T0))), { plots: [0] }, ctxAt(T0)));
    const at3 = runTo(fertile, T0 + 3 * H);
    expect(plotViews(cloudOf(at3), T0 + 3 * H)[0]).toMatchObject({ stage: 'ripe', yield: 3 + CB.fertilizer.bonusYield });
  });

  it('opens more plots at the listed prices', () => {
    const w = cloudWorld();
    const next = nextExpansion(cloudOf(w))!;
    const r = ok(buyPlots(w, ctxAt(T0)));
    expect(cloudOf(r).plots).toHaveLength(next.plots);
    expect(r.wallet.coins).toBe(100_000 - next.price);
    expect(err(buyPlots(cloudWorld({}, 0), ctxAt(T0)))).toBe('INSUFFICIENT_GOLD');
  });
});

describe('the spring of pure water', () => {
  it('fills one unit per interval up to its capacity and stops', () => {
    const w = cloudWorld();
    const level = SPRING_LEVELS[0]!;
    expect(springStock(cloudOf(w), T0)).toBe(0);
    expect(springStock(cloudOf(w), T0 + level.intervalMs * 3 + 1)).toBe(3);
    expect(springStock(cloudOf(w), T0 + 100 * H)).toBe(level.capacity);
    expect(msToNextWater(cloudOf(w), T0 + 5 * MIN)).toBe(level.intervalMs - 5 * MIN);
    expect(msToNextWater(cloudOf(w), T0 + 100 * H)).toBe(0);
  });

  it('collecting keeps the part of the interval already flowing; a full spring starts over', () => {
    const level = SPRING_LEVELS[0]!;
    const w = cloudWorld();
    const t = T0 + level.intervalMs * 2 + 5 * MIN;
    const r = ok(collectWater(w, ctxAt(t)));
    expect(items(r).item_pure_water).toBe(2);
    expect(springStock(cloudOf(r), t)).toBe(0);
    expect(msToNextWater(cloudOf(r), t)).toBe(level.intervalMs - 5 * MIN);
    const full = ok(collectWater(w, ctxAt(T0 + 100 * H)));
    expect(items(full).item_pure_water).toBe(level.capacity);
    expect(msToNextWater(cloudOf(full), T0 + 100 * H)).toBe(level.intervalMs);
    expect(err(collectWater(r, ctxAt(t)))).toBe('NOTHING_TO_COLLECT');
  });

  it('upgrading costs coins and materials, flows faster and holds more, and keeps the water waiting', () => {
    const w = cloudWorld();
    const t = T0 + 3 * SPRING_LEVELS[0]!.intervalMs;
    const r = ok(upgradeSpring(w, ctxAt(t)));
    expect(cloudOf(r).spring.level).toBe(2);
    expect(r.wallet.coins).toBe(100_000 - SPRING_LEVELS[1]!.price);
    expect(springStock(cloudOf(r), t)).toBe(3);
    expect(springStock(cloudOf(r), t + SPRING_LEVELS[1]!.intervalMs)).toBe(4);
    const lv2 = ok(upgradeSpring(w, ctxAt(t)));
    expect(err(upgradeSpring(lv2, ctxAt(t)))).toBe('INSUFFICIENT_ITEM'); // level 3 needs pearls
    const pearls = { ...lv2, inventory: { items: { item_pearl: 3 } } };
    expect(nextSpringLevel(cloudOf(pearls))!.level).toBe(3);
    expect(cloudOf(ok(upgradeSpring(pearls, ctxAt(t)))).spring.level).toBe(3);
    expect(err(upgradeSpring(ok(upgradeSpring(pearls, ctxAt(t))), ctxAt(t)))).toBe('MAX_LEVEL_REACHED');
  });
});

describe('the cauldron', () => {
  const brewable = { item_flower_rainbow_rose: 2, item_pure_water: 2 };

  it('is built once for its price', () => {
    const r = ok(buildCauldron(cloudWorld(), ctxAt(T0)));
    expect(r.wallet.coins).toBe(100_000 - CB.cauldron.price);
    expect(err(buildCauldron(r, ctxAt(T0)))).toBe('ALREADY_OWNED');
  });

  it('takes the inputs now, finishes after the recipe time, hands the potion over on collect', () => {
    const built = ok(buildCauldron(cloudWorld(brewable), ctxAt(T0)));
    const r = ok(startBrew(built, { recipeId: 'recipe_potion_healing', batches: 2 }, ctxAt(T0)));
    expect(items(r).item_flower_rainbow_rose ?? 0).toBe(0);
    const dur = RECIPES.recipe_potion_healing!.durationMs;
    expect(cauldronReady(cloudOf(r), T0 + dur)).toBe(1);
    const half = ok(collectBrew(r, ctxAt(T0 + dur)));
    expect(items(half).item_potion_healing).toBe(1);
    const done = ok(collectBrew(half, ctxAt(T0 + 2 * dur)));
    expect(items(done).item_potion_healing).toBe(2);
    expect(cloudOf(done).cauldron.job).toBeNull();
    const events = collectBrew(half, ctxAt(T0 + 2 * dur));
    if (!events.ok) throw new Error('collect failed');
    expect(cloudEventsToWorld(events.events)).toContainEqual({ type: 'potion.brewed', area: CLOUD_AREA_ID, itemId: 'item_potion_healing', quantity: 1 });
  });

  it('refuses what it cannot do', () => {
    const noCauldron = cloudWorld(brewable);
    expect(err(startBrew(noCauldron, { recipeId: 'recipe_potion_healing', batches: 1 }, ctxAt(T0)))).toBe('NOT_BUILT');
    const built = ok(buildCauldron(noCauldron, ctxAt(T0)));
    expect(err(startBrew(built, { recipeId: 'recipe_potion_healing', batches: 3 }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(err(startBrew(built, { recipeId: 'recipe_fish_feed', batches: 1 }, ctxAt(T0)))).toBe('INVALID_REQUEST'); // another workshop's recipe
    expect(err(startBrew(built, { recipeId: 'recipe_potion_healing', batches: 0 }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    const busy = ok(startBrew(built, { recipeId: 'recipe_potion_healing', batches: 1 }, ctxAt(T0)));
    expect(err(startBrew(busy, { recipeId: 'recipe_potion_healing', batches: 1 }, ctxAt(T0)))).toBe('BUILDING_BUSY');
    expect(err(collectBrew(busy, ctxAt(T0)))).toBe('NOTHING_TO_COLLECT');
  });
});

describe('time', () => {
  const setup = () => {
    const planted = ok(plantFlowers(cloudWorld({ item_pure_water: 6, item_potion_x: 0 }), { flowerId: 'flower_dandelion', plots: [0, 1, 2] }, ctxAt(T0)));
    const watered = ok(waterPlots(planted, { plots: [0, 1] }, ctxAt(T0)));
    return ok(buildCauldron(watered, ctxAt(T0)));
  };

  it('a minute at a time, ten minutes at a time and one jump agree on the cloud', () => {
    const span = 60 * H;
    const jump = simulateCloud(cloudOf(setup()), T0 + span).state;
    for (const step of [MIN, 10 * MIN, H]) {
      let g = cloudOf(setup());
      for (let t = T0 + step; t <= T0 + span; t += step) g = simulateCloud(g, t).state;
      expect(g.plots).toEqual(jump.plots);
      expect(g.spring).toEqual(jump.spring);
    }
  });

  it('reports a ripe and a wilted flower once each, in whichever mode', () => {
    const g = cloudOf(setup());
    const together = simulateCloud(g, T0 + 100 * H).events;
    const first = simulateCloud(g, T0 + 20 * H);
    const second = simulateCloud(first.state, T0 + 100 * H);
    const count = (events: typeof together, type: string) => events.filter((e) => e.type === type).reduce((n, e) => n + ('count' in e ? e.count : 0), 0);
    expect(count(together, 'CLOUD_FLOWER_RIPE')).toBe(count([...first.events, ...second.events], 'CLOUD_FLOWER_RIPE'));
    expect(count(together, 'CLOUD_FLOWER_WILTED')).toBe(count([...first.events, ...second.events], 'CLOUD_FLOWER_WILTED'));
    expect(count(together, 'CLOUD_FLOWER_RIPE')).toBeGreaterThan(0);
  });

  it('30 days away: nothing is lost, the spring is full, and time travel moves it all back', () => {
    const g = cloudOf(setup());
    const far = simulateCloud(g, T0 + 30 * 24 * H).state;
    expect(far.plots.every((p) => p.cropId === null || p.ripeAt !== null)).toBe(true);
    const back = rewindCloud(g, 5 * H);
    expect(back.spring.since).toBe(g.spring.since - 5 * H);
    expect(simulateCloud(back, T0).state.plots[0]!.grown).toBeGreaterThan(g.plots[0]!.grown);
  });

  it('says what waits, with a way to the cloud', () => {
    const w = setup();
    const t = T0 + 100 * H;
    const caught = runTo(w, t);
    const lines = cloudSummaryLines(simulateCloud(cloudOf(w), t).events, cloudOf(caught), t);
    expect(lines.some((l) => l.key.startsWith('summary.cloud.'))).toBe(true);
    expect(lines.filter((l) => l.goto).every((l) => l.goto!.target === 'cloud')).toBe(true);
    expect(cloudSuggestions(cloudOf(caught), t, 0).some((s) => s.key === 'suggest.cloud.pick')).toBe(true);
  });
});

describe('potions in the Farm', () => {
  const sick = (over = {}) => makePig({ id: 'pig-1', isSick: true, lastSickAt: 0, growthProgress: 100, ...over });
  const bag = (x: Record<string, number>) => ({ ...farm().inventory, ...x }) as ReturnType<typeof farm>['inventory'];

  it('a healing potion cures a critical pig and lifts its mood; the bag loses one', () => {
    const s = farm([sick()], { inventory: bag({ item_potion_healing: 1 }) });
    const critical = 60 * H;
    expect(healthStage(s.pigs[0]!, critical, { criticalAfterMs: 48 * H, deathAfterMs: 72 * H })).toBe('critical');
    const r = expectOk(usePotion(s, { pigId: 'pig-1', itemId: 'item_potion_healing' }, farmCtx(critical)));
    expect(r.state.pigs[0]).toMatchObject({ isSick: false });
    expect(r.state.pigs[0]!.moodBoost!.amount).toBe(20);
    expect(r.state.pigs[0]!.moodBoost!.until).toBe(critical + 6 * H);
    expect(r.state.inventory.item_potion_healing).toBe(0);
    expect(r.events).toContainEqual({ type: 'PIG_POTION_USED', pigId: 'pig-1', itemId: 'item_potion_healing', cured: true });
  });

  it('a healing potion is not wasted on a healthy pig; a mood potion lifts it and a weaker one adds nothing', () => {
    const healthy = farm([makePig({ id: 'pig-1' })], { inventory: bag({ item_potion_healing: 1, item_potion_mood: 2 }) });
    expect(usePotion(healthy, { pigId: 'pig-1', itemId: 'item_potion_healing' }, farmCtx(0))).toEqual({ ok: false, error: 'PIG_NOT_SICK' });
    const lifted = expectOk(usePotion(healthy, { pigId: 'pig-1', itemId: 'item_potion_mood' }, farmCtx(0)));
    expect(lifted.state.pigs[0]!.moodBoost!.amount).toBe(40);
    expect(lifted.events).toContainEqual(expect.objectContaining({ type: 'PIG_POTION_USED', cured: false }));
    expect(usePotion(lifted.state, { pigId: 'pig-1', itemId: 'item_potion_mood' }, farmCtx(0))).toEqual({ ok: false, error: 'NOTHING_TO_DO' });
  });

  it('refuses a missing potion, a non-potion and a battle potion', () => {
    const s = farm([sick()]);
    expect(usePotion(s, { pigId: 'pig-1', itemId: 'item_potion_healing' }, farmCtx(0))).toEqual({ ok: false, error: 'INSUFFICIENT_ITEM' });
    expect(usePotion(s, { pigId: 'pig-1', itemId: 'FOOD_BASIC' }, farmCtx(0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(usePotion(farm([sick()], { inventory: bag({ item_potion_battle: 1 }) }), { pigId: 'pig-1', itemId: 'item_potion_battle' }, farmCtx(0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });
});

describe('potions in the Aquarium', () => {
  const fish = (over: Partial<Fish> = {}): Fish => ({
    id: 'f1', breed: 'fish_goldfish', name: 'Bong', gender: 'MALE', growthProgress: 100, hunger: 100, cleanliness: 100, isSick: true, lastSickAt: T0 - 50 * H,
    generation: 1, createdAt: T0 - 30 * 86_400_000, lastTickedAt: T0, ...over,
  });
  function tankWorld(f: Fish[], bag: Record<string, number>): WorldSave {
    const fresh = SAVE_CODEC.newWorld(ctxAt(T0 - 30 * 86_400_000));
    const opened = aquariumArea.init(fresh, ctxAt(T0));
    const a = aquariumOf(opened);
    return withAquarium({ ...opened, inventory: { items: bag }, meta: { ...opened.meta, createdAt: T0 - 30 * 86_400_000 } }, { ...a, fish: f, lastTickedAt: T0 });
  }

  it('a healing potion cures a sick fish; a mood potion lifts a healthy one', () => {
    const w = tankWorld([fish(), fish({ id: 'f2', isSick: false })], { item_potion_healing: 1, item_potion_mood: 1 });
    const cured = ok(useFishPotion(w, { fishId: 'f1', itemId: 'item_potion_healing' }, ctxAt(T0)));
    expect(aquariumOf(cured).fish.find((f) => f.id === 'f1')!.isSick).toBe(false);
    expect(items(cured).item_potion_healing ?? 0).toBe(0);
    expect(err(useFishPotion(w, { fishId: 'f2', itemId: 'item_potion_healing' }, ctxAt(T0)))).toBe('FISH_NOT_SICK');
    const lifted = ok(useFishPotion(w, { fishId: 'f2', itemId: 'item_potion_mood' }, ctxAt(T0)));
    expect(aquariumOf(lifted).fish.find((f) => f.id === 'f2')!.moodBoost!.amount).toBe(40);
  });
});

describe('flowers and breeding', () => {
  it('a rare flower raises the share of mutated litters, and is used up', () => {
    const mom = makePig({ id: 'mom', gender: 'FEMALE', growthProgress: 100, slotIndex: 0 });
    const dad = makePig({ id: 'dad', gender: 'MALE', growthProgress: 100, slotIndex: 1 });
    const rate = (boostItem?: 'item_flower_star_orchid') => {
      let mutated = 0;
      const runs = 600;
      for (let seed = 0; seed < runs; seed += 1) {
        const s = farm([mom, dad], { inventory: { ...farm().inventory, item_flower_star_orchid: 1 } });
        const r = expectOk(breedPigs(s, { pigAId: 'mom', pigBId: 'dad', ...(boostItem ? { boostItem } : {}) }, farmCtx(seed * 1000, mulberry32(seed))));
        if (r.state.pigs.find((p) => p.id === 'mom')!.pregnancy!.childMutated) mutated += 1;
        expect(r.state.inventory.item_flower_star_orchid).toBe(boostItem ? 0 : 1);
      }
      return mutated / runs;
    };
    expect(rate('item_flower_star_orchid')).toBeGreaterThan(rate() + 0.04);
  });

  it('only an item with a mutation boost can be added, and it must be in the bag', () => {
    const mom = makePig({ id: 'mom', gender: 'FEMALE', growthProgress: 100, slotIndex: 0 });
    const dad = makePig({ id: 'dad', gender: 'MALE', growthProgress: 100, slotIndex: 1 });
    expect(breedPigs(farm([mom, dad]), { pigAId: 'mom', pigBId: 'dad', boostItem: 'item_flower_cloud_daisy' }, farmCtx(0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(breedPigs(farm([mom, dad]), { pigAId: 'mom', pigBId: 'dad', boostItem: 'item_flower_rainbow_rose' }, farmCtx(0))).toEqual({ ok: false, error: 'INSUFFICIENT_ITEM' });
  });

  it('fish breeding takes the flower too', () => {
    const base = { growthProgress: 100, hunger: 100, cleanliness: 100, isSick: false, generation: 1, createdAt: T0 - 30 * 86_400_000, lastTickedAt: T0 };
    const male: Fish = { id: 'm', breed: 'fish_goldfish', name: 'M', gender: 'MALE', ...base };
    const female: Fish = { id: 'f', breed: 'fish_goldfish', name: 'F', gender: 'FEMALE', ...base };
    const fresh = SAVE_CODEC.newWorld(ctxAt(T0 - 30 * 86_400_000));
    const opened = aquariumArea.init(fresh, ctxAt(T0));
    const w = withAquarium({ ...opened, inventory: { items: { FOOD_FISH: 4, item_flower_rainbow_rose: 1 } }, meta: { ...opened.meta, createdAt: T0 - 30 * 86_400_000 } }, { ...aquariumOf(opened), fish: [male, female], lastTickedAt: T0 });
    const r = breedFish(w, { fishAId: 'm', fishBId: 'f', boostItem: 'item_flower_rainbow_rose' }, ctxAt(T0));
    if (!r.ok) throw new Error(r.error);
    expect(items(r.state).item_flower_rainbow_rose ?? 0).toBe(0);
    expect(r.events.some((e) => e.type === 'AQUARIUM_EGGS_LAID' && 'boostItem' in e)).toBe(true);
    expect(err(breedFish(w, { fishAId: 'm', fishBId: 'f', boostItem: 'item_flower_cloud_daisy' }, ctxAt(T0)))).toBe('INVALID_REQUEST');
  });
});
