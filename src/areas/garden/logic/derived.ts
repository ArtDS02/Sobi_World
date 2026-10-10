// What the Garden's screens and scene read off its state (derived, never stored).
import type { PlotStage } from '../../../systems/plants/plot';
import { growthShare, harvestYield, plotStage } from '../../../systems/plants/plot';
import { CROPS, GB, PLOT_RULES, MAX_PLOTS } from './config/content';
import type { GardenState } from './state';

/** Plots a sprinkler of this level waters (0 = no sprinkler). */
export const sprinklerCoverage = (level: number): number => (level <= 0 ? 0 : (GB.sprinkler[Math.min(level, GB.sprinkler.length) - 1]?.plots ?? 0));
export const isCovered = (g: Pick<GardenState, 'sprinkler'>, index: number): boolean => index < sprinklerCoverage(g.sprinkler);

/** The next plot expansion, or null at the top. */
export const nextExpansion = (g: Pick<GardenState, 'plots'>): { plots: number; price: number } | null =>
  g.plots.length >= MAX_PLOTS ? null : (GB.plotExpansions.find((e) => e.plots > g.plots.length) ?? null);

/** The next sprinkler level and its price, or null at the top. */
export const nextSprinkler = (g: Pick<GardenState, 'sprinkler'>): { level: number; plots: number; price: number } | null => {
  const next = GB.sprinkler[g.sprinkler];
  return next ? { level: g.sprinkler + 1, plots: next.plots, price: next.price } : null;
};

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
