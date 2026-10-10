// What the Cloud's screens and scene read off its state (derived, never stored).
import { dayPeriod } from '../../../core/clock';
import { TIME } from '../../../core/config/time';
import { RECIPES } from '../../../core/config/recipes';
import { batchesReady } from '../../../core/production/production';
import type { PlotStage } from '../../../systems/plants/plot';
import { growthShare, harvestYield, plotStage } from '../../../systems/plants/plot';
import { CB, FLOWERS, MAX_PLOTS, MAX_SPRING_LEVEL, PLOT_RULES, SPRING_LEVELS, springLevel } from './config/content';
import type { CloudState } from './state';

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

/** The next plot expansion, or null at the top. */
export const nextExpansion = (g: Pick<CloudState, 'plots'>): { plots: number; price: number } | null =>
  g.plots.length >= MAX_PLOTS ? null : (CB.plotExpansions.find((e) => e.plots > g.plots.length) ?? null);

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
