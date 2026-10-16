// What the Garden's screens and scene read off its state (derived, never stored).
import type { PlotStage } from '../../../systems/plants/plot';
import { growthShare, harvestYield, plotStage } from '../../../systems/plants/plot';
import { RECIPES } from '../../../core/config/recipes';
import { batchesReady } from '../../../core/production/production';
import { CROPS, GB, PLOT_RULES, MAX_PLOTS, PLOTS_PER_ZONE, zoneOf, type BuildingId } from './config/content';
import type { GardenState } from './state';

/** Plots a sprinkler of this level waters (0 = no sprinkler). */
export const sprinklerCoverage = (level: number): number => (level <= 0 ? 0 : (GB.sprinkler[Math.min(level, GB.sprinkler.length) - 1]?.plots ?? 0));
export const isCovered = (g: Pick<GardenState, 'sprinkler'>, index: number): boolean => index < sprinklerCoverage(g.sprinkler);

export interface Expansion {
  plots: number;
  price: number;
  /** World level it needs (1 = none). */
  level: number;
  /** The new zone it opens (0-based), or null while it grows the first zone. */
  zone: number | null;
}

/** The next plot expansion, or null at the top. */
export function nextExpansion(g: Pick<GardenState, 'plots'>): Expansion | null {
  if (g.plots.length >= MAX_PLOTS) return null;
  const step = GB.plotExpansions.find((e) => e.plots > g.plots.length);
  if (!step) return null;
  return { plots: step.plots, price: step.price, level: step.level ?? 1, zone: step.plots > PLOTS_PER_ZONE ? zoneOf(step.plots - 1) : null };
}

/** Zones the player owns at least one plot in (1 or more). */
export const ownedZones = (g: Pick<GardenState, 'plots'>): number => zoneOf(g.plots.length - 1) + 1;

/** The plot indexes of zone `zone` that the player owns. */
export const zonePlots = (g: Pick<GardenState, 'plots'>, zone: number): number[] => {
  const first = zone * PLOTS_PER_ZONE;
  return g.plots.slice(first, first + PLOTS_PER_ZONE).map((_, k) => first + k);
};

/** The next sprinkler level and its price, or null at the top. */
export const nextSprinkler = (
  g: Pick<GardenState, 'sprinkler'>,
): { level: number; plots: number; price: number; materials: Readonly<Record<string, number | undefined>> } | null => {
  const next = GB.sprinkler[g.sprinkler];
  return next ? { level: g.sprinkler + 1, plots: next.plots, price: next.price, materials: next.materials ?? {} } : null;
};

/** A growing plot that the player's hand can water now: not ripe, not under the sprinkler, not wet already. */
export const needsWater = (plot: Pick<GardenState['plots'][number], 'cropId' | 'ripeAt' | 'wetUntil'>, covered: boolean, now: number): boolean =>
  plot.cropId !== null && plot.ripeAt === null && !covered && plot.wetUntil <= now;

export interface PlotView {
  index: number;
  stage: PlotStage;
  cropId: string | null;
  /** 0..1 */
  share: number;
  watered: boolean;
  covered: boolean;
  fertilized: boolean;
  /** What harvesting it gives now (0 while it is not ripe). */
  yield: number;
}

export function plotViews(g: GardenState, now: number): PlotView[] {
  return g.plots.map((plot, index) => {
    const crop = plot.cropId ? CROPS[plot.cropId] : undefined;
    const stage = crop ? plotStage(plot, PLOT_RULES, now) : 'empty';
    const covered = isCovered(g, index);
    return {
      index,
      stage,
      cropId: crop ? plot.cropId : null,
      share: crop ? growthShare(plot, crop, PLOT_RULES) : 0,
      watered: stage === 'growing' && (covered || plot.wetUntil > now),
      covered,
      fertilized: plot.fertilized,
      yield: crop && (stage === 'ripe' || stage === 'wilted') ? harvestYield(plot, crop, PLOT_RULES, now) : 0,
    };
  });
}

/** One workshop as the scene and the HUD show it. */
export interface WorkshopView {
  built: boolean;
  /** A job is running or waiting to be collected. */
  busy: boolean;
  /** Finished batches waiting. */
  ready: number;
}

export interface SceneState {
  plots: PlotView[];
  sprinkler: number;
  mill: WorkshopView;
  composter: WorkshopView;
}

export function workshopView(g: GardenState, building: BuildingId, now: number): WorkshopView {
  const job = g.jobs[building];
  const recipe = job ? RECIPES[job.recipeId] : undefined;
  return { built: g.built[building], busy: job !== null, ready: job && recipe ? batchesReady(job, recipe, now) : 0 };
}

export const sceneState = (g: GardenState, now: number): SceneState => ({
  plots: plotViews(g, now),
  sprinkler: g.sprinkler,
  mill: workshopView(g, 'mill', now),
  composter: workshopView(g, 'composter', now),
});
