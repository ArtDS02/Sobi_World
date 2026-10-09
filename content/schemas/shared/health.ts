// content/shared/health.json — illness, critical state and death (GAME_BALANCE §2.4, decisions 002/004).
// Shared by every Area with living creatures; an Area adds its own treatment rules in its balance.
import { z } from 'zod';
import { posInt, unit } from '../fields';

export const healthFileSchema = z
  .strictObject({
    risk: z.strictObject({
      /** Chance of falling ill within one hour of exposure; the active conditions add up. */
      perHour: z.strictObject({ starving: unit, dirty: unit, lowMood: unit }),
      /** Cleanliness / mood below these values count as exposure. */
      dirtyBelow: z.number().min(0).max(100),
      lowMoodBelow: z.number().min(0).max(100),
    }),
    /** An illness untreated for this long turns critical … */
    criticalAfterMs: posInt,
    /** … and for this long, fatal (never while the game was closed, see deathGraceMs). */
    deathAfterMs: posInt,
    /** After a catch-up that skipped a death, nothing dies for this long once the game is open (decision 004). */
    deathGraceMs: posInt,
    /** A new world cannot fall ill during its first hours. */
    newPlayerProtectionMs: posInt,
  })
  .superRefine((f, ctx) => {
    if (f.criticalAfterMs >= f.deathAfterMs) ctx.addIssue({ code: 'custom', message: 'criticalAfterMs must be before deathAfterMs' });
    const p = f.risk.perHour;
    if (p.starving + p.dirty + p.lowMood >= 1) ctx.addIssue({ code: 'custom', message: 'the hourly risks must add up to less than 1' });
  });
