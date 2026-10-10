// content/shared/orders.json — the Order Board in the plaza (spec V2 §9, GAME_BALANCE §8): slots, how often an
// order appears, what it asks for and what it pays. An order asks for items of the Areas the player has opened.
import { z } from 'zod';
import { int, itemId, nonNeg, posInt, unit } from '../fields';

const areaId = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const ordersFileSchema = z
  .strictObject({
    /** Slots of the board by World Development (the last row reached counts). */
    slots: z.array(z.strictObject({ fromWorldDevelopment: int.min(0), count: posInt })).min(1),
    /** One new order per this long, for an empty slot. */
    spawnEveryMs: posInt,
    /** Reward = this × the market value of the items asked (better than selling them one by one). */
    rewardMultiplier: z.number().finite().min(1),
    /** XP of an order: reward / coinsPerXp, kept within min..max. */
    xp: z.strictObject({ min: nonNeg, max: nonNeg, coinsPerXp: posInt }),
    /** A chance of a bonus item on top of the reward (rare seeds once they exist). */
    bonus: z.strictObject({ chance: unit, itemId, quantity: posInt }),
    /** Swapping an order for another costs this many Gems. */
    rerollGems: posInt,
    /** How many different items one order may ask for, by world level. */
    lines: z.array(z.strictObject({ fromWorldLevel: posInt, max: posInt })).min(1),
    requests: z
      .array(
        z.strictObject({
          itemId,
          /** The Area that makes it: asked only once that Area is open. */
          area: areaId,
          fromWorldLevel: posInt,
          min: posInt,
          max: posInt,
          weight: z.number().finite().positive(),
        }),
      )
      .min(1),
  })
  .superRefine((f, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (f.slots.some((s, i) => i > 0 && s.fromWorldDevelopment <= f.slots[i - 1]!.fromWorldDevelopment)) issue('slots must rise with World Development');
    if (f.slots[0]!.fromWorldDevelopment !== 0) issue('the first slots row must start at World Development 0');
    if (f.lines[0]!.fromWorldLevel !== 1) issue('lines must start at world level 1');
    if (f.xp.min > f.xp.max) issue('xp.min > xp.max');
    for (const r of f.requests) if (r.min > r.max) issue(`request ${r.itemId}: min > max`);
  });
