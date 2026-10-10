// The Cloud's slice of the world save (`areas.sobi_cloud`): its flower plots, the spring and the cauldron only. Coins,
// items and XP are world fields (core/economy, core/inventory, core/progression).
import { z } from 'zod';
import type { Raw } from '../../../core/save/migrate';
import type { ProductionJob } from '../../../core/production/production';
import { emptyPlot, type PlotState } from '../../../systems/plants/plot';
import { CB, MAX_SPRING_LEVEL } from './config/content';

export const CLOUD_STATE_VERSION = 1;

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

export const cloudStateSchema = z.strictObject({
  version: z.literal(CLOUD_STATE_VERSION),
  /** One entry per plot the player owns, in grid order. */
  plots: z.array(plotSchema).min(1),
  /** The spring of pure water: its level and the moment its stock started to fill (epoch ms). */
  spring: z.strictObject({ level: z.number().int().min(1).max(MAX_SPRING_LEVEL), since: time }),
  /** Whether the cauldron stands, and its running or finished-but-not-collected job. */
  cauldron: z.strictObject({ built: z.boolean(), job: jobSchema.nullable() }),
  /** Time the slice was simulated up to (epoch ms). */
  lastTickedAt: time,
});

export type CloudState = z.infer<typeof cloudStateSchema>;
export type CloudPlot = PlotState;
export type CloudJob = ProductionJob;

export const CLOUD_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {};

export const initialCloud = (now: number): CloudState => ({
  version: CLOUD_STATE_VERSION,
  plots: Array.from({ length: CB.startPlots }, emptyPlot),
  spring: { level: 1, since: now },
  cauldron: { built: false, job: null },
  lastTickedAt: now,
});
