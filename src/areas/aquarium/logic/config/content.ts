// The Aquarium's content files (content/aquarium/*.json), validated once when first imported
// (ARCHITECTURE §8, core/content), and the tables built from them.
import areaRaw from '../../../../../content/aquarium/area.json';
import balanceRaw from '../../../../../content/aquarium/balance.json';
import fishRaw from '../../../../../content/aquarium/fish.json';
import namesRaw from '../../../../../content/aquarium/names.json';
import { areaManifestSchema } from '../../../../../content/schemas/area';
import { aquariumBalanceFileSchema } from '../../../../../content/schemas/aquarium/balance';
import { fishFileSchema, fishNamesFileSchema, type FishRow } from '../../../../../content/schemas/aquarium/fish';
import { loadContent } from '../../../../core/content/load';
import { rarityRank } from '../../../../core/config/rarity';

export const AQUARIUM_CONTENT = {
  area: loadContent('aquarium/area.json', areaManifestSchema, areaRaw),
  balance: loadContent('aquarium/balance.json', aquariumBalanceFileSchema, balanceRaw),
  fish: loadContent('aquarium/fish.json', fishFileSchema, fishRaw),
  names: loadContent('aquarium/names.json', fishNamesFileSchema, namesRaw),
};

export const AQUARIUM_AREA_ID = AQUARIUM_CONTENT.area.id;
export const AB = AQUARIUM_CONTENT.balance;
export const HOUR_MS = 3_600_000;

export type FishSpecies = FishRow;
export const FISH_LIST: readonly FishSpecies[] = AQUARIUM_CONTENT.fish.fish;
export const FISH: Readonly<Record<string, FishSpecies>> = Object.fromEntries(FISH_LIST.map((f) => [f.id, f]));
export const FISH_NAMES: readonly string[] = AQUARIUM_CONTENT.names.names;
/** The species an item of the bag is the catch of. */
export const fishOfItem = (itemId: string): FishSpecies | undefined => FISH_LIST.find((f) => f.item === itemId);

/** 0 (Common) … 4 (Legendary): how much a good cast favours the species. */
export const rarityStep = (f: Pick<FishSpecies, 'rarity'>): number => rarityRank(f.rarity);

export const TANK_LEVELS = AB.tank.levels;
export const MAX_TANK_LEVEL = TANK_LEVELS.length;
export const tankCapacity = (level: number): number => TANK_LEVELS[Math.min(level, MAX_TANK_LEVEL) - 1]!.capacity;

/** The tank's buildings, as the manifest names them. */
export const FEED_ITEM = 'FOOD_FISH';
export const MEDICINE_ITEM = 'MEDICINE_COMMON';
export const SCALE_ITEM = 'item_scale';
export const PEARL_ITEM = 'item_pearl';
