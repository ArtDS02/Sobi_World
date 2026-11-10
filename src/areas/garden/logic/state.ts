// The Garden's slice of the world save (`areas.sobi_garden`): its plots, buildings and jobs only. Coins,
// items and XP are world fields (core/economy, core/inventory, core/progression).
import { z } from 'zod';
import type { Raw } from '../../../core/save/migrate';
import type { PlotState } from '../../../systems/plants/plot';
import type { ProductionJob } from '../../../core/production/production';
import { SKIN_AUTO_MODES } from '../../../core/plots/skinAuto';
import { emptyPlot } from '../../../systems/plants/plot';
import { GB, MAX_TIER_LEVEL } from './config/content';

export const GARDEN_STATE_VERSION = 2;

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

const labSchema = z.strictObject({ found: z.array(z.string()), misses: z.record(z.string(), z.number().int().min(0)) });

export const gardenStateSchema = z.strictObject({
  version: z.literal(GARDEN_STATE_VERSION),
  /** One entry per plot the player owns, in grid order. */
  plots: z.array(plotSchema).min(1),
  /** Sprinkler level: 0 = none, n = `GB.sprinkler[n - 1]`. */
  sprinkler: z.number().int().min(0),
  /** The workshops the player has built. */
  built: z.strictObject({ mill: z.boolean(), composter: z.boolean() }),
  /** A running or finished-but-not-collected job per workshop. */
  jobs: z.strictObject({ mill: jobSchema.nullable(), composter: jobSchema.nullable() }),
  /** The crossing lab (decision 035): crops it has given (their seed is sold from then on) and failed tries per recipe. */
  lab: labSchema.optional(),
  /** Upgrade tier of each garden zone, in zone order (decision 056); sparse: a zone past the end is tier 1. */
  zoneLevels: z.array(z.number().int().min(1).max(MAX_TIER_LEVEL)),
  /** The plot skin each garden zone wears (decision 056), in zone order; sparse, null or absent = the plain look. */
  zoneSkins: z.array(z.string().min(1).nullable()),
  /** Zones that change their look by themselves (decision 057, B7), in zone order: by time of day or by season; sparse, null or absent = off. `zoneSkins` is untouched by it. */
  zoneSkinAuto: z.array(z.enum(SKIN_AUTO_MODES).nullable()).optional(),
  /** Time the slice was simulated up to (epoch ms). */
  lastTickedAt: time,
});

export type GardenState = z.infer<typeof gardenStateSchema>;
export type GardenPlot = PlotState;
export type GardenJob = ProductionJob;

export const GARDEN_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {
  // v2 (decision 056): upgrade tiers and plot skins per garden zone. Every zone stays at tier 1 with the plain look.
  // Decision 057 (B7) folds `zoneSkinAuto` in (v2 is not released): no zone changes its look by itself.
  1: (slice) => ({ ...slice, version: 2, zoneLevels: Array.isArray(slice.zoneLevels) ? slice.zoneLevels : [], zoneSkins: Array.isArray(slice.zoneSkins) ? slice.zoneSkins : [], zoneSkinAuto: Array.isArray(slice.zoneSkinAuto) ? slice.zoneSkinAuto : [] }),
};

export const initialGarden = (now: number): GardenState => ({
  version: GARDEN_STATE_VERSION,
  plots: Array.from({ length: GB.startPlots }, emptyPlot),
  sprinkler: 0,
  built: { mill: false, composter: false },
  jobs: { mill: null, composter: null },
  zoneLevels: [],
  zoneSkins: [],
  zoneSkinAuto: [],
  lastTickedAt: now,
});
