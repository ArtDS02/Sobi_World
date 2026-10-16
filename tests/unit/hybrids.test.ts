// Cross-breeding (decision 035): every rare species has a recipe reachable from what the shops sell, the pity makes a
// rare result sure after a few misses, and the Garden / Cloud labs and the Aquarium tank use the recipes.
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { aquariumArea } from '../../src/areas/aquarium';
import { AB, FISH_HYBRIDS, FISH_LIST } from '../../src/areas/aquarium/logic/config/content';
import { breedFish, pairError } from '../../src/areas/aquarium/logic/actions/breed';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import type { Fish } from '../../src/areas/aquarium/logic/state';
import { cloudArea } from '../../src/areas/cloud';
import { CB, CLOUD_HYBRIDS, CLOUD_LAB, FLOWER_LIST } from '../../src/areas/cloud/logic/config/content';
import { crossFlowers } from '../../src/areas/cloud/logic/actions/lab';
import { plantFlowers } from '../../src/areas/cloud/logic/actions/plants';
import { cloudOf } from '../../src/areas/cloud/logic/save/lens';
import { gardenArea } from '../../src/areas/garden';
import { CROPS, CROP_LIST, GARDEN_HYBRIDS, GARDEN_LAB, GB } from '../../src/areas/garden/logic/config/content';
import { crossCrops } from '../../src/areas/garden/logic/actions/lab';
import { plantCrops } from '../../src/areas/garden/logic/actions/plants';
import { buyShopItem } from '../../src/areas/garden/logic/actions/shop';
import { seedUnlocked } from '../../src/areas/garden/logic/derived';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import { SPECIES_ROWS } from '../../src/areas/farm/logic/config/speciesTable';
import { FARM_CONTENT } from '../../src/areas/farm/logic/config/content';
import { sequenceRng } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { crossChance, reachable, recipeFor } from '../../src/systems/hybrid';

const T0 = 20_000 * 86_400_000;
/** `roll` is every draw of the rng: 0 = the luckiest, 0.999 = the unluckiest. */
const ctxAt = (now: number, roll = 0): ActionContext => ({ now, rng: sequenceRng([roll]) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state!;
};
const fail = (r: { ok: boolean; error?: string }) => (r.ok ? 'ok' : r.error);
const items = (w: WorldSave) => w.inventory.items;

function gardenWorld(bag: Record<string, number> = {}, coins = 10_000): WorldSave {
  const w = gardenArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
  return { ...w, wallet: { ...w.wallet, coins }, inventory: { items: { ...bag } } };
}
function cloudWorld(bag: Record<string, number> = {}, coins = 10_000): WorldSave {
  const w = cloudArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
  return { ...w, wallet: { ...w.wallet, coins }, inventory: { items: { ...bag } } };
}

describe('every rare species can be bred from what the shops sell', () => {
  it('Garden: every crop is a shop seed or reachable by crossing, and every hybrid crop has a recipe', () => {
    const sold = CROP_LIST.filter((c) => !c.hybrid && GB.shop.some((l) => l.itemId === c.seedItem)).map((c) => c.id);
    const all = reachable(GARDEN_HYBRIDS.recipes, sold);
    expect(CROP_LIST.filter((c) => !all.has(c.id)).map((c) => c.id)).toEqual([]);
    for (const c of CROP_LIST.filter((x) => x.hybrid)) expect(GARDEN_HYBRIDS.recipes.some((r) => r.result === c.id), c.id).toBe(true);
    // Every crop added by decision 035 can itself be crossed out.
    for (const id of ['crop_tomato', 'crop_cabbage', 'crop_sweet_potato', 'crop_pumpkin', 'crop_strawberry', 'crop_sugarcane', 'crop_watermelon', 'crop_sunflower']) {
      expect(GARDEN_HYBRIDS.recipes.some((r) => r.result === id), id).toBe(true);
    }
  });

  it('Cloud: every flower is a shop seed or reachable, every hybrid and every rare flower has a recipe', () => {
    const sold = FLOWER_LIST.filter((f) => !f.hybrid && CB.shop.some((l) => l.itemId === f.seedItem)).map((f) => f.id);
    const all = reachable(CLOUD_HYBRIDS.recipes, sold);
    expect(FLOWER_LIST.filter((f) => !all.has(f.id)).map((f) => f.id)).toEqual([]);
    for (const f of FLOWER_LIST.filter((x) => x.hybrid || x.kind === 'RARE')) expect(CLOUD_HYBRIDS.recipes.some((r) => r.result === f.id), f.id).toBe(true);
  });

  it('Aquarium: every fish above Common has a crossing recipe whose parents can be caught or bought', () => {
    const starters = FISH_LIST.filter((f) => f.rarity === 'COMMON' && (f.catchWeight > 0 || AB.shop.some((l) => l.itemId === f.item))).map((f) => f.id);
    const all = reachable(FISH_HYBRIDS.recipes, starters);
    expect(FISH_LIST.filter((f) => !all.has(f.id)).map((f) => f.id)).toEqual([]);
    for (const f of FISH_LIST.filter((x) => x.rarity !== 'COMMON')) expect(FISH_HYBRIDS.recipes.some((r) => r.result === f.id), f.id).toBe(true);
  });

  it('Farm: the twelve pigs of decision 035 each have a mutation recipe', () => {
    const results = new Set(FARM_CONTENT.breeding.mutations.map((m) => m.result));
    const added = ['PIG_FISHERMAN', 'PIG_GARDENER', 'PIG_STRAWBERRY', 'PIG_CORN', 'PIG_COFFEE', 'PIG_SNOWMAN', 'PIG_ONG_DIA', 'PIG_SAMURAI', 'PIG_ALCHEMIST', 'PIG_FAIRY', 'PIG_MERMAID', 'PIG_POSEIDON'];
    for (const id of added) {
      expect(SPECIES_ROWS.some((s) => s.id === id), id).toBe(true);
      expect(results.has(id as never), id).toBe(true);
    }
  });
});

describe('the pity', () => {
  it('raises the chance by pityStep per miss and makes the try sure after pityAfter misses', () => {
    const r = GARDEN_HYBRIDS.recipes.find((x) => x.id === 'hy_sunflower')!;
    expect(crossChance(r, 0, GARDEN_HYBRIDS)).toBe(r.percent);
    expect(crossChance(r, 1, GARDEN_HYBRIDS)).toBe(r.percent + GARDEN_HYBRIDS.pityStep);
    expect(crossChance(r, GARDEN_HYBRIDS.pityAfter, GARDEN_HYBRIDS)).toBe(100);
    expect(recipeFor(GARDEN_HYBRIDS.recipes, 'crop_wheat', 'crop_watermelon')?.id).toBe('hy_sunflower');
  });
});

describe('the Garden lab', () => {
  const bag = { item_potato: 5, item_carrot: 5 };

  it('a success uses one harvest of each, the fee, gives seeds and unlocks the seed in the shop', () => {
    const w = gardenWorld(bag);
    expect(seedUnlocked(gardenOf(w), 'crop_sweet_potato')).toBe(false);
    expect(fail(buyShopItem(w, { itemId: 'item_seed_sweet_potato', count: 1 }, ctxAt(T0)))).toBe('HYBRID_LOCKED');
    const r = crossCrops(w, { a: 'crop_carrot', b: 'crop_potato' }, ctxAt(T0, 0));
    const after = ok(r);
    expect(items(after)).toMatchObject({ item_potato: 4, item_carrot: 4, item_seed_sweet_potato: GARDEN_LAB.seeds });
    expect(after.wallet.coins).toBe(10_000 - GARDEN_LAB.cost);
    expect(seedUnlocked(gardenOf(after), 'crop_sweet_potato')).toBe(true);
    expect(r.ok && r.events.find((e) => e.type === 'GARDEN_CROSSED')).toMatchObject({ success: true, firstTime: true, cropId: 'crop_sweet_potato' });
    expect(fail(buyShopItem(after, { itemId: 'item_seed_sweet_potato', count: 1 }, ctxAt(T0)))).toBe('ok');
  });

  it('a miss gives a parent seed back, counts the miss, and the try after pityAfter misses succeeds', () => {
    let w = gardenWorld(bag);
    for (let k = 0; k < GARDEN_HYBRIDS.pityAfter; k++) w = ok(crossCrops(w, { a: 'crop_potato', b: 'crop_carrot' }, ctxAt(T0, 0.999)));
    expect(gardenOf(w).lab?.misses.hy_sweet_potato).toBe(GARDEN_HYBRIDS.pityAfter);
    expect((items(w).item_seed_potato ?? 0) + (items(w).item_seed_carrot ?? 0)).toBe(GARDEN_HYBRIDS.pityAfter * GARDEN_LAB.consolation);
    const sure = ok(crossCrops(w, { a: 'crop_potato', b: 'crop_carrot' }, ctxAt(T0, 0.999)));
    expect(items(sure).item_seed_sweet_potato).toBe(GARDEN_LAB.seeds);
    expect(gardenOf(sure).lab?.misses.hy_sweet_potato).toBe(0);
  });

  it('refuses a pair with no recipe, missing harvests, and auto-buying a locked seed when planting', () => {
    expect(fail(crossCrops(gardenWorld(bag), { a: 'crop_potato', b: 'crop_potato' }, ctxAt(T0)))).toBe('NO_HYBRID_RECIPE');
    expect(fail(crossCrops(gardenWorld({ item_potato: 1 }), { a: 'crop_potato', b: 'crop_carrot' }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(fail(plantCrops(gardenWorld(), { cropId: 'crop_pumpkin', plots: [0] }, ctxAt(T0)))).toBe('HYBRID_LOCKED');
    // Seeds in the bag can always be sown.
    expect(fail(plantCrops(gardenWorld({ item_seed_pumpkin: 1 }), { cropId: 'crop_pumpkin', plots: [0] }, ctxAt(T0)))).toBe('ok');
    // A plain crop is never locked.
    expect(CROPS.crop_tomato!.hybrid).toBe(false);
  });
});

describe('the Cloud lab', () => {
  it('crosses two flowers into a hybrid flower and unlocks its seed for planting', () => {
    const w = cloudWorld({ item_flower_moon_lily: 1, item_flower_dream_bell: 1 });
    expect(fail(plantFlowers(w, { flowerId: 'flower_comet_lavender', plots: [0] }, ctxAt(T0)))).toBe('HYBRID_LOCKED');
    const after = ok(crossFlowers(w, { a: 'flower_moon_lily', b: 'flower_dream_bell' }, ctxAt(T0, 0)));
    expect(items(after).item_seed_comet_lavender).toBe(CLOUD_LAB.seeds);
    expect(cloudOf(after).lab?.found).toEqual(['flower_comet_lavender']);
    expect(fail(plantFlowers(after, { flowerId: 'flower_comet_lavender', plots: [0, 1, 2] }, ctxAt(T0)))).toBe('ok');
  });
});

describe('fish crossing in the tank', () => {
  const fish = (over: Partial<Fish>): Fish => ({
    id: 'f', breed: 'fish_goldfish', name: 'Bé', gender: 'MALE', growthProgress: 100, hunger: 100, cleanliness: 100, isSick: false, generation: 1, createdAt: T0, lastTickedAt: T0, ...over,
  });
  function tankWorld(list: Fish[]): WorldSave {
    const fresh = SAVE_CODEC.newWorld(ctxAt(T0 - 30 * 86_400_000));
    const opened = aquariumArea.init(fresh, ctxAt(T0));
    return withAquarium(
      { ...opened, inventory: { items: { FOOD_FISH: 10 } }, meta: { ...opened.meta, createdAt: T0 - 30 * 86_400_000 } },
      { ...aquariumOf(opened), fish: list, lastTickedAt: T0 },
    );
  }
  const pair = [fish({ id: 'm', breed: 'fish_goldfish', gender: 'MALE' }), fish({ id: 'f', breed: 'fish_guppy', gender: 'FEMALE' })];

  it('two species with a recipe are a pair; two without one are not', () => {
    expect(pairError(aquariumOf(tankWorld(pair)), pair[0], pair[1], T0)).toBeNull();
    const odd = [fish({ id: 'm', breed: 'fish_goldfish' }), fish({ id: 'f', breed: 'fish_moonfish', gender: 'FEMALE' })];
    expect(pairError(aquariumOf(tankWorld(odd)), odd[0], odd[1], T0)).toBe('NOT_A_PAIR');
  });

  it('a lucky crossing lays an egg of the rarer species; a miss lays the mother\'s and counts', () => {
    const lucky = ok(breedFish(tankWorld(pair), { fishAId: 'm', fishBId: 'f' }, ctxAt(T0, 0)));
    expect(aquariumOf(lucky).eggs.at(-1)).toMatchObject({ species: 'fish_clownfish', hybrid: true });
    expect(aquariumOf(lucky).crossMisses?.hy_clownfish).toBe(0);
    const missed = ok(breedFish(tankWorld(pair), { fishAId: 'm', fishBId: 'f' }, ctxAt(T0, 0.999)));
    expect(aquariumOf(missed).crossMisses?.hy_clownfish).toBe(1);
  });
});
