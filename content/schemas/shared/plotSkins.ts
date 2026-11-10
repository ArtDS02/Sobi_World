// content/shared/plotSkins.json — the plot skins (decision 056): permanent, cosmetic-only looks for a cloud tier / garden zone,
// forged once for materials plus Sobi Coin OR Gems (the player chooses). Nothing here changes yield, speed or Codex.
import { z } from 'zod';
import { color, itemId, nonNeg, posInt } from '../fields';
import { DAY_PHASES } from '../vocab';

const skinId = z.string().regex(/^[a-z][a-z0-9_]*$/);
/** Skins wished for at one moment, best first: the first one the player owns is shown. */
const wishes = z.array(skinId);

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
    /**
     * Automatic skin (decision 057, B7): a cloud tier / garden zone set to "by time of day" or "by season" shows the first skin of
     * the moment's list that the player owns; an empty list, or none owned, keeps the skin the player chose. Presentation only.
     */
    auto: z.strictObject({
      time: z.record(z.enum(DAY_PHASES), wishes),
      season: z.record(z.enum(['spring', 'summer', 'autumn', 'winter']), wishes),
    }),
    skins: z
      .array(
        z.strictObject({
          id: skinId,
          materials: z.partialRecord(itemId, posInt),
          coins: posInt,
          gems: posInt,
          unlock: unlockSchema,
          /** The mood the skin gives the WHOLE cloud tier / garden zone it dresses, so plots, backdrop, frame and scenery agree (decision 056). */
          theme: z.strictObject({
            /** Tint over the backdrop of the tier / zone. */
            backdrop: color,
            /** Tint over every scenery layer (border, path, landmarks, lanterns, critter, accents, particles). */
            scenery: color,
            /** Colour of the rank frame around the plots. */
            frame: color,
            /** Which drifting particles show at rank 5: falling petals / leaves, wandering fireflies, both, or none. */
            particles: z.enum(['petal', 'firefly', 'both', 'none']),
          }),
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
    for (const [mode, table] of Object.entries(f.auto)) {
      for (const [moment, list] of Object.entries(table)) {
        for (const id of list) if (!seen.has(id)) ctx.addIssue({ code: 'custom', message: `auto.${mode}.${moment}: unknown skin ${id}` });
      }
    }
  });
