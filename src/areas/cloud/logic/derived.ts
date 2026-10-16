// What the Cloud's screens and scene read off its state (derived, never stored).
import { dayPeriod } from '../../../core/clock';
import { TIME } from '../../../core/config/time';
import { RECIPES } from '../../../core/config/recipes';
import { batchesReady } from '../../../core/production/production';
import type { PlotStage } from '../../../systems/plants/plot';
import { growthShare, harvestYield, plotStage } from '../../../systems/plants/plot';
import { CB, FLOWERS, MAX_PLOTS, MAX_SPRING_LEVEL, PLOTS_PER_TIER, PLOT_RULES, SPRING_LEVELS, springLevel, tierOf } from './config/content';
import type { CloudState } from './state';

/** The crossing lab of a save (decision 035); empty when the save predates it. */
export const labOf = (g: Pick<CloudState, 'lab'>): NonNullable<CloudState['lab']> => g.lab ?? { found: [], misses: {} };

/** Whether the seed of `flowerId` can be bought: a plain flower, or a hybrid the lab has given once. */
export const seedUnlocked = (g: Pick<CloudState, 'lab'>, flowerId: string): boolean => !FLOWERS[flowerId]?.hybrid || labOf(g).found.includes(flowerId);

/** Is it the night period (the night flowers give more then, the lights in the scene)? */
export const isNightNow = (now: number, dayOffsetMs: number): boolean => dayPeriod(now, dayOffsetMs, TIME) === 'night';

/** Pure water waiting in the spring, up to its capacity. */
export function springStock(g: Pick<CloudState, 'spring'>, now: number): number {
  const level = springLevel(g.spring.level);
  return Math.min(level.capacity, Math.max(0, Math.floor((now - g.spring.since) / level.intervalMs)));
}

/** Milliseconds until the next unit flows (0 when the spring is full). */
export function msToNextWater(g: Pick<CloudState, 'spring'>, now: number): number {
  const level = springLevel(g.spring.level);
  if (springStock(g, now) >= level.capacity) return 0;
  const into = Math.max(0, now - g.spring.since) % level.intervalMs;
  return level.intervalMs - into;
}

/** The next spring level and what it takes, or null at the top. */
export function nextSpringLevel(g: Pick<CloudState, 'spring'>): { level: number; price: number; materials: Readonly<Record<string, number | undefined>> } | null {
  if (g.spring.level >= MAX_SPRING_LEVEL) return null;
  const next = SPRING_LEVELS[g.spring.level]!;
  return { level: g.spring.level + 1, price: next.price, materials: next.materials };
}

export interface Expansion {
  /** Plots owned after it. */
  plots: number;
  price: number;
  /** World level it needs (1 = none). */
  level: number;
  /** The tier it opens (0-based), or null when it adds plots to the first tier. */
  tier: number | null;
}

/** The next plot expansion (more plots on the first tier, then a whole new tier), or null at the top. */
export function nextExpansion(g: Pick<CloudState, 'plots'>): Expansion | null {
  if (g.plots.length >= MAX_PLOTS) return null;
  const step = CB.plotExpansions.find((e) => e.plots > g.plots.length);
  if (!step) return null;
  const tier = step.plots > PLOTS_PER_TIER ? tierOf(step.plots - 1) : null;
  return { plots: step.plots, price: step.price, level: step.level ?? 1, tier };
}

/** Tiers the player owns at least one plot on (1 or more). */
export const ownedTiers = (g: Pick<CloudState, 'plots'>): number => tierOf(g.plots.length - 1) + 1;

/** A growing plot that pure water helps now: not ripe and not wet already. */
export const needsWater = (plot: Pick<CloudState['plots'][number], 'cropId' | 'ripeAt' | 'wetUntil'>, now: number): boolean =>
  plot.cropId !== null && plot.ripeAt === null && plot.wetUntil <= now;

/** What picking a plot gives now: the flower's yield, times the night factor for a night flower picked at night. */
export function pickYield(plot: CloudState['plots'][number], now: number, dayOffsetMs: number): number {
  const flower = plot.cropId ? FLOWERS[plot.cropId] : undefined;
  if (!flower) return 0;
  const base = harvestYield(plot, flower, PLOT_RULES, now);
  return flower.kind === 'NIGHT' && isNightNow(now, dayOffsetMs) ? Math.round(base * CB.nightYieldFactor) : base;
}

export interface PlotView {
  index: number;
  stage: PlotStage;
  flowerId: string | null;
  /** 0..1 */
  share: number;
  watered: boolean;
  fertilized: boolean;
  /** What picking it gives now (0 while it is not ripe). */
  yield: number;
}

export function plotViews(g: CloudState, now: number, dayOffsetMs = 0): PlotView[] {
  return g.plots.map((plot, index) => {
    const flower = plot.cropId ? FLOWERS[plot.cropId] : undefined;
    const stage = flower ? plotStage(plot, PLOT_RULES, now) : 'empty';
    return {
      index,
      stage,
      flowerId: flower ? plot.cropId : null,
      share: flower ? growthShare(plot, flower, PLOT_RULES) : 0,
      watered: stage === 'growing' && plot.wetUntil > now,
      fertilized: plot.fertilized,
      yield: flower && (stage === 'ripe' || stage === 'wilted') ? pickYield(plot, now, dayOffsetMs) : 0,
    };
  });
}

/** Finished batches waiting in the cauldron. */
export function cauldronReady(g: CloudState, now: number): number {
  const job = g.cauldron.job;
  const recipe = job ? RECIPES[job.recipeId] : undefined;
  return job && recipe ? batchesReady(job, recipe, now) : 0;
}

export interface SceneState {
  plots: PlotView[];
  water: number;
  waterCapacity: number;
  springLevel: number;
  cauldron: { built: boolean; busy: boolean; ready: number };
  night: boolean;
}

export const sceneState = (g: CloudState, now: number, dayOffsetMs = 0): SceneState => ({
  plots: plotViews(g, now, dayOffsetMs),
  water: springStock(g, now),
  waterCapacity: springLevel(g.spring.level).capacity,
  springLevel: g.spring.level,
  cauldron: { built: g.cauldron.built, busy: g.cauldron.job !== null, ready: cauldronReady(g, now) },
  night: isNightNow(now, dayOffsetMs),
});
