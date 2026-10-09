// content/shared/time.json — the four periods of the day, the simulation steps and the offline cap
// (GAME_BALANCE §1). Real time only: the game has no clock of its own.
import { z } from 'zod';
import { DAY_PERIOD_VALUES } from '../vocab';
import { posInt } from '../fields';

export const timeFileSchema = z
  .strictObject({
    /** Ascending by start hour; a period lasts until the next one starts (the last wraps past midnight). */
    periods: z
      .array(z.strictObject({ id: z.enum(DAY_PERIOD_VALUES), fromHour: z.number().int().min(0).max(23) }))
      .length(DAY_PERIOD_VALUES.length),
    /** Longest slice one simulation call covers: 1 minute while the game runs, 10 minutes catching up. */
    stepMs: z.strictObject({ online: posInt, offline: posInt }),
    /** The away time that is caught up, at most (GAME_BALANCE §1: 30 days). */
    offlineMaxMs: posInt,
    /** A clock this far behind the last simulated time counts as set back. */
    rewindToleranceMs: posInt,
  })
  .superRefine((f, ctx) => {
    const hours = f.periods.map((p) => p.fromHour);
    if (hours.some((h, i) => i > 0 && h <= hours[i - 1]!)) ctx.addIssue({ code: 'custom', message: 'periods must start at ascending hours' });
    const ids = new Set(f.periods.map((p) => p.id));
    if (ids.size !== DAY_PERIOD_VALUES.length) ctx.addIssue({ code: 'custom', message: 'every period exactly once' });
    if (f.stepMs.offline % f.stepMs.online !== 0) ctx.addIssue({ code: 'custom', message: 'offline step must be a multiple of the online step' });
    if (3_600_000 % f.stepMs.online !== 0) ctx.addIssue({ code: 'custom', message: 'the online step must divide an hour (period starts must fall on a slice edge)' });
  });
