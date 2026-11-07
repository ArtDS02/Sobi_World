// Schemas for Sobi Studio inputs (decision 051, plan §12.3). One source: these zod schemas.
// `npm run studio -- schema` writes the JSON Schema copies in studio/Recipes/schema/ for editors.
import { z } from 'zod';

const num = z.number().finite();
export const Vec3 = z.tuple([num, num, num]);
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');
const Rgb = z.tuple([num, num, num]);

export const KindSchema = z
  .object({
    canvas: z.tuple([z.number().int().positive(), z.number().int().positive()]),
    /** world units -> pixels */
    ppu: num.positive(),
    /** pixel where the world origin lands (x from left, y from top) */
    origin: z.tuple([num, num]),
    camera: z.object({ yaw: num, pitch: num }).strict(),
    mode: z.enum(['sdf', 'flat']),
    /** multiplies style.outline.px for this kind (small sprites need thinner lines) */
    lineScale: num.positive().default(1),
  })
  .strict();

export const StyleSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.number().int(),
    palette: z.record(z.string().regex(/^[a-z][a-z0-9_]*$/), Hex),
    light: z
      .object({
        /** view space: x right, y up, z towards the viewer */
        dir: Vec3,
        color: Hex,
        shadowTint: Rgb,
        aoTint: Rgb,
        bands: z.object({ shadow: num, soft: num, highlight: num, highlightAmount: num }).strict(),
        rim: z.object({ strength: num, power: num }).strict(),
        specular: z.object({ strength: num, power: num }).strict(),
        ao: z.object({ strength: num, step: num, falloff: num }).strict(),
      })
      .strict(),
    outline: z
      .object({
        /** outer line width in final pixels */
        px: num.positive(),
        innerPx: num.positive(),
        /** depth gap (world units) that draws an inner line */
        depthJump: num.positive(),
        /** smaller depth gap that draws a line where two groups meet (snout on face, ear on head) */
        groupJump: num.positive(),
        lightness: num,
        chroma: num,
        ink: z.string(),
        inkMix: num,
      })
      .strict(),
    eyes: z
      .object({
        highlight: z.object({ size: num, up: num, side: num }).strict(),
        highlight2: z.object({ size: num, up: num, side: num }).strict(),
        highlightColor: z.string(),
        /** iris (colour role "iris") as a fraction of the eye, shifted down by irisDown * height */
        irisScale: num,
        irisDown: num,
        irisSoft: num,
      })
      .strict(),
    /** painted feel: brush grain (fraction of lightness, world frequency) and a top-to-bottom light gradient */
    paint: z.object({ grain: num, grainFreq: num, gradient: num }).strict(),
    supersample: z.number().int().min(1).max(4),
    kinds: z.record(z.string(), KindSchema),
  })
  .strict();
export type Style = z.infer<typeof StyleSchema>;

export const SHAPES = [
  'sphere',
  'ellipsoid',
  'box',
  'cone',
  'arc',
  'cylinder',
  'wedge',
  'stroke',
  'eye',
] as const;
export const FLAGS = ['unlit', 'noline', 'gloss', 'tintcut'] as const;

const Noise = z.object({ amp: num, freq: num, speed: num.default(0) }).strict();

const PartFields = {
  shape: z.enum(SHAPES).optional(),
  /** shape parameters, see docs/studio/RECIPE_GUIDE.md */
  size: z.array(num).min(1).max(4).optional(),
  parent: z.string().optional(),
  /** joint position in the parent's frame (the part rotates around it) */
  at: Vec3.optional(),
  rot: Vec3.optional(),
  /** shape centre relative to the joint, in the part's own frame */
  offset: Vec3.optional(),
  scale: num.positive().optional(),
  color: z.string().optional(),
  /** explicit outline colour (palette key); default derives from color */
  line: z.string().optional(),
  /** smooth-union radius with everything before it */
  blend: num.min(0).optional(),
  /** curve the shape: local x shifts by bend * y^2 */
  bend: num.optional(),
  /** stroke only: > 0 round base + pointed tip, < 0 pointed both ends (crescent) */
  taper: num.optional(),
  op: z.enum(['add', 'cut', 'intersect']).optional(),
  group: z.string().optional(),
  flags: z.array(z.enum(FLAGS)).optional(),
  noise: Noise.optional(),
  /** emit a copy mirrored across z (name _l -> _r) */
  mirror: z.boolean().optional(),
  /** emit copies: each step adds `step` to at and `turn` to rot; an optional second axis makes a grid */
  repeat: z
    .object({
      n: z.number().int().min(1).max(64),
      step: Vec3.default([0, 0, 0]),
      turn: Vec3.default([0, 0, 0]),
      n2: z.number().int().min(1).max(64).default(1),
      step2: Vec3.default([0, 0, 0]),
      /** shift every other row by this (brick / tile offset) */
      stagger: Vec3.default([0, 0, 0]),
    })
    .strict()
    .optional(),
  /** orient the shape to the camera (lines, closed eyes) */
  billboard: z.boolean().optional(),
  /** draw order; parts sort by order then by declaration */
  order: num.optional(),
  hide: z.boolean().optional(),
  remove: z.boolean().optional(),
  /** flat mode: inner bands */
  bands: z
    .object({ mid: z.string(), core: z.string().optional(), b1: num, b2: num.optional() })
    .strict()
    .optional(),
};
export const PartSchema = z.object(PartFields).strict();
export type Part = z.infer<typeof PartSchema>;

export const PaintSchema = z
  .object({
    ...PartFields,
    /** groups this paint may colour */
    on: z.array(z.string()).optional(),
    soft: num.min(0).optional(),
    opacity: num.min(0).max(1).optional(),
  })
  .strict();
export type Paint = z.infer<typeof PaintSchema>;

export const PartDelta = z
  .object({
    rot: Vec3.optional(),
    at: Vec3.optional(),
    offset: Vec3.optional(),
    scale: num.positive().optional(),
    size: z.array(num).min(1).max(4).optional(),
    bend: num.optional(),
    taper: num.optional(),
    hide: z.boolean().optional(),
    show: z.boolean().optional(),
    noisePhase: num.optional(),
  })
  .strict();
export type PartDelta = z.infer<typeof PartDelta>;

export const PoseSchema = z.record(z.string(), PartDelta);
export type Pose = z.infer<typeof PoseSchema>;

export const ClipSchema = z
  .object({
    /** frames rendered for a sheet */
    frames: z.number().int().positive(),
    /** keyframes: t in [0, 1], pose name or inline pose */
    keys: z
      .array(
        z
          .object({
            t: num.min(0).max(1),
            pose: z.union([z.string(), PoseSchema]),
            ease: z.enum(['linear', 'in', 'out', 'inout']).optional(),
          })
          .strict(),
      )
      .min(1),
    /** loops sample t = i / frames, one-shots t = i / (frames - 1) */
    loop: z.boolean().default(false),
    /** global noise phase from .. to across the clip (fire flicker) */
    phase: z.tuple([num, num]).optional(),
  })
  .strict();
export type Clip = z.infer<typeof ClipSchema>;

export const OutputSchema = z
  .object({
    /** path under public/assets, must be a manifest file of `asset` */
    file: z.string().regex(/^[a-z0-9_/]+\.png$/),
    /** manifest id that owns the file */
    asset: z.string(),
    pose: z.string().optional(),
    clip: z.string().optional(),
    /** single frame of a clip (0-based) */
    frame: z.number().int().min(0).optional(),
    /** sheet columns (defaults to all frames in one row) */
    cols: z.number().int().positive().optional(),
    /** write manifest frames { width, height, count, fps } for a sheet */
    fps: z.number().positive().optional(),
    /** per-output view override */
    view: z
      .object({
        canvas: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
        ppu: num.positive().optional(),
        origin: z.tuple([num, num]).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type Output = z.infer<typeof OutputSchema>;

/** A recipe or template after `extends` is resolved. Templates may leave fields out. */
export const RecipeSchema = z
  .object({
    $schema: z.string().optional(),
    extends: z.string().optional(),
    id: z.string().regex(/^[a-z0-9_]+$/),
    kind: z.string(),
    /** Area for the Admin page + status table */
    area: z.string().optional(),
    notes: z.string().optional(),
    /** colour roles -> palette keys */
    colors: z.record(z.string(), z.string()).default({}),
    parts: z.record(z.string(), PartSchema).default({}),
    paints: z.record(z.string(), PaintSchema).default({}),
    poses: z.record(z.string(), PoseSchema).default({}),
    clips: z.record(z.string(), ClipSchema).default({}),
    outputs: z.array(OutputSchema).default([]),
    /** whole-model transform */
    root: z
      .object({ at: Vec3.optional(), rot: Vec3.optional(), scale: num.positive().optional() })
      .strict()
      .optional(),
  })
  .strict();
export type Recipe = z.infer<typeof RecipeSchema>;

/** Templates: same shape, id/kind optional. */
export const TemplateSchema = RecipeSchema.partial({ id: true, kind: true });

export function jsonSchemas(): Record<string, unknown> {
  return {
    'style.schema.json': z.toJSONSchema(StyleSchema, { io: 'input' }),
    'recipe.schema.json': z.toJSONSchema(TemplateSchema, { io: 'input' }),
  };
}
