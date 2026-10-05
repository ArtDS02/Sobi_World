// Every content file (content/**/*.json), validated once when first imported (ARCHITECTURE §8). The
// config modules next to this one expose the parts the game uses under their historical names
// (BALANCE, BREEDS, PRODUCTS…). Vite bundles the JSON into the build: nothing is fetched at runtime.
import achievementsRaw from '../../../content/shared/achievements.json';
import dailyRaw from '../../../content/shared/daily.json';
import dayNightRaw from '../../../content/shared/daynight.json';
import itemsRaw from '../../../content/shared/items.json';
import shopRaw from '../../../content/shared/shop.json';
import farmBalanceRaw from '../../../content/farm/balance.json';
import behaviorRaw from '../../../content/farm/behavior.json';
import breedingRaw from '../../../content/farm/breeding.json';
import decorRaw from '../../../content/farm/decor.json';
import giftsRaw from '../../../content/farm/gifts.json';
import namesRaw from '../../../content/farm/names.json';
import seasonFxRaw from '../../../content/farm/season-fx.json';
import speciesRaw from '../../../content/farm/species.json';
import { achievementsFileSchema } from '../../../content/schemas/shared/achievements';
import { dailyFileSchema } from '../../../content/schemas/shared/daily';
import { dayNightFileSchema } from '../../../content/schemas/shared/dayNight';
import { itemsFileSchema } from '../../../content/schemas/shared/items';
import { shopFileSchema } from '../../../content/schemas/shared/shop';
import { farmBalanceFileSchema } from '../../../content/schemas/farm/balance';
import { behaviorFileSchema } from '../../../content/schemas/farm/behavior';
import { breedingFileSchema } from '../../../content/schemas/farm/breeding';
import { decorFileSchema } from '../../../content/schemas/farm/decor';
import { giftsFileSchema } from '../../../content/schemas/farm/gifts';
import { namesFileSchema } from '../../../content/schemas/farm/names';
import { seasonFxFileSchema } from '../../../content/schemas/farm/seasonFx';
import { speciesFileSchema } from '../../../content/schemas/farm/species';
import { ContentError, loadContent } from '../content/load';

export const CONTENT = {
  items: loadContent('shared/items.json', itemsFileSchema, itemsRaw),
  shop: loadContent('shared/shop.json', shopFileSchema, shopRaw),
  achievements: loadContent('shared/achievements.json', achievementsFileSchema, achievementsRaw),
  daily: loadContent('shared/daily.json', dailyFileSchema, dailyRaw),
  dayNight: loadContent('shared/daynight.json', dayNightFileSchema, dayNightRaw),
  farmBalance: loadContent('farm/balance.json', farmBalanceFileSchema, farmBalanceRaw),
  species: loadContent('farm/species.json', speciesFileSchema, speciesRaw),
  breeding: loadContent('farm/breeding.json', breedingFileSchema, breedingRaw),
  gifts: loadContent('farm/gifts.json', giftsFileSchema, giftsRaw),
  decor: loadContent('farm/decor.json', decorFileSchema, decorRaw),
  names: loadContent('farm/names.json', namesFileSchema, namesRaw),
  behavior: loadContent('farm/behavior.json', behaviorFileSchema, behaviorRaw),
  seasonFx: loadContent('farm/season-fx.json', seasonFxFileSchema, seasonFxRaw),
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
