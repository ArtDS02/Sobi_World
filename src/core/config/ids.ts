// Primitive id unions shared by config and domain. Lives in config so config never imports domain.
// Value lists exist for runtime validation (zod); the types are derived from them.
export const GENDER_VALUES = ['MALE', 'FEMALE'] as const;
// Pig species (UN_IN_PIG_CATALOGUE.md). The code keeps the spec name "breed" for a species.
export const BREED_ID_VALUES = [
  'PIG_EARTH_PINK',
  'PIG_STRIPED_MELON',
  'PIG_SUPERMAN',
  'PIG_MYTHICAL',
  'PIG_WHITE',
  'PIG_BLACK',
  'PIG_BROWN',
  'PIG_SPOTTED',
  'PIG_BOAR',
  'PIG_SHEEP',
  'PIG_BEE',
  'PIG_PENGUIN',
  'PIG_TIGER',
  'PIG_PANDA',
  'PIG_AXOLOTL',
  'PIG_KOI',
  'PIG_DRAGONLING',
  'PIG_GALAXY',
  'PIG_PHOENIX',
  'PIG_ROBOT',
  'PIG_UNICORN',
  'PIG_BUFFALO',
  'PIG_DEER',
  'PIG_PUMPKIN',
  'PIG_SUNFLOWER',
  'PIG_HEDGEHOG',
  'PIG_TURTLE',
  'PIG_FARMER',
  'PIG_ICECREAM',
  'PIG_CHEF',
  'PIG_SLEEPY',
  'PIG_GHOST',
  'PIG_TEACHER',
  'PIG_KNIGHT',
  'PIG_DETECTIVE',
  'PIG_BUSINESS',
  'PIG_BOBA',
  'PIG_LAZY',
  'PIG_ANGRY',
  'PIG_CRYBABY',
  'PIG_GRANDPA',
  'PIG_PARTY',
  'PIG_AO_DAI',
  'PIG_TET',
  'PIG_LAN',
  'PIG_BANH_CHUNG',
  'PIG_ASTRONAUT',
  'PIG_PIRATE',
  'PIG_NINJA',
  'PIG_WITCH',
  'PIG_SURFER',
  'PIG_DIVER',
  'PIG_ALIEN',
  'PIG_MECHA',
  'PIG_CYBORG',
  'PIG_DRAGON',
  'PIG_ONI',
  'PIG_VAMPIRE',
  'PIG_ZOMBIE',
  'PIG_DONUT',
  'PIG_BURGER',
  'PIG_RICH',
  'PIG_BATTLEBOT',
  'PIG_UFO',
  'PIG_KITSUNE',
  'PIG_PEGASUS',
  'PIG_ZEUS',
  'PIG_VALKYRIE',
  'PIG_THOR',
] as const;
export const ITEM_ID_VALUES = ['FOOD_BASIC', 'MEDICINE_COMMON'] as const;
export const TRANSACTION_TYPE_VALUES = [
  'INITIAL_GOLD',
  'SHOP_PURCHASE',
  'PIG_PURCHASE',
  'PIG_SELL',
  'BREEDING_FEE',
  'SLOT_PURCHASE',
  'TROUGH_FILL',
  'SKIN_PURCHASE', // legacy history only: outfits were removed in save v5 (DECISIONS A2-1)
  'ORDER_REWARD',
  'DISCOVERY_BONUS',
  'SKIN_REFUND', // save migration refunds: v2 -> v3 species skins, v4 -> v5 outfits (A2-1)
  'GIFT_REWARD', // gift box opened on the farm (U06)
  'ADMIN_ADJUST', // gold set by the dev admin dashboard's user editor (DECISIONS AD-1)
  'RELIEF', // neighbour's help when the farm is stuck (DECISIONS PG-1)
  'DAILY_REWARD', // daily login reward (PG-2)
  'ACHIEVEMENT_REWARD', // achievement claimed (PG-2)
  'DECOR_PURCHASE', // farm decoration bought (PG-3)
] as const;
/** Farm decorations (PG-3). Ids are never removed: saves keep them. */
export const DECOR_ID_VALUES = [
  'DECOR_HAY_BALE',
  'DECOR_WHEELBARROW',
  'DECOR_SUNFLOWERS',
  'DECOR_FENCE',
  'DECOR_VEGGIE_PATCH',
  'DECOR_WINDMILL',
] as const;
/** Counters kept in save.progress.stats (PG-2). */
export const STAT_ID_VALUES = [
  'pigsBought',
  'pigsSold',
  'births',
  'ordersFulfilled',
  'giftsOpened',
  'pigsCleaned',
  'pigsTreated',
  'breedings',
  'goldEarned',
  'bestStreak',
] as const;

export type Gender = (typeof GENDER_VALUES)[number];
export type BreedId = (typeof BREED_ID_VALUES)[number];
export type ItemId = (typeof ITEM_ID_VALUES)[number];
export type TransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];
export type DecorId = (typeof DECOR_ID_VALUES)[number];
export type StatId = (typeof STAT_ID_VALUES)[number];
