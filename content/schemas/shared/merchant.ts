// content/shared/merchant.json — the travelling merchant (spec V2 §9, GĐ12): which days he is in the plaza, what he pays for
// special orders and which group of goods he pays extra for in the market that day.
import { z } from 'zod';
import { assetId, nonNeg, posInt, text, unit } from '../fields';

export const merchantFileSchema = z.strictObject({
  nameVi: text,
  artId: assetId,
  greetingVi: text,
  /** Lines he says (one a day, by the day's seed). */
  linesVi: z.array(text).min(1),
  /** Chance that a game day is a visiting day. */
  visitChance: unit,
  /** On a visiting day the group he wants has this added to its market factor. */
  demandBonus: z.number().finite().min(0).max(1),
  offers: z.strictObject({
    /** Special orders of a visiting day. */
    count: posInt,
    /** Reward = this × the market value of the items asked (the board pays less). */
    rewardMultiplier: z.number().finite().min(1),
    /** Event Tokens on top of each delivered order. */
    tokens: nonNeg,
  }),
});
