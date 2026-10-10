// Plants (spec §8.2, GAME_BALANCE §5): one plot's crop over real time. Closed form per interval, so a
// minute-by-minute run, a ten-minute catch-up and one long jump give the same plot (ARCHITECTURE §6).
// Pure: time comes in as arguments; the crop table and the rules come from the Area's content.

/** What a plot holds. A plot has no state of its own before something is sown. */
export interface PlotState {
  cropId: string | null;
  /** Growth done, in watered milliseconds (a dry millisecond counts `dryRate` of one). */
  grown: number;
  /** Watered by hand until this time (epoch ms); 0 = not watered. */
  wetUntil: number;
  fertilized: boolean;
  /** When the crop became ripe (epoch ms); null while it is still growing or the plot is empty. */
  ripeAt: number | null;
}

export interface PlotRules {
  /** Growth speed of a dry plot as a share of a watered one. */
  dryRate: number;
  /** Growth time multiplier of a fertilised crop. */
  fertilizerFactor: number;
  fertilizerBonusYield: number;
  /** A crop ripe for longer than this is wilted. */
  witherAfterMs: number;
  witherYieldFactor: number;
}

/** What the plot needs to know of its crop. */
export interface CropRule {
  growMs: number;
  yield: number;
}

export type PlotStage = 'empty' | 'growing' | 'ripe' | 'wilted';

export const emptyPlot = (): PlotState => ({ cropId: null, grown: 0, wetUntil: 0, fertilized: false, ripeAt: null });

export const sow = (cropId: string): PlotState => ({ ...emptyPlot(), cropId });

/** Growth the crop needs in watered milliseconds. */
export const requiredMs = (plot: PlotState, crop: CropRule, rules: PlotRules): number =>
  crop.growMs * (plot.fertilized ? rules.fertilizerFactor : 1);

/**
 * The plot after the time from `from` to `to`. `covered`: a sprinkler keeps it watered the whole time.
 * Ripeness is stamped at the moment it happened, not at `to`.
 */
export function advancePlot(plot: PlotState, crop: CropRule | undefined, rules: PlotRules, covered: boolean, from: number, to: number): PlotState {
  if (!plot.cropId || !crop || plot.ripeAt !== null || to < from) return plot;
  const need = requiredMs(plot, crop, rules);
  const dt = to - from;
  const wet = covered ? dt : Math.min(dt, Math.max(0, plot.wetUntil - from));
  const rate = rules.dryRate;
  const done = plot.grown + wet + rate * (dt - wet);
  if (done < need) return { ...plot, grown: done };
  // Ripe inside this interval: when? Watered time first (rate 1), then dry time at `rate`.
  const left = need - plot.grown;
  const t = left <= wet ? left : wet + (rate > 0 ? (left - wet) / rate : Infinity);
  return { ...plot, grown: need, ripeAt: from + Math.max(0, Math.min(t, dt)) };
}

/** A fertiliser or a shorter requirement can finish a crop on the spot: stamps `ripeAt` = `now` if so. */
export function settlePlot(plot: PlotState, crop: CropRule | undefined, rules: PlotRules, now: number): PlotState {
  if (!plot.cropId || !crop || plot.ripeAt !== null) return plot;
  return plot.grown >= requiredMs(plot, crop, rules) ? { ...plot, ripeAt: now } : plot;
}

export function plotStage(plot: PlotState, rules: PlotRules, now: number): PlotStage {
  if (!plot.cropId) return 'empty';
  if (plot.ripeAt === null) return 'growing';
  return now - plot.ripeAt > rules.witherAfterMs ? 'wilted' : 'ripe';
}

/** 0..1 of the way to ripe. */
export const growthShare = (plot: PlotState, crop: CropRule, rules: PlotRules): number =>
  plot.ripeAt !== null ? 1 : Math.min(1, plot.grown / requiredMs(plot, crop, rules));

/** Items one harvest gives now: fertiliser adds, wilting halves (never below 1). */
export function harvestYield(plot: PlotState, crop: CropRule, rules: PlotRules, now: number): number {
  const base = crop.yield + (plot.fertilized ? rules.fertilizerBonusYield : 0);
  return plotStage(plot, rules, now) === 'wilted' ? Math.max(1, Math.floor(base * rules.witherYieldFactor)) : base;
}

/** True when the crop will not be watered for the whole of the next stretch (the plot is dry now). */
export const isDry = (plot: PlotState, covered: boolean, now: number): boolean => !!plot.cropId && plot.ripeAt === null && !covered && plot.wetUntil <= now;

/** Time the crop wilts, or null (not ripe yet / empty). */
export const witherAt = (plot: PlotState, rules: PlotRules): number | null => (plot.ripeAt === null ? null : plot.ripeAt + rules.witherAfterMs);

/**
 * Milliseconds until the crop is ripe if nothing changes (watered until `wetUntil`, then dry; a covered plot always
 * watered); 0 when ripe, Infinity for an empty plot or a crop that cannot grow dry.
 */
export function msToRipe(plot: PlotState, crop: CropRule | undefined, rules: PlotRules, covered: boolean, now: number): number {
  if (!plot.cropId || !crop) return Infinity;
  if (plot.ripeAt !== null) return 0;
  const left = Math.max(0, requiredMs(plot, crop, rules) - plot.grown);
  const wet = covered ? Infinity : Math.max(0, plot.wetUntil - now);
  if (left <= wet) return left;
  return rules.dryRate > 0 ? wet + (left - wet) / rules.dryRate : Infinity;
}
