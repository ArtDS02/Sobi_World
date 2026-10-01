// zod schema for public/assets/manifest/assets.json, manifest v2 (art standard §7.2, DECISIONS R00-7).
// A change to the shape bumps `version` here and in the file in the same commit.
import { z } from 'zod';
import { ANCHOR_NAMES, FARM_ACTIONS } from '../config/assetIds';
import { BREED_ID_VALUES, COSMETIC_SLOT_VALUES } from '../config/ids';

export const MANIFEST_VERSION = 2;

export const assetIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, 'id must be lowercase snake_case');
/** Relative to public/assets/, forward slashes, no `..`; `*.anchors.json` per art standard §7.2. */
const assetPath = z
  .string()
  .regex(
    /^[a-z0-9_]+(\/[a-z0-9_]+)*(\.anchors(?=\.json$))?\.(png|ogg|mp3|json)$/,
    'path must be relative snake_case',
  );
const unit = z.number().min(0).max(1);

const base = {
  id: assetIdSchema,
  status: z.enum(['placeholder', 'production', 'final']),
  credit: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
};

const rarity = z.enum(['P1', 'P2', 'P3', 'P4', 'P5']);
const unlock = z
  .discriminatedUnion('kind', [
    z.object({ kind: z.literal('LEVEL'), level: z.number().int().min(1) }),
    z.object({ kind: z.literal('COLLECTION'), count: z.number().int().min(1) }),
  ])
  .nullable();

export const pigRowSchema = z.object({
  ...base,
  nameVi: z.string().min(1),
  collection: z.string().min(1),
  rarity,
  priceGold: z.number().int().positive().nullable(),
  unlock,
  allowedBreeds: z.union([z.literal('ALL'), z.array(z.enum(BREED_ID_VALUES)).min(1)]),
  asset: assetPath,
  sleepAsset: assetPath.nullable().optional(),
  anchors: assetPath.optional(),
  tags: z.array(z.string()).default([]),
});

export const cosmeticRowSchema = z.object({
  ...base,
  slot: z.enum(COSMETIC_SLOT_VALUES),
  symmetric: z.boolean(),
  asset: assetPath,
  assetFlip: assetPath.optional(),
  compatibleTags: z.array(z.string()).default([]),
});

const frames = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  count: z.number().int().min(2),
  fps: z.number().positive(),
});

export const fxRowSchema = z.object({
  ...base,
  asset: assetPath,
  anchor: z.enum(ANCHOR_NAMES).optional(),
  frames: frames.optional(),
  particle: z.boolean().optional(),
});

export const propRowSchema = z
  .object({
    ...base,
    asset: assetPath.optional(),
    states: z.record(assetIdSchema, assetPath).optional(),
  })
  .refine((r) => (r.asset === undefined) !== (r.states === undefined), {
    message: 'a prop has either `asset` or `states`',
  });

export const buildingRowSchema = z.object({
  ...base,
  asset: assetPath,
  shadow: assetPath.optional(),
});

export const environmentRowSchema = z.object({
  ...base,
  asset: assetPath,
  tile: z.boolean().optional(),
});

export const uiRowSchema = z.object({ ...base, asset: assetPath });

export const audioRowSchema = z.object({
  ...base,
  asset: assetPath,
  kind: z.enum(['music', 'sfx']),
  loop: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
});

export const placementSchema = z.object({
  id: assetIdSchema,
  layer: z.number().int().min(0).max(5),
  x: z.number(),
  y: z.number(),
  originX: unit.optional(),
  originY: unit.optional(),
  role: z.enum(['trough', 'orderBoard']).optional(),
  /** Clicking the placement opens this (optional, additive: v2 files stay valid). */
  action: z.enum(FARM_ACTIONS).optional(),
});

export const layoutSchema = z.object({
  designSize: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  walkArea: z.object({ x: unit, y: unit, width: unit, height: unit }),
  pigScaleByY: z.object({ min: z.number().positive(), max: z.number().positive() }),
  placements: z.array(placementSchema),
});

export const manifestSchema = z.object({
  version: z.literal(MANIFEST_VERSION),
  pigs: z.array(pigRowSchema),
  cosmetics: z.array(cosmeticRowSchema),
  fx: z.array(fxRowSchema),
  props: z.array(propRowSchema),
  buildings: z.array(buildingRowSchema),
  environment: z.array(environmentRowSchema),
  ui: z.array(uiRowSchema),
  audio: z.array(audioRowSchema),
  layout: layoutSchema,
});

export type AssetManifest = z.infer<typeof manifestSchema>;
export type PigRow = z.infer<typeof pigRowSchema>;
export type FxRow = z.infer<typeof fxRowSchema>;
export type PropRow = z.infer<typeof propRowSchema>;
export type AudioRow = z.infer<typeof audioRowSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type AssetStatus = PigRow['status'];
export type ManifestSection = Exclude<keyof AssetManifest, 'version' | 'layout'>;
export const MANIFEST_SECTIONS: ManifestSection[] = [
  'pigs',
  'cosmetics',
  'fx',
  'props',
  'buildings',
  'environment',
  'ui',
  'audio',
];

export type ManifestParse = { ok: true; manifest: AssetManifest } | { ok: false; message: string };

/** Validates a parsed JSON value; the message lists every issue with its path. */
export function parseManifest(raw: unknown): ManifestParse {
  const r = manifestSchema.safeParse(raw);
  if (r.success) return { ok: true, manifest: r.data };
  const message = r.error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  return { ok: false, message };
}
