// The shared content files (content/shared/*.json), validated once when first imported (ARCHITECTURE
// §8). The config modules next to this one expose them under their game names (ITEMS, PRODUCTS…);
// each Area loads its own files the same way. Vite bundles the JSON: nothing is fetched at runtime.
import achievementsRaw from '../../../content/shared/achievements.json';
import dailyRaw from '../../../content/shared/daily.json';
import dayNightRaw from '../../../content/shared/daynight.json';
import inventoryRaw from '../../../content/shared/inventory.json';
import itemsRaw from '../../../content/shared/items.json';
import progressionRaw from '../../../content/shared/progression.json';
import qualityRaw from '../../../content/shared/quality.json';
import shopRaw from '../../../content/shared/shop.json';
import timeRaw from '../../../content/shared/time.json';
import { achievementsFileSchema } from '../../../content/schemas/shared/achievements';
import { dailyFileSchema } from '../../../content/schemas/shared/daily';
import { dayNightFileSchema } from '../../../content/schemas/shared/dayNight';
import { inventoryFileSchema } from '../../../content/schemas/shared/inventory';
import { itemsFileSchema } from '../../../content/schemas/shared/items';
import { progressionFileSchema } from '../../../content/schemas/shared/progression';
import { qualityFileSchema } from '../../../content/schemas/shared/quality';
import { shopFileSchema } from '../../../content/schemas/shared/shop';
import { timeFileSchema } from '../../../content/schemas/shared/time';
import { ContentError, loadContent } from '../content/load';

export const CONTENT = {
  items: loadContent('shared/items.json', itemsFileSchema, itemsRaw),
  inventory: loadContent('shared/inventory.json', inventoryFileSchema, inventoryRaw),
  progression: loadContent('shared/progression.json', progressionFileSchema, progressionRaw),
  quality: loadContent('shared/quality.json', qualityFileSchema, qualityRaw),
  shop: loadContent('shared/shop.json', shopFileSchema, shopRaw),
  achievements: loadContent('shared/achievements.json', achievementsFileSchema, achievementsRaw),
  daily: loadContent('shared/daily.json', dailyFileSchema, dailyRaw),
  dayNight: loadContent('shared/daynight.json', dayNightFileSchema, dayNightRaw),
  time: loadContent('shared/time.json', timeFileSchema, timeRaw),
};

/**
 * Rows keyed by id, every id of `ids` present (ids.generated.ts is built from the same file, so a gap
 * means it is stale: run `npm run content:ids`).
 */
export function byId<Id extends string, R extends { id: Id }>(file: string, rows: readonly R[], ids: readonly Id[]): Record<Id, R> {
  const map = Object.fromEntries(rows.map((r) => [r.id, r])) as Record<Id, R>;
  const missing = ids.filter((id) => !(id in map));
  if (missing.length > 0) throw new ContentError(file, missing.map((id) => `${id}: no row (run npm run content:ids)`));
  return map;
}
