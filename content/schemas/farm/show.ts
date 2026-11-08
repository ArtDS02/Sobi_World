// content/farm/show.json — the seasonal pig show (D3): how a pig is judged and what the places pay. Each pig may enter once
// per season; a season is `seasonDays` days of the game's calendar.
import { z } from 'zod';
import { nonNeg, posInt } from '../fields';

const pay = { coins: nonNeg, tokens: nonNeg };

export const showFileSchema = z
  .strictObject({
    seasonDays: posInt,
    /** Score = quality + rarity + traits + bond hearts + generation + family tree + care, plus a seeded jitter of up to `jitter`. */
    judges: z.strictObject({
      jitter: nonNeg,
      bondPerHeart: nonNeg,
      traitPoints: nonNeg,
      traitCap: nonNeg,
      rarityPoints: nonNeg,
      qualityPoints: nonNeg,
      generationPoints: nonNeg,
      generationCap: nonNeg,
      lineagePoints: nonNeg,
      lineageCap: nonNeg,
      carePoints: nonNeg,
      sickPenalty: nonNeg,
    }),
    /** Best place first: a score at or over `minScore` takes the first place it qualifies for. */
    places: z.array(z.strictObject({ place: posInt, minScore: nonNeg, ...pay })).min(1),
    /** What an entry that places nowhere still gets. */
    participation: z.strictObject(pay),
  })
  .superRefine((f, ctx) => {
    f.places.forEach((p, i) => {
      if (i > 0 && p.minScore >= f.places[i - 1]!.minScore) ctx.addIssue({ code: 'custom', message: 'places must go from the highest minScore to the lowest' });
      if (i > 0 && p.place <= f.places[i - 1]!.place) ctx.addIssue({ code: 'custom', message: 'place numbers must increase' });
    });
  });
