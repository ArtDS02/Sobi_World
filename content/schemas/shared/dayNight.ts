// content/shared/daynight.json — when each day phase starts on the player's clock (DN task). Visual
// only. Cross-field rules (increasing times, blend limits) are engine/dayNight.ts dayNightIssues.
import { z } from 'zod';
import { DAY_PHASES } from '../vocab';
import { int } from '../fields';

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, 'time "HH:MM"');

export const dayNightFileSchema = z.strictObject({
  enabled: z.boolean(),
  phases: z.strictObject(Object.fromEntries(DAY_PHASES.map((p) => [p, hhmm])) as Record<(typeof DAY_PHASES)[number], typeof hhmm>),
  blendMinutes: int.min(0),
  transitionMs: int.min(0),
});
