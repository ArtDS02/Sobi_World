// content/adventure/scenery.json — the shared library of decoration assets the Map Builder places freely on areas (decision 047,
// GĐ6b): a tree, a rock, a ruin, a roof… Each says once what its picture is, how wide it is drawn, which tiles under its foot block the
// way and how it stands among the walkers; an area only says where one stands and what it changes (maps.json `scenery`).
import { z } from 'zod';
import { assetId, text } from '../fields';

/**
 * How a decoration stands: `normal` lies flat on the ground under everything; `occluder` is sorted with the walkers by its foot (the
 * party passes behind its top); `foreground` always stands over the party; `cover` stands over the party and fades away while the
 * party is near or inside it (a canopy over a hidden way).
 */
export const SCENERY_MODES = ['normal', 'occluder', 'foreground', 'cover'] as const;
export const SCENERY_CATEGORIES = ['tree', 'bush', 'rock', 'building', 'ruin', 'water', 'flower', 'light', 'cover', 'other'] as const;

/** A rectangle of tiles relative to the decoration's foot tile (`x` / `y` may be negative). */
export const footRect = z.strictObject({ x: z.number().int(), y: z.number().int(), w: z.number().int().min(1), h: z.number().int().min(1) });

export const sceneryAssetSchema = z.strictObject({
  id: z.string().regex(/^decor_[a-z0-9_]+$/),
  nameVi: text,
  /** Its picture (manifest id). */
  art: assetId,
  category: z.enum(SCENERY_CATEGORIES),
  /** Drawn width in tiles; the height follows the picture. */
  w: z.number().finite().min(0.25).max(40),
  /** Share of the picture's height below its foot (0 = the foot is the bottom edge; a tree's shadow may hang lower). */
  anchorY: z.number().finite().min(0).max(0.9).optional(),
  /** Tiles that block the way, around the foot tile (none: the party walks through, under its top). */
  foot: z.array(footRect),
  mode: z.enum(SCENERY_MODES),
});

export const sceneryFileSchema = z.strictObject({ assets: z.array(sceneryAssetSchema) }).superRefine((f, ctx) => {
  const ids = new Set<string>();
  for (const a of f.assets) {
    if (ids.has(a.id)) ctx.addIssue({ code: 'custom', message: `duplicate decoration ${a.id}` });
    ids.add(a.id);
  }
});

/**
 * A decoration placed on an area: which library asset, where its foot stands (tiles, fractions allowed: the middle of its base), and
 * what this one changes — size, turn, mirror, how it stands, which tiles it blocks, how it fades.
 */
export const sceneryPlacementSchema = z.strictObject({
  id: z.string().regex(/^scn_[a-z0-9_]+$/),
  asset: z.string().regex(/^decor_[a-z0-9_]+$/),
  x: z.number().finite(),
  y: z.number().finite(),
  /** Drawn width in tiles (absent = the asset's); `h` = drawn height (absent = the picture's own shape). */
  w: z.number().finite().min(0.25).max(80).optional(),
  h: z.number().finite().min(0.25).max(80).optional(),
  /** Degrees, around its foot. */
  rotate: z.number().finite().min(-180).max(180).optional(),
  flip: z.literal(true).optional(),
  mode: z.enum(SCENERY_MODES).optional(),
  foot: z.array(footRect).optional(),
  /**
   * How a cover (or a foreground piece) fades: to `alpha` (0 = gone) while the party is inside `area` (tiles), else within `radius`
   * tiles of its middle; absent = gone while the party is within its own half width.
   */
  fade: z.strictObject({ alpha: z.number().finite().min(0).max(1), radius: z.number().finite().min(0.5).max(40).optional(), area: footRect.optional() }).optional(),
});
