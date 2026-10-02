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
] as const;
export const ITEM_ID_VALUES = ['FOOD_BASIC', 'MEDICINE_COMMON'] as const;
export const COSMETIC_SLOT_VALUES = ['head', 'face', 'body', 'back', 'prop', 'fx'] as const;
export const TRANSACTION_TYPE_VALUES = [
  'INITIAL_GOLD',
  'SHOP_PURCHASE',
  'PIG_PURCHASE',
  'PIG_SELL',
  'BREEDING_FEE',
  'SLOT_PURCHASE',
  'TROUGH_FILL',
  'SKIN_PURCHASE',
  'ORDER_REWARD',
  'DISCOVERY_BONUS',
  'SKIN_REFUND', // save v2 -> v3: species skins nobody wore (DECISIONS U00-1 D3)
  'GIFT_REWARD', // gift box opened on the farm (U06)
] as const;

export type Gender = (typeof GENDER_VALUES)[number];
export type BreedId = (typeof BREED_ID_VALUES)[number];
export type ItemId = (typeof ITEM_ID_VALUES)[number];
export type CosmeticSlot = (typeof COSMETIC_SLOT_VALUES)[number];
export type TransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];
