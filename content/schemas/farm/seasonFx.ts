// content/farm/season-fx.json — admin tuning of the seasonal environment FX (DECISIONS MU-2). The
// emitters themselves (art, motion) are presentation code: config/seasonFxTable.ts.
import { z } from 'zod';

export const seasonFxFileSchema = z.strictObject({
  enabled: z.boolean(),
  /** Global density multiplier. */
  density: z.number().min(0),
  /** Per emitter id: on / off, density and spawn-rate multipliers (limits: seasonFxIssues). */
  emitters: z.record(
    z.string(),
    z.strictObject({ enabled: z.boolean(), density: z.number().min(0), spawnRate: z.number().gt(0) }),
  ),
});
