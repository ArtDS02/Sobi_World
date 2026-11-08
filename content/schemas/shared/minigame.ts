// content/shared/minigame.json — the small timing mini-games of the Garden and the Cloud (D8). They are optional: the plain
// action ("làm nhanh") does the same job with no tip. Numbers only; the maths is src/systems/minigame/rhythm.ts.
import { z } from 'zod';
import { nonNeg, posInt, unit } from '../fields';

export const minigameFileSchema = z.strictObject({
  rhythm: z.strictObject({
    /** One sweep of the marker from one end of the bar to the other and back. */
    periodMs: z.number().positive(),
    /** Half the width of the good zone around the middle of the bar (0–0.5). */
    zoneHalf: z.number().positive().max(0.5),
    rounds: posInt,
    /** Coins of tip per unit worked (plot watered) at a perfect score: scales linearly with the score. */
    tipPerUnit: nonNeg,
    /** A score at or over this is called perfect on the screen. */
    perfectAt: unit,
  }),
});
