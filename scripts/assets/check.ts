// assets:check (art standard §7.4, spec §14.9). Returns every problem; an empty list passes.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PNG } from 'pngjs';
import {
  AUDIO_KEYS,
  FX_IDS,
  ORDER_BOARD_PROP_ID,
  GIFT_PROP_ID,
  PIG_FEET_Y,
  TROUGH_PROP_ID,
  TROUGH_STATES,
} from '../../src/core/config/assetIds';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { SEASON_FX_ART_IDS } from '../../src/areas/farm/scene/config/seasonFx';
import {
  MANIFEST_SECTIONS,
  parseManifest,
  type AssetManifest,
  type ManifestSection,
} from '../../src/core/assets/manifestSchema';
import { requiredSize } from './sizes';

const FEET_TOLERANCE = 0.02;
const OPAQUE = 16; // alpha above this counts as painted
const FILE_NAME = /^[a-z0-9_]+\.(png|ogg|mp3|json)$/;

type Row = AssetManifest[ManifestSection][number];

export function rowFiles(row: Row): [string, string][] {
  const r = row as Record<string, unknown>;
  const out: [string, string][] = [];
  for (const [key, field] of [
    ['asset', 'asset'],
    ['sleep', 'sleepAsset'],
    ['wake', 'wakeAsset'],
    ['shadow', 'shadow'],
    ['flip', 'assetFlip'],
    ['anchors', 'anchors'],
  ] as const) {
    if (typeof r[field] === 'string') out.push([key, r[field] as string]);
  }
  if (r.states && typeof r.states === 'object')
    out.push(...(Object.entries(r.states) as [string, string][]));
  if (r.seasons && typeof r.seasons === 'object')
    for (const [season, path] of Object.entries(r.seasons as Record<string, string>))
      out.push([`season_${season}`, path]);
  return out;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Lowest painted row as a fraction of the height (the feet line), or null when empty. */
export function feetLine(png: PNG): number | null {
  for (let y = png.height - 1; y >= 0; y--) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3]! > OPAQUE) return (y + 1) / png.height;
    }
  }
  return null;
}

const cornersClear = (png: PNG) =>
  [
    [0, 0],
    [png.width - 1, 0],
    [0, png.height - 1],
    [png.width - 1, png.height - 1],
  ].every(([x, y]) => png.data[(y! * png.width + x!) * 4 + 3]! <= OPAQUE);

/**
 * Seasonal FX art (DECISIONS MU-2): RGBA with a clean cut — every frame's 1 px border fully clear
 * (no rectangle / background box), something painted, and no frame mostly opaque (a baked-in
 * backdrop). Returns the problems.
 */
export function fxCutIssues(png: PNG, frameWidth: number): string[] {
  const issues: string[] = [];
  const count = Math.max(1, Math.round(png.width / frameWidth));
  for (let f = 0; f < count; f++) {
    let border = 0, painted = 0, opaque = 0;
    for (let y = 0; y < png.height; y++)
      for (let x = f * frameWidth; x < (f + 1) * frameWidth; x++) {
        const a = png.data[(y * png.width + x) * 4 + 3]!;
        const edge = y === 0 || y === png.height - 1 || x === f * frameWidth || x === (f + 1) * frameWidth - 1;
        if (edge && a > 0) border++;
        if (a > OPAQUE) painted++;
        if (a > 240) opaque++;
      }
    const area = frameWidth * png.height;
    if (border > 0) issues.push(`frame ${f}: ${border} px on the border are not transparent`);
    if (painted === 0) issues.push(`frame ${f}: empty`);
    if (opaque > area * 0.85) issues.push(`frame ${f}: ${Math.round((opaque / area) * 100)}% opaque (background?)`);
  }
  return issues;
}

function defaultSize(root: string, row: Row): { width: number; height: number } | null {
  const asset = (row as { asset?: string }).asset;
  const full = asset ? join(root, asset) : '';
  if (!asset || !existsSync(full)) return null;
  const png = PNG.sync.read(readFileSync(full));
  return { width: png.width, height: png.height };
}

/** `root` is the public/assets directory. */
export function checkAssets(root: string): string[] {
  const errors: string[] = [];
  const manifestPath = join(root, 'manifest', 'assets.json');
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return [`manifest: cannot read ${manifestPath}: ${(e as Error).message}`];
  }
  const parsed = parseManifest(raw);
  if (!parsed.ok) return parsed.message.split('\n').map((m) => `schema: ${m}`);
  const manifest = parsed.manifest;

  // Unique ids across every section.
  const ids = new Map<string, ManifestSection>();
  for (const section of MANIFEST_SECTIONS) {
    for (const row of manifest[section]) {
      if (ids.has(row.id))
        errors.push(`${row.id}: duplicate id (${ids.get(row.id)} and ${section})`);
      ids.set(row.id, section);
    }
  }

  // Ids the game references (§7.4 row 3).
  const need = (id: string, section: ManifestSection, why: string) => {
    if (ids.get(id) !== section) errors.push(`${id}: missing ${section} row (${why})`);
  };
  for (const breed of Object.values(BREEDS))
    need(breed.artId, 'pigs', `art of ${breed.id}`);
  for (const id of FX_IDS) need(id, 'fx', 'shared fx set');
  for (const id of SEASON_FX_ART_IDS) need(id, 'fx', 'seasonal FX (MU-2)');
  for (const id of AUDIO_KEYS) need(id, 'audio', 'spec §12 audio key');
  need(ORDER_BOARD_PROP_ID, 'props', 'order board');
  need(GIFT_PROP_ID, 'props', 'gift box (U06)');
  need(TROUGH_PROP_ID, 'props', 'trough');
  const trough = manifest.props.find((p) => p.id === TROUGH_PROP_ID);
  for (const state of TROUGH_STATES) {
    if (trough && !trough.states?.[state])
      errors.push(`${TROUGH_PROP_ID}: missing state "${state}"`);
  }
  for (const p of manifest.layout.placements) {
    if (!ids.has(p.id)) errors.push(`layout: placement "${p.id}" has no manifest row`);
  }
  for (const role of ['trough', 'orderBoard'] as const) {
    if (!manifest.layout.placements.some((p) => p.role === role))
      errors.push(`layout: no "${role}" placement`);
  }

  // Files: existence, naming, size, alpha, feet line.
  const referenced = new Set<string>([manifestPath]);
  for (const section of MANIFEST_SECTIONS) {
    for (const row of manifest[section]) {
      const strict = row.status !== 'placeholder';
      if (section === 'audio' && strict && (!row.credit || !row.license)) {
        errors.push(`${row.id}: ${row.status} audio needs credit and license`);
      }
      for (const [key, path] of rowFiles(row)) {
        const full = join(root, path);
        referenced.add(full);
        const name = path.split('/').pop()!;
        if (!FILE_NAME.test(name))
          errors.push(`${row.id}: file name "${name}" is not lowercase snake_case`);
        if (!existsSync(full)) {
          errors.push(`${row.id}: missing file ${path}`);
          continue;
        }
        if (!path.endsWith('.png')) continue;
        let png: PNG;
        try {
          png = PNG.sync.read(readFileSync(full));
        } catch (e) {
          errors.push(`${row.id}: ${path} is not a valid PNG (${(e as Error).message})`);
          continue;
        }
        // A seasonal variant keeps the default file's canvas: same on-screen size and hit box (SE-1).
        const size =
          requiredSize(section, row, key) ?? (key.startsWith('season_') ? defaultSize(root, row) : null);
        if (size && (png.width !== size.width || png.height !== size.height)) {
          errors.push(
            `${row.id}: ${path} is ${png.width}x${png.height}, expected ${size.width}x${size.height}`,
          );
        }
        if (strict && !(png as PNG & { alpha?: boolean }).alpha)
          errors.push(`${row.id}: ${path} has no alpha channel`);
        if (strict && (section === 'pigs' || section === 'fx') && !cornersClear(png)) {
          errors.push(`${row.id}: ${path} corners are not transparent`);
        }
        if (strict && section === 'fx' && (SEASON_FX_ART_IDS as readonly string[]).includes(row.id)) {
          const fx = row as AssetManifest['fx'][number];
          for (const issue of fxCutIssues(png, fx.frames?.width ?? png.width)) errors.push(`${row.id}: ${issue}`);
        }
        if (section === 'pigs') {
          const feet = feetLine(png);
          if (feet === null || Math.abs(feet - PIG_FEET_Y) > FEET_TOLERANCE) {
            errors.push(
              `${row.id}: ${path} feet line at ${feet === null ? 'none' : `${Math.round(feet * 100)}%`}, expected 82% ±2%`,
            );
          }
        }
      }
    }
  }

  // No orphan files (dotfiles such as .gitkeep are ignored).
  for (const file of walk(root)) {
    if (file.split(/[\\/]/).pop()!.startsWith('.')) continue;
    if (!referenced.has(file))
      errors.push(`orphan file: ${relative(root, file).replace(/\\/g, '/')}`);
  }
  return errors;
}
