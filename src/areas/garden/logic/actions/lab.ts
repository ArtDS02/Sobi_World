// The crossing lab (decision 035): one harvest of each of two crops and a fee give, with the recipe's chance, seeds of
// a rarer crop. A failed try gives a seed of a parent back and raises the next try's chance (systems/hybrid). The first
// success unlocks the crop's seed in the shop and the auto-buy of plantCrops.
import { pick } from '../../../../core/rng';
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { crossChance, nextMisses, recipeFor, rollCross } from '../../../../systems/hybrid';
import { CROPS, GARDEN_HYBRIDS, GARDEN_LAB } from '../config/content';
import { labOf } from '../derived';
import { give, pay, put, runGarden, take, type GardenResult } from './kit';

export function crossCrops(world: WorldSave, args: { a: string; b: string }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const a = CROPS[args.a], b = CROPS[args.b];
    if (!a || !b) return { ok: false, error: 'INVALID_REQUEST' };
    const recipe = recipeFor(GARDEN_HYBRIDS.recipes, a.id, b.id);
    if (!recipe) return { ok: false, error: 'NO_HYBRID_RECIPE' };
    const lab = labOf(g);
    const misses = lab.misses[recipe.id] ?? 0;
    // Same parent twice takes two of it.
    const used = a.id === b.id ? { [a.produceItem]: 2 } : { [a.produceItem]: 1, [b.produceItem]: 1 };
    let step: ReturnType<typeof take> = { ok: true, world: w };
    for (const [item, n] of Object.entries(used)) {
      step = step.ok ? take(step.world, item, n) : step;
    }
    if (!step.ok) return step;
    const paid = GARDEN_LAB.cost > 0 ? pay(step.world, -GARDEN_LAB.cost, 'GARDEN_LAB', ctx, { refId: recipe.id }) : { ok: true as const, state: step.world };
    if (!paid.ok) return paid;
    const chance = crossChance(recipe, misses, GARDEN_HYBRIDS);
    const success = rollCross(ctx.rng, recipe, misses, GARDEN_HYBRIDS);
    const result = CROPS[recipe.result]!;
    const back = success ? null : pick(ctx.rng, [a, b]);
    const gains = success ? { [result.seedItem]: GARDEN_LAB.seeds } : GARDEN_LAB.consolation > 0 ? { [back!.seedItem]: GARDEN_LAB.consolation } : {};
    const bagged = give(paid.state, gains);
    if (!bagged.ok) return bagged;
    const firstTime = success && !lab.found.includes(result.id);
    const next = {
      found: firstTime ? [...lab.found, result.id] : lab.found,
      misses: { ...lab.misses, [recipe.id]: nextMisses(misses, success) },
    };
    return {
      ok: true,
      world: put(bagged.world, { ...g, lab: next }),
      events: [
        {
          type: 'GARDEN_CROSSED',
          recipeId: recipe.id,
          cropId: result.id,
          success,
          firstTime,
          chance,
          seeds: success ? GARDEN_LAB.seeds : GARDEN_LAB.consolation,
          seedItem: success ? result.seedItem : (back?.seedItem ?? null),
        },
      ],
      xp: GARDEN_LAB.xp * (success ? 2 : 1),
    };
  });
}
