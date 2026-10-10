// core/production: a workshop's job is a closed form of time (spec §6 Recipe).
import { describe, expect, it } from 'vitest';
import {
  affordableBatches,
  batchesDone,
  batchesFinishedBetween,
  batchesReady,
  collectBatches,
  jobEndsAt,
  nextBatchAt,
  scaled,
  type ProductionJob,
  type Recipe,
} from '../../src/core/production/production';
import { RECIPES, recipesOf } from '../../src/core/config/recipes';

const MIN = 60_000;
const recipe: Recipe = { id: 'r', building: 'mill', inputs: { a: 2, b: 1 }, outputs: { c: 4 }, durationMs: 10 * MIN };
const job: ProductionJob = { recipeId: 'r', batches: 3, startedAt: 1000, collected: 0 };

describe('production job', () => {
  it('finishes a batch every duration, one after another', () => {
    expect(batchesDone(job, recipe, 1000 + 9 * MIN)).toBe(0);
    expect(batchesDone(job, recipe, 1000 + 10 * MIN)).toBe(1);
    expect(batchesDone(job, recipe, 1000 + 25 * MIN)).toBe(2);
    expect(batchesDone(job, recipe, 1000 + 999 * MIN)).toBe(3);
    expect(batchesDone(job, recipe, 0)).toBe(0); // the clock never makes a negative count
    expect(jobEndsAt(job, recipe)).toBe(1000 + 30 * MIN);
    expect(nextBatchAt(job, recipe, 1000 + 12 * MIN)).toBe(1000 + 20 * MIN);
    expect(nextBatchAt(job, recipe, 1000 + 40 * MIN)).toBeNull();
  });

  it('counts only what finished in a window, so every slicing sums to the same total', () => {
    const total = batchesDone(job, recipe, 1000 + 30 * MIN);
    for (const step of [MIN, 10 * MIN, 7 * MIN, 30 * MIN]) {
      let sum = 0;
      for (let t = 1000; t < 1000 + 30 * MIN; t += step) sum += batchesFinishedBetween(job, recipe, t, Math.min(1000 + 30 * MIN, t + step));
      expect(sum).toBe(total);
    }
  });

  it('collecting moves the oldest batches out; the job ends with the last one', () => {
    const now = 1000 + 25 * MIN;
    expect(batchesReady(job, recipe, now)).toBe(2);
    const after = collectBatches(job, 2)!;
    expect(after.collected).toBe(2);
    expect(batchesReady(after, recipe, now)).toBe(0);
    expect(batchesReady(after, recipe, 1000 + 30 * MIN)).toBe(1);
    expect(collectBatches(after, 1)).toBeNull();
  });

  it('how many batches the bag affords, and the scaled lists', () => {
    expect(affordableBatches(recipe, { a: 5, b: 9 })).toBe(2);
    expect(affordableBatches(recipe, { a: 5 })).toBe(0);
    expect(scaled(recipe.inputs, 3)).toEqual({ a: 6, b: 3 });
  });
});

describe('the starter recipes (GAME_BALANCE §6)', () => {
  it('are in content with the numbers of the balance sheet', () => {
    expect(RECIPES.recipe_pig_feed).toMatchObject({ building: 'mill', inputs: { item_corn: 2, item_wheat: 1 }, outputs: { FOOD_BASIC: 4 }, durationMs: 10 * MIN });
    expect(RECIPES.recipe_premium_feed).toMatchObject({ inputs: { item_corn: 2, item_carrot: 1 }, outputs: { FOOD_PREMIUM: 2 }, durationMs: 20 * MIN });
    expect(RECIPES.recipe_fertilizer).toMatchObject({ building: 'composter', inputs: { item_manure: 3, item_grass: 1 }, outputs: { item_fertilizer: 2 }, durationMs: 30 * MIN });
    expect(recipesOf('mill').map((r) => r.id)).toEqual(['recipe_pig_feed', 'recipe_premium_feed']);
  });
});
