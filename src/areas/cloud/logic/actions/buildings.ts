// Spending on the Cloud itself (plots, spring, cauldron), collecting pure water and running the cauldron (core/production).
import { RECIPES } from '../../../../core/config/recipes';
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { affordableBatches, batchesReady, collectBatches, scaled } from '../../../../core/production/production';
import { emptyPlot } from '../../../../systems/plants/plot';
import { CAULDRON, CB, WATER_ITEM, springLevel } from '../config/content';
import { nextExpansion, nextSpringLevel, springStock } from '../derived';
import { fits, give, pay, put, runCloud, take, type CloudResult } from './kit';

/** Opens the next plots. */
export function buyPlots(world: WorldSave, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const next = nextExpansion(g);
    if (!next) return { ok: false, error: 'MAX_SLOTS_REACHED' };
    const paid = pay(w, -next.price, 'CLOUD_PLOTS', ctx, { note: `${next.plots} plots` });
    if (!paid.ok) return paid;
    const plots = [...g.plots, ...Array.from({ length: next.plots - g.plots.length }, emptyPlot)];
    return { ok: true, world: put(paid.state, { ...g, plots }), events: [{ type: 'CLOUD_PLOTS_BOUGHT', plots: next.plots, gold: next.price }] };
  });
}

/**
 * Takes the pure water waiting in the spring into the bag: as many as the bag has room for. The part of the interval already
 * flowing is kept; a full spring starts over from now.
 */
export function collectWater(world: WorldSave, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const stock = springStock(g, ctx.now);
    if (stock <= 0) return { ok: false, error: 'NOTHING_TO_COLLECT' };
    const level = springLevel(g.spring.level);
    let n = stock;
    while (n > 0 && !fits(w, WATER_ITEM, n)) n -= 1;
    if (n === 0) return { ok: false, error: 'INVENTORY_FULL' };
    const given = give(w, { [WATER_ITEM]: n });
    if (!given.ok) return given;
    const since = stock >= level.capacity ? ctx.now - (n >= stock ? 0 : (stock - n) * level.intervalMs) : g.spring.since + n * level.intervalMs;
    return {
      ok: true,
      world: put(given.world, { ...g, spring: { ...g.spring, since } }),
      events: [{ type: 'CLOUD_WATER_COLLECTED', quantity: n, left: stock - n }],
    };
  });
}

/** Raises the spring to its next level: it flows faster and holds more; the water already waiting stays. */
export function upgradeSpring(world: WorldSave, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const next = nextSpringLevel(g);
    if (!next) return { ok: false, error: 'MAX_LEVEL_REACHED' };
    const needs = Object.entries(next.materials).filter((e): e is [string, number] => (e[1] ?? 0) > 0);
    if (needs.some(([id, n]) => (w.inventory.items[id] ?? 0) < n)) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    const paid = next.price > 0 ? pay(w, -next.price, 'CLOUD_SPRING', ctx, { note: `level ${next.level}` }) : { ok: true as const, state: w };
    if (!paid.ok) return paid;
    let bag = paid.state;
    for (const [id, n] of needs) {
      const taken = take(bag, id, n);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    // The stock stays as many units as it was: the new interval counts back from now.
    const stock = Math.min(springStock(g, ctx.now), springLevel(next.level).capacity);
    const since = ctx.now - stock * springLevel(next.level).intervalMs;
    return {
      ok: true,
      world: put(bag, { ...g, spring: { level: next.level, since } }),
      events: [{ type: 'CLOUD_SPRING_UPGRADED', level: next.level, gold: next.price, materials: next.materials }],
    };
  });
}

export function buildCauldron(world: WorldSave, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    if (g.cauldron.built) return { ok: false, error: 'ALREADY_OWNED' };
    const price = CB.cauldron.price;
    const paid = price > 0 ? pay(w, -price, 'CLOUD_BUILD', ctx, { refId: CAULDRON }) : { ok: true as const, state: w };
    if (!paid.ok) return paid;
    return { ok: true, world: put(paid.state, { ...g, cauldron: { ...g.cauldron, built: true } }), events: [{ type: 'CLOUD_CAULDRON_BUILT', gold: price }] };
  });
}

/** Starts `batches` of a recipe in the cauldron: the inputs leave the bag now, the batches finish one after another. */
export function startBrew(world: WorldSave, args: { recipeId: string; batches: number }, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const recipe = RECIPES[args.recipeId];
    const { batches } = args;
    if (!recipe || recipe.building !== CAULDRON) return { ok: false, error: 'INVALID_REQUEST' };
    if (!Number.isInteger(batches) || batches < 1 || batches > CB.cauldron.maxBatches) return { ok: false, error: 'INVALID_REQUEST' };
    if (!g.cauldron.built) return { ok: false, error: 'NOT_BUILT' };
    if (g.cauldron.job) return { ok: false, error: 'BUILDING_BUSY' };
    if (affordableBatches(recipe, w.inventory.items) < batches) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    let bag = w;
    for (const [id, count] of Object.entries(scaled(recipe.inputs, batches))) {
      const taken = take(bag, id, count);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    const job = { recipeId: recipe.id, batches, startedAt: ctx.now, collected: 0 };
    return { ok: true, world: put(bag, { ...g, cauldron: { ...g.cauldron, job } }), events: [{ type: 'CLOUD_BREW_STARTED', recipeId: recipe.id, batches }] };
  });
}

/** Takes the finished batches out of the cauldron; as many as the bag has room for, the rest stay there. */
export function collectBrew(world: WorldSave, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const job = g.cauldron.job;
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
        world: put(given.world, { ...g, cauldron: { ...g.cauldron, job: next } }),
        events: [{ type: 'CLOUD_BREW_COLLECTED', recipeId: recipe.id, batches: n, kept: ready - n }],
        xp: n * CB.xp.craft,
      };
    }
    return { ok: false, error: 'INVENTORY_FULL' };
  });
}
