// content/shared/plotSkins.json — the plot skins (decision 056): permanent, cosmetic-only looks for a cloud tier / garden zone,
// forged once for materials plus Sobi Coin OR Gems (the player chooses). Nothing here changes yield, speed or Codex.
import { z } from 'zod';
import { itemId, nonNeg, posInt } from '../fields';

/** What opens a skin's blueprint, read from the world save without knowing the Areas (the path is read as plain data). */
const unlockSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('worldLevel'), level: posInt }),
  /** At least `count` entries of a Codex kind (`fish`, `crop`, `flower`, `breed`, `item`). */
  z.strictObject({ kind: z.literal('codex'), codexKind: z.string().min(1), count: posInt }),
  /** `areas[area]` at `path` is a list that has `has` (e.g. the Cloud's crossing lab gave a flower). */
  z.strictObject({ kind: z.literal('areaList'), area: z.string().min(1), path: z.array(z.string().min(1)).min(1), has: z.string().min(1) }),
  /** `areas[area]` at `path` is a record with a positive count at `key` (e.g. a zone boss beaten). */
  z.strictObject({ kind: z.literal('areaRecord'), area: z.string().min(1), path: z.array(z.string().min(1)).min(1), key: z.string().min(1) }),
]);

export type SkinUnlock = z.infer<typeof unlockSchema>;

export const plotSkinsFileSchema = z
  .strictObject({
    /** Coins one Gem is worth when paying a skin; the file's `coins` and `gems` must agree with it. */
    gemRate: posInt,
    /** One-off XP of forging a skin (world XP). */
    xp: nonNeg,
    skins: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z][a-z0-9_]*$/),
          materials: z.partialRecord(itemId, posInt),
          coins: posInt,
          gems: posInt,
          unlock: unlockSchema,
        }),
      )
      .min(1),
  })
  .superRefine((f, ctx) => {
    const seen = new Set<string>();
    f.skins.forEach((s, i) => {
      if (seen.has(s.id)) ctx.addIssue({ code: 'custom', message: `skins[${i}]: duplicate id ${s.id}` });
      seen.add(s.id);
      if (s.coins !== s.gems * f.gemRate) ctx.addIssue({ code: 'custom', message: `skins[${i}] (${s.id}): coins must be gems x gemRate so the two prices are worth the same` });
    });
  });
