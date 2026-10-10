// Plot actions: sow, water, fertilise, harvest (spec §8.2). Each works on a list of plots so "plant
// everywhere" and "harvest everything" are one action, not twenty clicks.
import { ITEMS } from '../../../../core/config/items';
import type { ItemId } from '../../../../core/config/ids';
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { emptyPlot, harvestYield, plotStage, settlePlot, sow } from '../../../../systems/plants/plot';
import { CROPS, GB, PLOT_RULES, WATER_MS } from '../config/content';
import { isCovered } from '../derived';
import type { GardenEvent } from '../events';
import { countOf, fits, give, pay, put, runGarden, take, type GardenResult } from './kit';

const distinct = (list: readonly number[]): number[] => [...new Set(list)].sort((a, b) => a - b);
const valid = (plots: readonly number[], count: number): boolean => plots.length > 0 && plots.every((i) => Number.isInteger(i) && i >= 0 && i < count);

/** Sows `cropId` on each plot of `plots`: seeds from the bag first, the shortfall bought at the seed's price. */
export function plantCrops(world: WorldSave, args: { cropId: string; plots: number[] }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const crop = CROPS[args.cropId];
    const plots = distinct(args.plots);
    if (!crop || !valid(plots, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    if (plots.some((i) => g.plots[i]!.cropId !== null)) return { ok: false, error: 'PLOT_OCCUPIED' };
    const fromBag = Math.min(countOf(w, crop.seedItem), plots.length);
    const bought = plots.length - fromBag;
    const gold = bought * ITEMS[crop.seedItem as ItemId].priceGold;
    const taken = take(w, crop.seedItem, fromBag);
    if (!taken.ok) return taken;
    const paid = gold > 0 ? pay(taken.world, -gold, 'GARDEN_SEEDS', ctx, { refId: crop.seedItem, note: `x${bought}` }) : { ok: true as const, state: taken.world };
    if (!paid.ok) return paid;
    const sown = g.plots.map((p, i) => (plots.includes(i) ? sow(crop.id) : p));
    return {
      ok: true,
      world: put(paid.state, { ...g, plots: sown }),
      events: [{ type: 'GARDEN_PLANTED', cropId: crop.id, plots, bought, gold }],
      xp: plots.length * GB.xp.plant,
    };
  });
}

/** Waters every growing plot of `plots` (all of them when absent) that the sprinkler does not already water. */
export function waterPlots(world: WorldSave, args: { plots?: number[] }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const wanted = args.plots ? distinct(args.plots) : g.plots.map((_, i) => i);
    if (args.plots && !valid(wanted, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    const todo = wanted.filter((i) => {
      const p = g.plots[i]!;
      return p.cropId !== null && p.ripeAt === null && !isCovered(g, i);
    });
    if (todo.length === 0) return { ok: false, error: 'NOTHING_TO_DO' };
    const plots = g.plots.map((p, i) => (todo.includes(i) ? { ...p, wetUntil: ctx.now + WATER_MS } : p));
    return { ok: true, world: put(w, { ...g, plots }), events: [{ type: 'GARDEN_WATERED', plots: todo.length }], xp: todo.length * GB.xp.water };
  });
}

/** Fertilises growing plots: one fertiliser each; it shortens the growth and adds to the harvest. */
export function fertilizePlots(world: WorldSave, args: { plots: number[] }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const plots = distinct(args.plots);
    if (!valid(plots, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    const todo = plots.filter((i) => {
      const p = g.plots[i]!;
      return p.cropId !== null && p.ripeAt === null && !p.fertilized;
    });
    if (todo.length === 0) return { ok: false, error: 'NOTHING_TO_DO' };
    const taken = take(w, 'item_fertilizer', todo.length);
    if (!taken.ok) return taken;
    const next = g.plots.map((p, i) => (todo.includes(i) ? settlePlot({ ...p, fertilized: true }, CROPS[p.cropId!], PLOT_RULES, ctx.now) : p));
    return { ok: true, world: put(taken.world, { ...g, plots: next }), events: [{ type: 'GARDEN_FERTILIZED', plots: todo }], xp: todo.length * GB.xp.fertilize };
  });
}

/**
 * Harvests the ripe (or wilted) plots of `plots` (all of them when absent). A plot is taken whole or not
 * at all: when the bag has no room for the next one the rest stay on the vine (`left`).
 */
export function harvestPlots(world: WorldSave, args: { plots?: number[] }, ctx: ActionContext): GardenResult {
  return runGarden(world, ctx, (w, g) => {
    const wanted = args.plots ? distinct(args.plots) : g.plots.map((_, i) => i);
    if (args.plots && !valid(wanted, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    const ready = wanted.filter((i) => g.plots[i]!.cropId !== null && g.plots[i]!.ripeAt !== null);
    if (ready.length === 0) return { ok: false, error: args.plots ? 'NOT_RIPE' : 'NOTHING_TO_DO' };
    let bag = w;
    let plots = g.plots;
    const quantity = new Map<string, number>();
    const taken = new Map<string, number>();
    let count = 0;
    let wilted = 0;
    for (const i of ready) {
      const p = g.plots[i]!;
      const crop = CROPS[p.cropId!]!;
      const n = harvestYield(p, crop, PLOT_RULES, ctx.now);
      if (!fits(bag, crop.produceItem, n)) break; // the bag is full: the rest waits
      const added = give(bag, { [crop.produceItem]: n });
      if (!added.ok) break;
      bag = added.world;
      plots = plots.map((q, j) => (j === i ? emptyPlot() : q));
      quantity.set(crop.id, (quantity.get(crop.id) ?? 0) + n);
      taken.set(crop.id, (taken.get(crop.id) ?? 0) + 1);
      count += 1;
      if (plotStage(p, PLOT_RULES, ctx.now) === 'wilted') wilted += 1;
    }
    if (count === 0) return { ok: false, error: 'INVENTORY_FULL' };
    const events: GardenEvent[] = [...quantity].map(([cropId, q]) => ({
      type: 'GARDEN_HARVESTED' as const,
      cropId,
      quantity: q,
      plots: taken.get(cropId) ?? 0,
      wilted,
      left: ready.length - count,
    }));
    return { ok: true, world: put(bag, { ...g, plots }), events, xp: count * GB.xp.harvest };
  });
}
