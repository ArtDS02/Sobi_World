// zod schema for public/assets/manifest/assets.json, manifest v2 (art standard §7.2, DECISIONS R00-7).
// A change to the shape bumps `version` here and in the file in the same commit.
import { z } from 'zod';
import { ANCHOR_NAMES, FARM_ACTIONS } from '../config/assetIds';
import { DECOR_ID_VALUES } from '../../../content/schemas/ids.generated';
import { SEASON_IDS } from '../config/seasons';

export const MANIFEST_VERSION = 3;

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
/** Seasonal files of a building / prop (DECISIONS SE-1); a missing season uses the default file. */
const seasonFiles = z.partialRecord(z.enum(SEASON_IDS), assetPath).optional();

const base = {
  id: assetIdSchema,
  status: z.enum(['placeholder', 'production', 'final']),
  credit: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
};

export const pigRowSchema = z.object({
  ...base,
  nameVi: z.string().min(1),
  collection: z.string().min(1),
  asset: assetPath,
  sleepAsset: assetPath.nullable().optional(),
  /** Half-open eyes: falling asleep / waking up (DECISIONS PS-1); missing → idle frame. */
  wakeAsset: assetPath.nullable().optional(),
  anchors: assetPath.optional(),
  tags: z.array(z.string()).default([]),
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
    seasons: seasonFiles,
  })
  .refine((r) => (r.asset === undefined) !== (r.states === undefined), {
    message: 'a prop has either `asset` or `states`',
  });

export const buildingRowSchema = z.object({
  ...base,
  asset: assetPath,
  shadow: assetPath.optional(),
  seasons: seasonFiles,
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
  /** The art carries its own name sign: no text label is drawn over it (A4). */
  signed: z.boolean().optional(),
  /** On-screen width in design px; the art keeps its aspect ratio (absent: native size). */
  width: z.number().positive().optional(),
  /** Notification badge drawn on the object (farm layout v4.1 rework). */
  badge: z.enum(['orders']).optional(),
  // Layout editor fields (admin dashboard, DECISIONS AD-1), all optional and additive.
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
  /** Shown only while the save owns this decoration (DECISIONS PG-3; additive, no version bump). */
  decor: z.enum(DECOR_ID_VALUES).optional(),
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
