// Closed vocabularies the content schemas validate against. Adding a value here is a code change on
// purpose: the game has rules (art, order demand, breeding) for each one. Ids of content rows (breeds,
// items, decorations) are not here: they come from the content itself (ids.generated.ts).

/** Rarity ladder (DECISIONS U00-1 D9). Mythic is reserved (GAME_BALANCE §2.5), not used yet. */
export const RARITY_VALUES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
export type Rarity = (typeof RARITY_VALUES)[number];

export const GENDER_VALUES = ['MALE', 'FEMALE'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

/** Breeding family / theme of a species (U03 "related" results; the last eight are the A7 collections). */
export const FAMILY_VALUES = [
  'FARM', 'MEADOW', 'WILD', 'WATER', 'HERO', 'MYTHIC',
  'VIETNAM', 'JOB', 'ADVENTURE', 'SCIFI', 'FANTASY', 'HORROR', 'FOOD', 'FUNNY',
] as const;
export type Family = (typeof FAMILY_VALUES)[number];

/** Gene tags of a species (DECISIONS PS-2): colour, nature, theme. */
export const TRAIT_VALUES = [
  // colour
  'pink', 'white', 'black', 'brown', 'gray', 'gold', 'green', 'red', 'blue', 'purple', 'orange',
  // nature
  'farm', 'animal', 'wild', 'plant', 'fruit', 'flower', 'insect', 'water', 'ice', 'fire', 'sky',
  // theme
  'food', 'sweet', 'job', 'hero', 'warrior', 'magic', 'myth', 'light', 'dark', 'spooky', 'space',
  'tech', 'metal', 'festive', 'vietnam', 'royal', 'funny', 'cozy', 'wings', 'horns',
] as const;
export type Trait = (typeof TRAIT_VALUES)[number];

/** Groups of goods the daily market moves together (spec V2 §9): shipped pigs, farm crops, feed, materials. */
export const MARKET_GROUP_VALUES = ['PIGS', 'CROPS', 'FOOD', 'MATERIALS'] as const;
export type MarketGroup = (typeof MARKET_GROUP_VALUES)[number];

/** Why a creature is raised (spec V2 §7): shipped out, kept to breed, kept as a pet, or sent adventuring (GĐ10). */
export const PURPOSE_VALUES = ['SHIP', 'BREED', 'PET', 'ADVENTURE'] as const;
export type Purpose = (typeof PURPOSE_VALUES)[number];

/** Counters kept in the save's progression.stats (PG-2). */
export const STAT_ID_VALUES = [
  'pigsBought', 'pigsSold', 'births', 'ordersFulfilled', 'giftsOpened',
  'pigsCleaned', 'pigsTreated', 'breedings', 'goldEarned', 'bestStreak', 'pigsPetted',
  // GĐ6: kept by the Farm's tracker (feeds, manureCollected, slotsOwned, decorOwned, maxHearts) and by the world's
  // (core/goals/stats.ts: cropsPlanted, cropsHarvested, crafts, boardOrders, dailyGoalsDone); each id has one owner.
  'feeds', 'manureCollected', 'slotsOwned', 'decorOwned', 'maxHearts',
  'cropsPlanted', 'cropsHarvested', 'crafts', 'boardOrders', 'dailyGoalsDone',
  // GĐ8: world counters of the Aquarium's standard events (fish.caught, tank.cleaned).
  'fishCaught', 'tanksCleaned',
  // GĐ9: world counters of the Cloud's standard events (flower.harvested, potion.brewed).
  'flowersHarvested', 'potionsBrewed',
  // GĐ10: world counters of the Adventure's standard events (battle.won, adventure.finished).
  'battlesWon', 'adventuresCleared',
] as const;
export type StatId = (typeof STAT_ID_VALUES)[number];

/** Item categories of the shared bag (spec V2 §6 Item). Seeds and crops joined with the Garden, fish with the Aquarium; essences and more come with their Area. */
export const ITEM_CATEGORY_VALUES = ['FOOD', 'MEDICINE', 'MATERIAL', 'SEED', 'CROP', 'FISH', 'FLOWER', 'POTION', 'EQUIPMENT'] as const;
export type ItemCategory = (typeof ITEM_CATEGORY_VALUES)[number];

export const PRODUCT_CATEGORY_VALUES = ['FOOD', 'MEDICINE', 'SUPPLY', 'SPECIAL'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORY_VALUES)[number];
/** What a shop product is priced in. Coins only for now (spec §6: gems are never sold for money). */
export const PRICE_CURRENCY_VALUES = ['GOLD'] as const;
export type PriceCurrency = (typeof PRICE_CURRENCY_VALUES)[number];

export const DAY_PHASES = ['dawn', 'morning', 'day', 'afternoon', 'sunset', 'night'] as const;
export type DayPhase = (typeof DAY_PHASES)[number];

/** Care levels of hunger / cleanliness (NH-1), best first. */
export const NEED_LEVELS = ['good', 'normal', 'low', 'veryLow', 'critical'] as const;
export type NeedLevel = (typeof NEED_LEVELS)[number];

/** Care quality tiers (spec §6 Quality), worst first. Separate from rarity. */
export const QUALITY_VALUES = ['NORMAL', 'GOOD', 'GREAT', 'EXCELLENT', 'PERFECT'] as const;
export type Quality = (typeof QUALITY_VALUES)[number];

/** The four periods of the day (GAME_BALANCE §1): the rhythm of the world's life (sleep, markets). */
export const DAY_PERIOD_VALUES = ['morning', 'day', 'evening', 'night'] as const;
export type DayPeriod = (typeof DAY_PERIOD_VALUES)[number];
