// Spending on the Garden itself (plots, sprinkler, workshops) and running the workshops (core/production).
import { RECIPES } from '../../../../core/config/recipes';
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { worldLevel } from '../../../../core/progression/levels';
import { techBonus, recipeLocked } from '../../../../core/config/tech';
import { affordableBatches, batchesReady, collectBatches, scaled, sped } from '../../../../core/production/production';
import { emptyPlot } from '../../../../systems/plants/plot';
import { type BuildingId, BUILDING_IDS, GB, ZONE_COUNT } from '../config/content';
import { gardenZoneUpgrade, nextExpansion, nextSprinkler } from '../derived';
import { ownsSkin } from '../../../../core/plots/skins';
import { withSkin, withTier } from '../../../../systems/plants/tiers';
import { give, pay, put, runGarden, take, type GardenResult } from './kit';

const isBuilding = (id: string): id is BuildingId => (BUILDING_IDS as readonly string[]).includes(id);

/** Opens the next plots: a row of the first zone, or a whole new zone (gated by the world level, decision 028). */
export function buyPlots(world: WorldSave, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const next = nextExpansion(g);
    if (!next) return { ok: false, error: 'MAX_SLOTS_REACHED' };
    if (worldLevel(w, WORLD_LEVELS) < next.level) return { ok: false, error: 'LEVEL_TOO_LOW' };
    const paid = pay(w, -next.price, 'GARDEN_PLOTS', ctx, { note: `${next.plots} plots` });
    if (!paid.ok) return paid;
    const plots = [...g.plots, ...Array.from({ length: next.plots - g.plots.length }, emptyPlot)];
    return { ok: true, world: put(paid.state, { ...g, plots }), events: [{ type: 'GARDEN_PLOTS_BOUGHT', plots: next.plots, gold: next.price, ...(next.zone !== null ? { zone: next.zone } : {}) }] };
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
    if (!Number.isInteger(batches) || batches < 1 || batches > GB.maxBatches + techBonus(w, 'maxBatches')) return { ok: false, error: 'INVALID_REQUEST' };
    if (recipeLocked(w, recipe)) return { ok: false, error: 'RECIPE_LOCKED' };
    if (!g.built[building]) return { ok: false, error: 'NOT_BUILT' };
    if (g.jobs[building]) return { ok: false, error: 'BUILDING_BUSY' };
    if (affordableBatches(recipe, w.inventory.items) < batches) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    let bag = w;
    for (const [id, count] of Object.entries(scaled(recipe.inputs, batches))) {
      const taken = take(bag, id, count);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    const job = { recipeId: recipe.id, batches, startedAt: ctx.now, durationMs: sped(recipe, techBonus(w, 'productionSpeed')), collected: 0 };
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


/**
 * Raises garden zone `args.group` (0-based) one upgrade tier (decision 056): the zone must own all its plots and the world
 * level must be high enough; coins and items are paid together, coins through the ledger (GARDEN_ZONE_UPGRADE).
 */
export function upgradeZone(world: WorldSave, args: { group: number }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const { group } = args;
    if (!Number.isInteger(group) || group < 0 || group >= ZONE_COUNT) return { ok: false, error: 'INVALID_REQUEST' };
    const { step, block } = gardenZoneUpgrade(g, group, worldLevel(w, WORLD_LEVELS));
    if (!step) return { ok: false, error: 'MAX_LEVEL_REACHED' };
    if (block === 'GROUP_INCOMPLETE') return { ok: false, error: 'INVALID_REQUEST' };
    if (block === 'LEVEL') return { ok: false, error: 'LEVEL_TOO_LOW' };
    const needs = Object.entries(step.items);
    if (needs.some(([id, n]) => (w.inventory.items[id] ?? 0) < n)) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    const paid = step.coins > 0 ? pay(w, -step.coins, 'GARDEN_ZONE_UPGRADE', ctx, { refId: `zone${group + 1}`, note: `tier ${step.tier}` }) : { ok: true as const, state: w };
    if (!paid.ok) return paid;
    let bag = paid.state;
    for (const [id, n] of needs) {
      const taken = take(bag, id, n);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    return {
      ok: true,
      world: put(bag, { ...g, zoneLevels: withTier(g.zoneLevels, group, step.tier) }),
      events: [{ type: 'GARDEN_ZONE_UPGRADED', group, tier: step.tier, gold: step.coins, items: step.items }],
      xp: step.xp,
    };
  });
}

/**
 * Dresses garden zone `args.group` (0-based) in a plot skin the player owns, or back in the plain look (`skinId: null`). Free and
 * undoable (decision 056): a skin only changes the picture of the zone's plots.
 */
export function applyZoneSkin(world: WorldSave, args: { group: number; skinId: string | null }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const { group, skinId } = args;
    if (!Number.isInteger(group) || group < 0 || group >= ZONE_COUNT) return { ok: false, error: 'INVALID_REQUEST' };
    if (skinId !== null && !ownsSkin(w, skinId)) return { ok: false, error: 'INVALID_REQUEST' };
    return {
      ok: true,
      world: put(w, { ...g, zoneSkins: withSkin(g.zoneSkins, group, skinId) }),
      events: [{ type: 'GARDEN_SKIN_APPLIED', group, skinId }],
    };
  });
}
