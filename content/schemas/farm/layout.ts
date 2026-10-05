// content/farm/layout.json — the farm's scene layout (DECISIONS R05C-1, AD-1): the design frame, the
// walk area pigs move in, and every placed object (art id from the asset manifest, layer, position,
// what clicking it opens). Written by the admin layout editor; art ids are checked by assets:check.
import { z } from 'zod';
import { DECOR_ID_VALUES } from '../ids.generated';
import { assetId, unit } from '../fields';

/** What clicking a placement opens (farm panels). */
export const FARM_ACTIONS = [
  'shop',
  'inventory',
  'orders',
  'collection',
  'trough',
  'cleanAll',
] as const;
export type FarmAction = (typeof FARM_ACTIONS)[number];

export const placementSchema = z.object({
  id: assetId,
  layer: z.number().int().min(0).max(5),
  x: z.number(),
  y: z.number(),
  originX: unit.optional(),
  originY: unit.optional(),
  role: z.enum(['trough', 'orderBoard']).optional(),
  /** Clicking the placement opens this. */
  action: z.enum(FARM_ACTIONS).optional(),
  /** The art carries its own name sign: no text label is drawn over it (A4). */
  signed: z.boolean().optional(),
  /** On-screen width in design px; the art keeps its aspect ratio (absent: native size). */
  width: z.number().positive().optional(),
  /** Notification badge drawn on the object. */
  badge: z.enum(['orders']).optional(),
  // Layout editor fields (admin dashboard, DECISIONS AD-1).
  /** On-screen height in design px; absent = from width and the art's aspect ratio. */
  height: z.number().positive().optional(),
  /** Degrees, clockwise. */
  rotation: z.number().min(-360).max(360).optional(),
  flipX: z.boolean().optional(),
  /** false = kept in the data but not drawn. */
  visible: z.boolean().optional(),
  /** Editor-only: the placement cannot be dragged in the layout editor. */
  locked: z.boolean().optional(),
  /** Editor-only display name. */
  label: z.string().max(40).optional(),
  /** Shown only while the save owns this decoration (DECISIONS PG-3). */
  decor: z.enum(DECOR_ID_VALUES).optional(),
});

export const layoutFileSchema = z.strictObject({
  designSize: z.strictObject({ width: z.number().int().positive(), height: z.number().int().positive() }),
  walkArea: z.strictObject({ x: unit, y: unit, width: unit, height: unit }),
  pigScaleByY: z.strictObject({ min: z.number().positive(), max: z.number().positive() }),
  placements: z.array(placementSchema),
});

export type Placement = z.infer<typeof placementSchema>;
export type FarmLayout = z.infer<typeof layoutFileSchema>;
