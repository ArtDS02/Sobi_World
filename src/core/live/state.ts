// What the living world keeps in the save (v11, GĐ12): the festival's bookkeeping, the visiting merchant's special orders of
// the day, and the Admin's test switches. The weather keeps nothing (a pure function of the day), and Event Tokens live in
// the wallet like every currency.
import { z } from 'zod';
import { boardOrderSchema } from '../goals/state';

const dayNumber = z.number().int();
const count = z.number().int().min(0);

export const liveSchema = z.object({
  festival: z.object({
    /** The last game day the festival gift was claimed. */
    giftDay: dayNumber.nullable(),
    /** The day `earnedToday` counts for. */
    earnDay: dayNumber.nullable(),
    /** Tokens the play of `earnDay` has paid (against the daily cap). */
    earnedToday: count,
    /** Units counted toward the next token, per `<festival>:<event>`. */
    progress: z.record(z.string(), count),
    /** Shop entry -> how many were bought in which run of the festival (a run = one turn of the calendar). */
    bought: z.record(z.string(), z.object({ run: dayNumber, count })),
  }),
  merchant: z.object({
    /** The game day the offers were made for; null = never. */
    day: dayNumber.nullable(),
    /** The merchant was in the plaza that day. */
    present: z.boolean(),
    offers: z.array(boardOrderSchema),
    /** Delivered, in the order of `offers`. */
    done: z.array(z.boolean()),
  }),
  /** Test switches of the Admin (development builds): they are never set in play. */
  dev: z.object({
    /** A weather id that holds on every day, or null = the calendar's. */
    weather: z.string().nullable(),
    /** A festival id that runs every day, `none` = no festival, null = the calendar's. */
    festival: z.string().nullable(),
    /** The merchant is there every day (true) or never (false), null = the calendar's. */
    merchant: z.boolean().nullable(),
  }),
});
export type LiveState = z.infer<typeof liveSchema>;

export const initialLive = (): LiveState => ({
  festival: { giftDay: null, earnDay: null, earnedToday: 0, progress: {}, bought: {} },
  merchant: { day: null, present: false, offers: [], done: [] },
  dev: { weather: null, festival: null, merchant: null },
});
