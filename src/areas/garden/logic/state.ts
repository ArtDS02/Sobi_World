// The Garden's slice of the world save (`areas.sobi_garden`): its plots, buildings and jobs only. Coins,
// items and XP are world fields (core/economy, core/inventory, core/progression).
import { z } from 'zod';
import type { Raw } from '../../../core/save/migrate';
import type { PlotState } from '../../../systems/plants/plot';
import type { ProductionJob } from '../../../core/production/production';
import { emptyPlot } from '../../../systems/plants/plot';
import { GB } from './config/content';

export const GARDEN_STATE_VERSION = 1;

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
  collected: z.number().int().min(0),
});

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
  /** Time the slice was simulated up to (epoch ms). */
  lastTickedAt: time,
});

export type GardenState = z.infer<typeof gardenStateSchema>;
export type GardenPlot = PlotState;
export type GardenJob = ProductionJob;

export const GARDEN_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {};

export const initialGarden = (now: number): GardenState => ({
  version: GARDEN_STATE_VERSION,
  plots: Array.from({ length: GB.startPlots }, emptyPlot),
  sprinkler: 0,
  built: { mill: false, composter: false },
  jobs: { mill: null, composter: null },
  lastTickedAt: now,
});
