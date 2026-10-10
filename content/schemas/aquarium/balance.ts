// content/aquarium/balance.json — the Aquarium's numbers (GAME_BALANCE §9): the tank and its upgrades, how fish live,
// the fishing rod, eggs and what each action earns.
import { z } from 'zod';
import { itemId, nonNeg, percent, posInt, unit } from '../fields';

const materials = z.partialRecord(itemId, posInt);

export const aquariumBalanceFileSchema = z
  .strictObject({
    start: z.strictObject({
      /** The fish a new tank begins with (an id of fish.json) and the feed in the bag. */
      fish: z.string().regex(/^fish_[a-z0-9_]+$/),
      feed: z.number().int().min(0),
    }),
    tank: z.strictObject({
      /** Level n is `levels[n - 1]`: fish it holds, the price to reach it (coins + materials), and the share of the
       * water decay it keeps (a better filter = slower decay). */
      levels: z
        .array(z.strictObject({ capacity: posInt, price: nonNeg, materials, waterFactor: z.number().finite().positive().max(1) }))
        .min(1),
      /** Water clarity (0-100) lost per hour: a base, and more per fish in the tank. */
      waterPerHour: nonNeg,
      waterPerFishPerHour: nonNeg,
      /** Scales that wait in the tank before the player collects them: this many per fish of capacity. */
      scalesPerSlot: posInt,
    }),
    life: z.strictObject({
      /** Hunger points lost per hour (spec: 5). */
      hungerPerHour: nonNeg,
      growthMinHunger: percent,
      stageYoungAt: percent,
      stageAdultAt: percent,
      /** Growth progress (%) of a freshly caught fish when it is put in the tank (the rest it grows itself). */
      caughtProgress: percent,
      /** Hours after medicine in which a fish does not fall ill again. */
      recoverHours: z.number().finite().min(0),
      /** Illness episodes a fish can start per game day. */
      sickMaxPerDay: posInt,
      nameMax: posInt,
    }),
    fishing: z.strictObject({
      /** Seconds between two casts (spec: 1 per 2 minutes). */
      cooldownSec: posInt,
      /** The mini-game's score (0..1) under which the fish gets away. */
      missBelow: unit,
      /** Rarer fish become likelier with a better score: weight × (1 + luck × score × rarity step). */
      scoreLuck: nonNeg,
      /** A cast that missed only costs this share of the cooldown. */
      missCooldownShare: unit,
      /** A pearl oyster is on the line sometimes (item and relative weight, like a fish). */
      oyster: z.strictObject({ item: itemId, weight: nonNeg }),
    }),
    breeding: z.strictObject({
      /** Hours before a pair can have eggs again. */
      cooldownHours: z.number().finite().positive(),
      eggHours: z.number().finite().positive(),
      /** Eggs in the tank at once. */
      maxEggs: posInt,
      minHunger: percent,
      /** Feed the pair eats from the bag for the eggs. */
      feed: posInt,
    }),
    /** What a fish sold out of the tank is worth: its tank price × growth share × quality × health × traits. */
    sell: z.strictObject({
      /** Share of the price a half-grown fish fetches (linear up to full size). */
      minShare: unit,
    }),
    xp: z.strictObject({
      feed: nonNeg, clean: nonNeg, catch: nonNeg, release: nonNeg, pet: nonNeg, sell: nonNeg, breed: nonNeg, treat: nonNeg, collect: nonNeg, upgrade: nonNeg,
    }),
  })
  .superRefine((b, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (b.tank.levels.some((l, i) => i > 0 && l.capacity <= b.tank.levels[i - 1]!.capacity)) issue('tank levels must hold more fish each');
    if (b.life.stageYoungAt >= b.life.stageAdultAt) issue('stageYoungAt must be below stageAdultAt');
    if (b.tank.levels[0]!.price !== 0) issue('the first tank level is free');
  });
