// Cross-breeding by recipe (decision 035): two parent species give a rarer one with a chance. Each failed try of a
// recipe raises the next try's chance (`pityStep` points) and after `pityAfter` failures in a row the next try always
// succeeds, so a rare species is never out of reach. Pure: the rng is injected; Areas keep the miss counters.
import type { Rng } from '../../core/rng';

export interface HybridRecipe {
  id: string;
  parents: readonly [string, string];
  result: string;
  /** Chance of the result on one try, in percent. */
  percent: number;
}

export interface HybridRules {
  pityAfter: number;
  pityStep: number;
}

/** The recipe for parents `a` and `b` (order ignored), if any. */
export const recipeFor = (recipes: readonly HybridRecipe[], a: string, b: string): HybridRecipe | undefined =>
  recipes.find((r) => (r.parents[0] === a && r.parents[1] === b) || (r.parents[0] === b && r.parents[1] === a));

/** Chance (percent, 0..100) of the next try of `recipe` after `misses` failed tries in a row. */
export function crossChance(recipe: HybridRecipe, misses: number, rules: HybridRules): number {
  if (misses >= rules.pityAfter) return 100;
  return Math.min(100, recipe.percent + Math.max(0, misses) * rules.pityStep);
}

/** One try: true when it gives the result. */
export const rollCross = (rng: Rng, recipe: HybridRecipe, misses: number, rules: HybridRules): boolean =>
  rng.next() * 100 < crossChance(recipe, misses, rules);

/** Miss counter after a try. */
export const nextMisses = (misses: number, success: boolean): number => (success ? 0 : misses + 1);

/** Every species reachable from `starters` by crossing (the starters included). */
export function reachable(recipes: readonly HybridRecipe[], starters: Iterable<string>): Set<string> {
  const have = new Set(starters);
  for (let grew = true; grew; ) {
    grew = false;
    for (const r of recipes) {
      if (!have.has(r.result) && have.has(r.parents[0]) && have.has(r.parents[1])) {
        have.add(r.result);
        grew = true;
      }
    }
  }
  return have;
}

/** Recipes that can give `species`. */
export const recipesFor = (recipes: readonly HybridRecipe[], species: string): HybridRecipe[] => recipes.filter((r) => r.result === species);
