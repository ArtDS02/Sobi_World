// The crossing lab (decision 035): one harvest of each of two flowers and a fee give, with the recipe's chance, seeds of
// a rarer flower. A failed try gives a seed of a parent back and raises the next try's chance (systems/hybrid). The first
// success unlocks the flower's seed in the shop and the auto-buy of plantFlowers.
import { pick } from '../../../../core/rng';
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { crossChance, nextMisses, recipeFor, rollCross } from '../../../../systems/hybrid';
import { FLOWERS, CLOUD_HYBRIDS, CLOUD_LAB } from '../config/content';
import { labOf } from '../derived';
import { give, pay, put, runCloud, take, type CloudResult } from './kit';

export function crossFlowers(world: WorldSave, args: { a: string; b: string }, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const a = FLOWERS[args.a], b = FLOWERS[args.b];
    if (!a || !b) return { ok: false, error: 'INVALID_REQUEST' };
    const recipe = recipeFor(CLOUD_HYBRIDS.recipes, a.id, b.id);
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
    const paid = CLOUD_LAB.cost > 0 ? pay(step.world, -CLOUD_LAB.cost, 'CLOUD_LAB', ctx, { refId: recipe.id }) : { ok: true as const, state: step.world };
    if (!paid.ok) return paid;
    const chance = crossChance(recipe, misses, CLOUD_HYBRIDS);
    const success = rollCross(ctx.rng, recipe, misses, CLOUD_HYBRIDS);
    const result = FLOWERS[recipe.result]!;
    const back = success ? null : pick(ctx.rng, [a, b]);
    const gains = success ? { [result.seedItem]: CLOUD_LAB.seeds } : CLOUD_LAB.consolation > 0 ? { [back!.seedItem]: CLOUD_LAB.consolation } : {};
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
          type: 'CLOUD_CROSSED',
          recipeId: recipe.id,
          flowerId: result.id,
          success,
          firstTime,
          chance,
          seeds: success ? CLOUD_LAB.seeds : CLOUD_LAB.consolation,
          seedItem: success ? result.seedItem : (back?.seedItem ?? null),
        },
      ],
      xp: CLOUD_LAB.xp * (success ? 2 : 1),
    };
  });
}
