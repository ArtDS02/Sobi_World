// The Cloud's slice of the world save (`areas.sobi_cloud`): its flower plots, the spring and the cauldron only. Coins,
// items and XP are world fields (core/economy, core/inventory, core/progression).
import { z } from 'zod';
import type { Raw } from '../../../core/save/migrate';
import type { ProductionJob } from '../../../core/production/production';
import { SKIN_AUTO_MODES } from '../../../core/plots/skinAuto';
import { emptyPlot, type PlotState } from '../../../systems/plants/plot';
import { CB, MAX_PLOTS, MAX_SPRING_LEVEL, MAX_TIER_LEVEL, PLOTS_PER_TIER } from './config/content';

export const CLOUD_STATE_VERSION = 3;

const time = z.number().finite();

const plotSchema = z.strictObject({
  cropId: z.string().nullable(),
  grown: z.number().finite().min(0),
  wetUntil: time,
  fertilized: z.boolean(),
  ripeAt: time.nullable(),
});

const jobSchema = z.strictObject({
  recipeId: z.string().min(1),
  batches: z.number().int().min(1),
  startedAt: time,
  /** Milliseconds one batch takes, fixed when the job started (GĐ11 technology); absent = the recipe's. */
  durationMs: z.number().finite().positive().optional(),
  collected: z.number().int().min(0),
});

export const cloudStateSchema = z.strictObject({
  version: z.literal(CLOUD_STATE_VERSION),
  /** One entry per plot the player owns, in grid order. */
  plots: z.array(plotSchema).min(1),
  /** The spring of pure water: its level and the moment its stock started to fill (epoch ms). */
  spring: z.strictObject({ level: z.number().int().min(1).max(MAX_SPRING_LEVEL), since: time }),
  /** Whether the cauldron stands, and its running or finished-but-not-collected job. */
  cauldron: z.strictObject({ built: z.boolean(), job: jobSchema.nullable() }),
  /** The crossing lab (decision 035): flowers it has given (their seed is sold from then on) and failed tries per recipe. */
  lab: z.strictObject({ found: z.array(z.string()), misses: z.record(z.string(), z.number().int().min(0)) }).optional(),
  /** Upgrade tier of each cloud tier, in tier order (decision 056); sparse: a tier past the end is tier 1. */
  tierLevels: z.array(z.number().int().min(1).max(MAX_TIER_LEVEL)),
  /** The plot skin each cloud tier wears (decision 056), in tier order; sparse, null or absent = the plain look. */
  tierSkins: z.array(z.string().min(1).nullable()),
  /** Tiers that change their look by themselves (decision 057, B7), in tier order: by time of day or by season; sparse, null or absent = off. `tierSkins` is untouched by it. */
  tierSkinAuto: z.array(z.enum(SKIN_AUTO_MODES).nullable()).optional(),
  /** Time the slice was simulated up to (epoch ms). */
  lastTickedAt: time,
});

export type CloudState = z.infer<typeof cloudStateSchema>;
export type CloudPlot = PlotState;
export type CloudJob = ProductionJob;

export const CLOUD_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {
  // v2 (decision 023): plots stand on tiers of 15. The old last step (15 → 18 plots, 5 000 Sobi Coin) left a tier half open:
  // it is completed for free, as the second tier now costs the same.
  1: (slice) => {
    const plots = Array.isArray(slice.plots) ? slice.plots : [];
    const whole = plots.length > PLOTS_PER_TIER ? Math.min(MAX_PLOTS, Math.ceil(plots.length / PLOTS_PER_TIER) * PLOTS_PER_TIER) : plots.length;
    return { ...slice, version: 2, plots: [...plots, ...Array.from({ length: whole - plots.length }, emptyPlot)] };
  },
  // v3 (decision 056): upgrade tiers and plot skins per cloud tier. Every tier stays at tier 1 with the plain look.
  // Decision 057 (B7) folds `tierSkinAuto` in (v3 is not released): no tier changes its look by itself.
  2: (slice) => ({ ...slice, version: 3, tierLevels: Array.isArray(slice.tierLevels) ? slice.tierLevels : [], tierSkins: Array.isArray(slice.tierSkins) ? slice.tierSkins : [], tierSkinAuto: Array.isArray(slice.tierSkinAuto) ? slice.tierSkinAuto : [] }),
};

export const initialCloud = (now: number): CloudState => ({
  version: CLOUD_STATE_VERSION,
  plots: Array.from({ length: CB.startPlots }, emptyPlot),
  spring: { level: 1, since: now },
  cauldron: { built: false, job: null },
  tierLevels: [],
  tierSkins: [],
  tierSkinAuto: [],
  lastTickedAt: now,
});
