// content/shared/codex.json — the Codex (spec V2 §6): what a first discovery pays (breeds pay through the
// Farm's own balance) and the milestones of total entries, claimed in the Codex screen.
import { z } from 'zod';
import { nonNeg, posInt } from '../fields';

const reward = z.strictObject({ coins: nonNeg, xp: nonNeg });

export const codexFileSchema = z
  .strictObject({
    discovery: z.strictObject({ crop: reward, item: reward, fish: reward }),
    milestones: z.array(
      z.strictObject({
        id: z.string().regex(/^CODEX_[0-9A-Z_]+$/),
        /** Total entries discovered, of every kind. */
        entries: posInt,
        coins: nonNeg,
        gems: nonNeg,
        xp: nonNeg,
      }),
    ),
  })
  .superRefine((f, ctx) => {
    if (f.milestones.some((m, i) => i > 0 && m.entries <= f.milestones[i - 1]!.entries)) {
      ctx.addIssue({ code: 'custom', message: 'milestones must ask for more entries each' });
    }
  });
