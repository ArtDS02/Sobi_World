// Phaser texture / cache keys for manifest files, and the preload list (spec §11, §11.4).
// Pure: no Phaser import, so it is unit tested.
import type { AssetRegistry } from '../../../../core/assets/registry';
import { troughState } from './farmArt';
import { TROUGH_PROP_ID } from '../../../../core/config/assetIds';
import type { BreedId } from '../../logic/config/ids';
import type { SeasonId } from '../../../../core/config/seasons';
import { isSeasonFile, seasonFile } from '../../../../core/engine/season';

import { FALLBACK_PROP_KEY, textureKey } from '../../../../ui/world/keys';

export { FALLBACK_PROP_KEY, textureKey };

export const anchorsKey = (artId: string): string => textureKey(artId, 'anchors');

export const fallbackPigKey = (breed: BreedId): string => `fallback_pig_${breed.toLowerCase()}`;
export const FALLBACK_FX_KEY = 'fallback_fx';

/** Animation key of a multi-frame fx (manifest `frames`, e.g. fx_zzz). */
export const fxAnimKey = (fxId: string): string => `${fxId}_anim`;

/** Trough texture by fill: 0 → empty, ≤ capacity/2 → half, otherwise full. */
export const troughTextureKey = (food: number, capacity: number): string =>
  textureKey(TROUGH_PROP_ID, troughState(food, capacity));

export interface LoadItem {
  key: string;
  url: string;
}

/** A horizontal strip of equal frames (fx rows with `frames`), animated at `fps`. */
export interface SheetItem extends LoadItem {
  frameWidth: number;
  frameHeight: number;
  count: number;
  fps: number;
}

export interface LoadList {
  images: LoadItem[];
  json: LoadItem[];
  sheets: SheetItem[];
}

const FARM_SECTIONS = new Set(['environment', 'props', 'buildings', 'fx', 'ui']);
/** Files rendered by the farm; shadows, flips and audio are not drawn in R05A. */
const SKIPPED_FILES = new Set(['shadow', 'flip', 'anchors']);

/** Files of a species art row the farm draws: idle, optional sleep and wake frames (PS-1). */
export const PIG_FRAMES = ['asset', 'sleep', 'wake'] as const;

/** Texture keys of every frame of a species art row (loaded or not). */
export const artTextureKeys = (artId: string): string[] =>
  PIG_FRAMES.map((file) => textureKey(artId, file));

/** Every file of one species art row: idle, optional sleep / wake frames, optional anchors json. */
export function artLoadList(assets: AssetRegistry, artId: string): LoadList {
  const entry = assets.resolve(artId);
  if (!entry || entry.section !== 'pigs') return { images: [], json: [], sheets: [] };
  const url = (file: string) => assets.url(artId, file);
  const images: LoadItem[] = [];
  for (const file of PIG_FRAMES) {
    const u = url(file);
    if (u) images.push({ key: textureKey(artId, file), url: u });
  }
  const a = url('anchors');
  return { images, json: a ? [{ key: anchorsKey(artId), url: a }] : [], sheets: [] };
}

/** Texture of placement art `id` in `season`: its seasonal variant when the row has one (SE-1). */
export const seasonalTextureKey = (assets: AssetRegistry, id: string, season: SeasonId): string =>
  textureKey(id, assets.seasonalFile(id, season));

/** The seasonal variants of one season (loaded when the season changes mid-session). */
export function seasonLoadList(assets: AssetRegistry, season: SeasonId): LoadList {
  const images: LoadItem[] = [];
  const file = seasonFile(season);
  for (const entry of assets.entries()) {
    const url = entry.files[file] ? assets.url(entry.id, file) : null;
    if (url && FARM_SECTIONS.has(entry.section)) images.push({ key: textureKey(entry.id, file), url });
  }
  return { images, json: [], sheets: [] };
}

/**
 * Environment, structures, props (all trough states), fx, ui icons, plus the given pig art rows.
 * Of the seasonal variants only `season`'s are loaded (none when omitted).
 */
export function farmLoadList(
  assets: AssetRegistry,
  artIds: Iterable<string>,
  season?: SeasonId,
): LoadList {
  const images: LoadItem[] = [];
  const json: LoadItem[] = [];
  const sheets: SheetItem[] = [];
  const framesOf = new Map(assets.manifest.fx.map((r) => [r.id, r.frames]));
  for (const entry of assets.entries()) {
    if (!FARM_SECTIONS.has(entry.section)) continue;
    for (const file of Object.keys(entry.files)) {
      if (SKIPPED_FILES.has(file)) continue;
      if (isSeasonFile(file) && (!season || file !== seasonFile(season))) continue;
      const url = assets.url(entry.id, file);
      if (!url) continue;
      const frames = file === 'asset' ? framesOf.get(entry.id) : undefined;
      const key = textureKey(entry.id, file);
      if (frames) {
        sheets.push({
          key,
          url,
          frameWidth: frames.width,
          frameHeight: frames.height,
          count: frames.count,
          fps: frames.fps,
        });
      } else images.push({ key, url });
    }
  }
  for (const artId of new Set(artIds)) {
    const s = artLoadList(assets, artId);
    images.push(...s.images);
    json.push(...s.json);
  }
  return { images, json, sheets };
}
