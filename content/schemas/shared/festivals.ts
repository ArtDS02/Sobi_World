// content/shared/festivals.json — the four festivals of the calendar (spec V2 §10, GĐ12): when each one runs, what pays Event
// Tokens during it, and the festival shop. A festival repeats every `cycleDays` days; tokens never expire.
import { z } from 'zod';
import { assetId, int, itemId, nonNeg, posInt, text } from '../fields';
import { FESTIVAL_EVENT_VALUES } from '../vocab';

const areaId = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const festivalSchema = z.strictObject({
  id: z.string().regex(/^fest_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  /** The Area the festival is about (where the player is sent to take part). */
  area: areaId,
  artId: assetId,
  /** The day of the cycle (0-based) the festival starts. */
  startDay: int.min(0),
  /** What pays tokens: every `per` of the event's units pay `tokens`. */
  earn: z.array(z.strictObject({ event: z.enum(FESTIVAL_EVENT_VALUES), per: posInt, tokens: posInt })).min(1),
});

export const festivalShopSchema = z.strictObject({
  id: z.string().regex(/^fs_[a-z0-9_]+$/),
  reward: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('item'), itemId, quantity: posInt }),
    z.strictObject({ kind: z.literal('gems'), amount: posInt }),
  ]),
  cost: posInt,
  /** Sold only during this festival; null = in every festival. */
  festival: z.string().regex(/^fest_[a-z0-9_]+$/).nullable(),
  /** At most this many per run of the festival; absent = no limit. */
  limit: posInt.optional(),
});

export const festivalsFileSchema = z
  .strictObject({
    cycleDays: posInt,
    lengthDays: posInt,
    /** A gift of tokens for each festival day, claimed once a day. */
    dailyGift: nonNeg,
    /** Tokens the play of one day can pay at most (the gift is on top). */
    dailyCap: posInt,
    festivals: z.array(festivalSchema).min(1),
    shop: z.array(festivalShopSchema).min(1),
  })
  .superRefine((f, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = f.festivals.map((x) => x.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) issue(`duplicate festival id ${dup}`);
    if (f.lengthDays > f.cycleDays) issue('lengthDays is longer than the cycle');
    for (const x of f.festivals) if (x.startDay >= f.cycleDays) issue(`${x.id}: startDay is outside the cycle`);
    // Two festivals never run on the same day (the cycle wraps).
    const covers = (x: { startDay: number }, d: number) => (d - x.startDay + f.cycleDays) % f.cycleDays < f.lengthDays;
    for (let d = 0; d < f.cycleDays; d += 1) {
      if (f.festivals.filter((x) => covers(x, d)).length > 1) {
        issue(`festivals overlap on day ${d} of the cycle`);
        break;
      }
    }
    const shopIds = f.shop.map((s) => s.id);
    const dupShop = shopIds.find((id, i) => shopIds.indexOf(id) !== i);
    if (dupShop) issue(`duplicate shop id ${dupShop}`);
    for (const s of f.shop) if (s.festival !== null && !ids.includes(s.festival)) issue(`${s.id}: unknown festival ${s.festival}`);
  });
