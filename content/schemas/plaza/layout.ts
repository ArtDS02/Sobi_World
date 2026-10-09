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
    /** The blocking part of a solid object: share of its height from the bottom, share of its width from the middle. */
    footprint: z.strictObject({ depth: unit.min(0.02), width: unit.min(0.05) }).optional(),
  });

/** Ground painted under everything, back to front: sand, sea, paths, the cobbled square. */
export const groundShapeSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('ellipse'),
    color,
    /** Centre and size, fractions of the design frame. */
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    stroke: color.optional(),
    /** The character cannot walk on it (water). */
    blocks: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('path'),
    color,
    /** Line width in design px; points are fractions of the frame, joined in order. */
    width: z.number().positive(),
    points: z.array(z.tuple([z.number(), z.number()])).min(2),
  }),
]);

export const plazaLayoutSchema = z.strictObject({
  designSize: z.strictObject({ width: z.number().int().positive(), height: z.number().int().positive() }),
  /** Where the character may stand (fractions of the design frame). */
  walkArea: z.strictObject({ x: unit, y: unit, width: unit, height: unit }),
  /** Where a new character appears, and where they arrive when no door is involved. */
  spawn: z.strictObject({ x: unit, y: unit }),
  /** Flat colours behind the art (the plaza is painted, no photo backdrop). */
  palette: z.strictObject({ sky: color, grass: color }),
  ground: z.array(groundShapeSchema),
  placements: z.array(plazaPlacementSchema),
  /** How close to a door (design px, from the foot of the art) the character gets its key hint. */
  portalReach: z.number().positive(),
});

export type PlazaPlacement = z.infer<typeof plazaPlacementSchema>;
export type GroundShape = z.infer<typeof groundShapeSchema>;
export type PlazaLayout = z.infer<typeof plazaLayoutSchema>;
