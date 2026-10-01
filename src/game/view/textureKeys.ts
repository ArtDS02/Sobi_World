// Phaser texture / cache keys for manifest files, and the preload list (spec §11, §11.4).
// Pure: no Phaser import, so it is unit tested.
import type { AssetRegistry } from '../../core/assets/registry';
import { troughState } from '../../core/assets/registry';
import { TROUGH_PROP_ID } from '../../core/config/assetIds';
import type { BreedId } from '../../core/config/ids';

/** `asset` → the id itself; any other file of the row → `${id}_${file}` (e.g. pig_classic_sleep). */
export const textureKey = (id: string, file = 'asset'): string =>
  file === 'asset' ? id : `${id}_${file}`;

export const anchorsKey = (skinId: string): string => textureKey(skinId, 'anchors');

export const fallbackPigKey = (breed: BreedId): string => `fallback_pig_${breed.toLowerCase()}`;
export const FALLBACK_PROP_KEY = 'fallback_prop';
export const FALLBACK_FX_KEY = 'fallback_fx';

/** Trough texture by fill: 0 → empty, ≤ capacity/2 → half, otherwise full. */
export const troughTextureKey = (food: number, capacity: number): string =>
  textureKey(TROUGH_PROP_ID, troughState(food, capacity));

export interface LoadItem {
  key: string;
  url: string;
}

export interface LoadList {
  images: LoadItem[];
  json: LoadItem[];
}

const FARM_SECTIONS = new Set(['environment', 'props', 'buildings', 'fx', 'ui']);
/** Files rendered by the farm; shadows, flips and audio are not drawn in R05A. */
const SKIPPED_FILES = new Set(['shadow', 'flip', 'anchors']);

/** Every file of one pig skin: idle, optional sleep frame, optional anchors json. */
export function skinLoadList(assets: AssetRegistry, skinId: string): LoadList {
  const entry = assets.resolve(skinId);
  if (!entry || entry.section !== 'pigs') return { images: [], json: [] };
  const url = (file: string) => assets.url(skinId, file);
  const images: LoadItem[] = [];
  for (const file of ['asset', 'sleep']) {
    const u = url(file);
    if (u) images.push({ key: textureKey(skinId, file), url: u });
  }
  const a = url('anchors');
  return { images, json: a ? [{ key: anchorsKey(skinId), url: a }] : [] };
}

/** Environment, structures, props (all trough states), fx, ui icons, plus the given skins. */
export function farmLoadList(assets: AssetRegistry, skinIds: Iterable<string>): LoadList {
  const images: LoadItem[] = [];
  const json: LoadItem[] = [];
  for (const entry of assets.entries()) {
    if (!FARM_SECTIONS.has(entry.section)) continue;
    for (const file of Object.keys(entry.files)) {
      if (SKIPPED_FILES.has(file)) continue;
      const url = assets.url(entry.id, file);
      if (url) images.push({ key: textureKey(entry.id, file), url });
    }
  }
  for (const skinId of new Set(skinIds)) {
    const s = skinLoadList(assets, skinId);
    images.push(...s.images);
    json.push(...s.json);
  }
  return { images, json };
}
