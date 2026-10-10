// Recipes (spec §6 Recipe): content/shared/recipes.json with the duration in milliseconds.
import type { Recipe } from '../production/production';
import { CONTENT } from './content';

export const RECIPE_LIST: readonly Recipe[] = CONTENT.recipes.recipes.map((r) => ({
  id: r.id,
  building: r.building,
  inputs: r.inputs,
  outputs: r.outputs,
  durationMs: Math.round(r.durationMin * 60_000),
}));

export const RECIPES: Readonly<Record<string, Recipe>> = Object.fromEntries(RECIPE_LIST.map((r) => [r.id, r]));

/** The recipes one building cooks, in file order. */
export const recipesOf = (building: string): Recipe[] => RECIPE_LIST.filter((r) => r.building === building);
