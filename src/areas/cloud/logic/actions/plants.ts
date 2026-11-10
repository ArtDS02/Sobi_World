// Flower plot actions (spec §8.4): sow, water with pure water, fertilise, pick. Each works on a list of plots so "plant
// everywhere" and "pick everything" are one action, not twenty clicks.
import { CONTENT } from '../../../../core/config/content';
import { ITEMS } from '../../../../core/config/items';
import { rhythmTip } from '../../../../systems/minigame/rhythm';
import type { ItemId } from '../../../../core/config/ids';
import type { ActionContext } from '../../../../core/types';
import type { WorldSave } from '../../../../core/save/world';
import { emptyPlot, plotStage, settlePlot, sow } from '../../../../systems/plants/plot';
import { CB, CLOUD_FREE_WATER, MAX_TIER_LEVEL, FERTILIZER_ITEM, FLOWERS, PLOT_RULES, WATER_ITEM, WATER_MS, tierOf } from '../config/content';
import { bonusItems } from '../../../../systems/plants/tiers';
import { cloudTierBonus, cloudTierLevel, isNightNow, needsWater, pickYield, seedUnlocked } from '../derived';
import type { CloudEvent } from '../events';
import { countOf, give, pay, put, runCloud, take, type CloudResult } from './kit';

const distinct = (list: readonly number[]): number[] => [...new Set(list)].sort((a, b) => a - b);
const valid = (plots: readonly number[], count: number): boolean => plots.length > 0 && plots.every((i) => Number.isInteger(i) && i >= 0 && i < count);

/** Sows `flowerId` on each plot of `plots`: seeds from the bag first, the shortfall bought at the seed's price. */
export function plantFlowers(world: WorldSave, args: { flowerId: string; plots: number[] }, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const flower = FLOWERS[args.flowerId];
    const plots = distinct(args.plots);
    if (!flower || !valid(plots, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    if (plots.some((i) => g.plots[i]!.cropId !== null)) return { ok: false, error: 'PLOT_OCCUPIED' };
    const fromBag = Math.min(countOf(w, flower.seedItem), plots.length);
    const bought = plots.length - fromBag;
    if (bought > 0 && !seedUnlocked(g, flower.id)) return { ok: false, error: 'HYBRID_LOCKED' };
    const gold = bought * ITEMS[flower.seedItem as ItemId].priceGold;
    const taken = take(w, flower.seedItem, fromBag);
    if (!taken.ok) return taken;
    const paid = gold > 0 ? pay(taken.world, -gold, 'CLOUD_SEEDS', ctx, { refId: flower.seedItem, note: `x${bought}` }) : { ok: true as const, state: taken.world };
    if (!paid.ok) return paid;
    const sown = g.plots.map((p, i) => (plots.includes(i) ? sow(flower.id) : p));
    return {
      ok: true,
      world: put(paid.state, { ...g, plots: sown }),
      events: [{ type: 'CLOUD_PLANTED', flowerId: flower.id, plots, bought, gold }],
      xp: plots.length * CB.xp.plant,
    };
  });
}

/**
 * Waters every growing plot of `plots` (all of them when absent) that is dry, one pure water each: the plot grows at full
 * speed for `waterHours`. With less water than plots the first plots are watered and the rest wait.
 */
export function waterPlots(world: WorldSave, args: { plots?: number[]; score?: number }, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const wanted = args.plots ? distinct(args.plots) : g.plots.map((_, i) => i);
    if (args.plots && !valid(wanted, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    const dry = wanted.filter((i) => needsWater(g.plots[i]!, ctx.now));
    if (dry.length === 0) return { ok: false, error: 'NOTHING_TO_DO' };
    const have = countOf(w, WATER_ITEM);
    // Decision 056, top rank perk: a plot on a rank-5 cloud tier has a chance to be watered for free (seeded rng, action-level only).
    const free = (i: number) => cloudTierLevel(g, tierOf(i)) >= MAX_TIER_LEVEL && ctx.rng.next() < CLOUD_FREE_WATER;
    const todo: number[] = [];
    let cost = 0;
    for (const i of dry) {
      const isFree = free(i);
      if (!isFree && cost >= have) continue;
      todo.push(i);
      if (!isFree) cost += 1;
    }
    if (todo.length === 0) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    const taken = take(w, WATER_ITEM, cost);
    if (!taken.ok) return taken;
    const plots = g.plots.map((p, i) => (todo.includes(i) ? { ...p, wetUntil: ctx.now + WATER_MS } : p));
    // D8: the timing mini-game's tip, scaled by its score; the plain watering pays none.
    const tip = args.score === undefined ? 0 : rhythmTip(args.score, todo.length, CONTENT.minigame.rhythm);
    const paid = tip > 0 ? pay(put(taken.world, { ...g, plots }), tip, 'MINIGAME_TIP', ctx) : { ok: true as const, state: put(taken.world, { ...g, plots }) };
    if (!paid.ok) return paid;
    return { ok: true, world: paid.state, events: [{ type: 'CLOUD_WATERED', plots: todo.length, ...(cost < todo.length ? { free: todo.length - cost } : {}), ...(tip > 0 ? { tip } : {}) }], xp: todo.length * CB.xp.water };
  });
}

/** Fertilises growing plots: one fertiliser each; it shortens the growth and adds to the harvest. */
export function fertilizePlots(world: WorldSave, args: { plots: number[] }, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const plots = distinct(args.plots);
    if (!valid(plots, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    const todo = plots.filter((i) => {
      const p = g.plots[i]!;
      return p.cropId !== null && p.ripeAt === null && !p.fertilized;
    });
    if (todo.length === 0) return { ok: false, error: 'NOTHING_TO_DO' };
    const taken = take(w, FERTILIZER_ITEM, todo.length);
    if (!taken.ok) return taken;
    const next = g.plots.map((p, i) => (todo.includes(i) ? settlePlot({ ...p, fertilized: true }, FLOWERS[p.cropId!], PLOT_RULES, ctx.now) : p));
    return { ok: true, world: put(taken.world, { ...g, plots: next }), events: [{ type: 'CLOUD_FERTILIZED', plots: todo }], xp: todo.length * CB.xp.fertilize };
  });
}

/**
 * Picks the ripe (or wilted) plots of `plots` (all of them when absent). A plot is taken whole or not at all: when the bag
 * has no room for the next one the rest stay on the stem (`left`). A night flower picked at night gives more.
 */
export function harvestFlowers(world: WorldSave, args: { plots?: number[] }, ctx: ActionContext): CloudResult {
  return runCloud(world, ctx, (w, g) => {
    const wanted = args.plots ? distinct(args.plots) : g.plots.map((_, i) => i);
    if (args.plots && !valid(wanted, g.plots.length)) return { ok: false, error: 'INVALID_REQUEST' };
    const ready = wanted.filter((i) => g.plots[i]!.cropId !== null && g.plots[i]!.ripeAt !== null);
    if (ready.length === 0) return { ok: false, error: args.plots ? 'NOT_RIPE' : 'NOTHING_TO_DO' };
    const night = isNightNow(ctx.now, ctx.dayOffsetMs ?? 0);
    let bag = w;
    let plots = g.plots;
    const quantity = new Map<string, number>();
    const bonus = new Map<string, number>();
    const taken = new Map<string, number>();
    let count = 0;
    let wilted = 0;
    for (const i of ready) {
      const p = g.plots[i]!;
      const flower = FLOWERS[p.cropId!]!;
      const base = pickYield(p, ctx.now, ctx.dayOffsetMs ?? 0);
      // Decision 056: the tier of the cloud tier gives each item a chance of one more (seeded, so replays agree).
      const extra = bonusItems(base, cloudTierBonus(g, tierOf(i)), ctx.rng);
      const n = base + extra;
      const added = give(bag, { [flower.produceItem]: n }); // the bag has no limit (decision 057): every ready plot is taken
      if (!added.ok) return added;
      bag = added.world;
      plots = plots.map((q, j) => (j === i ? emptyPlot() : q));
      bonus.set(flower.id, (bonus.get(flower.id) ?? 0) + extra);
      quantity.set(flower.id, (quantity.get(flower.id) ?? 0) + n);
      taken.set(flower.id, (taken.get(flower.id) ?? 0) + 1);
      count += 1;
      if (plotStage(p, PLOT_RULES, ctx.now) === 'wilted') wilted += 1;
    }
    const events: CloudEvent[] = [...quantity].map(([flowerId, q]) => ({
      type: 'CLOUD_HARVESTED' as const,
      flowerId,
      quantity: q,
      bonus: bonus.get(flowerId) ?? 0,
      plots: taken.get(flowerId) ?? 0,
      wilted,
      night: night && FLOWERS[flowerId]?.kind === 'NIGHT',
    }));
    return { ok: true, world: put(bag, { ...g, plots }), events, xp: count * CB.xp.harvest };
  });
}
