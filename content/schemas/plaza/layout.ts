// content/plaza/layout.json — the plaza's scene layout (spec §3.1): the design frame, where the
// character may walk, where they appear, and every placed object. A placement with `portal` is a door to
// an Area (the Area whose manifest has the same `portalInPlaza`). Edited in the admin layout editor.
import { z } from 'zod';
import { color, unit } from '../fields';
import { placementSchema } from '../farm/layout';

export const plazaPlacementSchema = placementSchema
  .omit({ action: true, role: true, badge: true, decor: true, signed: true })
  .extend({
    /** The door to an Area: its manifest `portalInPlaza`. */
    portal: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
    /** The character cannot walk through it (its footprint is the bottom part of the art). */
    solid: z.boolean().optional(),
  });

export const plazaLayoutSchema = z.strictObject({
  designSize: z.strictObject({ width: z.number().int().positive(), height: z.number().int().positive() }),
  /** Where the character may stand (fractions of the design frame). */
  walkArea: z.strictObject({ x: unit, y: unit, width: unit, height: unit }),
  /** Where a new character appears, and where they arrive when no door is involved. */
  spawn: z.strictObject({ x: unit, y: unit }),
  /** Flat colours behind the art (the plaza is painted, no photo backdrop). */
  palette: z.strictObject({ sky: color, grass: color, path: color }),
  /** The part of the frame covered by the plaza floor: an ellipse of the walk area, fractions. */
  floor: z.strictObject({ x: unit, y: unit, width: unit, height: unit }),
  placements: z.array(plazaPlacementSchema),
  /** How close to a door (design px, from the foot of the art) the character gets its key hint. */
  portalReach: z.number().positive(),
});

export type PlazaPlacement = z.infer<typeof plazaPlacementSchema>;
export type PlazaLayout = z.infer<typeof plazaLayoutSchema>;
