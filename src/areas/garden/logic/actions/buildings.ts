// Spending on the Garden itself (plots, sprinkler, workshops) and running the workshops (core/production).
import { RECIPES } from '../../../../core/config/recipes';
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { affordableBatches, batchesReady, collectBatches, scaled } from '../../../../core/production/production';
import { emptyPlot } from '../../../../systems/plants/plot';
import { type BuildingId, BUILDING_IDS, GB } from '../config/content';
import { nextExpansion, nextSprinkler } from '../derived';
import { give, pay, put, runGarden, take, type GardenResult } from './kit';

const isBuilding = (id: string): id is BuildingId => (BUILDING_IDS as readonly string[]).includes(id);

/** Opens the next three plots. */
export function buyPlots(world: WorldSave, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const next = nextExpansion(g);
    if (!next) return { ok: false, error: 'MAX_SLOTS_REACHED' };
    const paid = pay(w, -next.price, 'GARDEN_PLOTS', ctx, { note: `${next.plots} plots` });
    if (!paid.ok) return paid;
    const plots = [...g.plots, ...Array.from({ length: next.plots - g.plots.length }, emptyPlot)];
    return { ok: true, world: put(paid.state, { ...g, plots }), events: [{ type: 'GARDEN_PLOTS_BOUGHT', plots: next.plots, gold: next.price }] };
  });
}

/** Buys the sprinkler, or its next level. */
export function upgradeSprinkler(world: WorldSave, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const next = nextSprinkler(g);
    if (!next) return { ok: false, error: 'MAX_LEVEL_REACHED' };
    // The higher levels also take the Aquarium's materials (scales, pearls) from the bag.
    const needs = Object.entries(next.materials).filter((e): e is [string, number] => (e[1] ?? 0) > 0);
    if (needs.some(([id, n]) => (w.inventory.items[id] ?? 0) < n)) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    const paid = pay(w, -next.price, 'GARDEN_SPRINKLER', ctx, { note: `level ${next.level}` });
    if (!paid.ok) return paid;
    let bag = paid.state;
    for (const [id, n] of needs) {
      const taken = take(bag, id, n);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    return {
      ok: true,
      world: put(bag, { ...g, sprinkler: next.level }),
      events: [{ type: 'GARDEN_SPRINKLER_BOUGHT', level: next.level, gold: next.price, materials: next.materials }],
    };
  });
}

export function buildWorkshop(world: WorldSave, args: { building: string }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const id = args.building;
    if (!isBuilding(id)) return { ok: false, error: 'INVALID_REQUEST' };
    if (g.built[id]) return { ok: false, error: 'ALREADY_OWNED' };
    const price = GB.buildings[id].price;
    const paid = pay(w, -price, 'GARDEN_BUILD', ctx, { refId: id });
    if (!paid.ok) return paid;
    return { ok: true, world: put(paid.state, { ...g, built: { ...g.built, [id]: true } }), events: [{ type: 'GARDEN_BUILT', building: id, gold: price }] };
  });
}

/** Starts `batches` of a recipe in a workshop: the inputs leave the bag now, the batches finish one after another. */
export function startCraft(world: WorldSave, args: { building: string; recipeId: string; batches: number }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const recipe = RECIPES[args.recipeId];
    const { building, batches } = args;
    if (!isBuilding(building) || !recipe || recipe.building !== building) return { ok: false, error: 'INVALID_REQUEST' };
    if (!Number.isInteger(batches) || batches < 1 || batches > GB.maxBatches) return { ok: false, error: 'INVALID_REQUEST' };
    if (!g.built[building]) return { ok: false, error: 'NOT_BUILT' };
    if (g.jobs[building]) return { ok: false, error: 'BUILDING_BUSY' };
    if (affordableBatches(recipe, w.inventory.items) < batches) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    let bag = w;
    for (const [id, count] of Object.entries(scaled(recipe.inputs, batches))) {
      const taken = take(bag, id, count);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    const job = { recipeId: recipe.id, batches, startedAt: ctx.now, collected: 0 };
    return {
      ok: true,
      world: put(bag, { ...g, jobs: { ...g.jobs, [building]: job } }),
      events: [{ type: 'GARDEN_CRAFT_STARTED', building, recipeId: recipe.id, batches }],
    };
  });
}

/** Takes the finished batches out of a workshop; as many as the bag has room for, the rest stay there. */
export function collectCraft(world: WorldSave, args: { building: string }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const { building } = args;
    if (!isBuilding(building)) return { ok: false, error: 'INVALID_REQUEST' };
    const job = g.jobs[building];
    const recipe = job ? RECIPES[job.recipeId] : undefined;
    if (!job || !recipe) return { ok: false, error: 'NOTHING_TO_COLLECT' };
    const ready = batchesReady(job, recipe, ctx.now);
    if (ready <= 0) return { ok: false, error: 'NOTHING_TO_COLLECT' };
    for (let n = ready; n >= 1; n -= 1) {
      const given = give(w, scaled(recipe.outputs, n));
      if (!given.ok) continue;
      const next = collectBatches(job, n);
      return {
        ok: true,
        world: put(given.world, { ...g, jobs: { ...g.jobs, [building]: next } }),
        events: [{ type: 'GARDEN_CRAFT_COLLECTED', building, recipeId: recipe.id, batches: n, kept: ready - n }],
        xp: n * GB.xp.craft,
      };
    }
    return { ok: false, error: 'INVENTORY_FULL' };
  });
}

