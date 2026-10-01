// Primitive id unions shared by config and domain. Lives in config so config never imports domain.
// Value lists exist for runtime validation (zod); the types are derived from them.
export const GENDER_VALUES = ['MALE', 'FEMALE'] as const;
export const BREED_ID_VALUES = [
  'PIG_EARTH_PINK',
  'PIG_STRIPED_MELON',
  'PIG_SUPERMAN',
  'PIG_MYTHICAL',
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
] as const;

export type Gender = (typeof GENDER_VALUES)[number];
export type BreedId = (typeof BREED_ID_VALUES)[number];
export type ItemId = (typeof ITEM_ID_VALUES)[number];
export type CosmeticSlot = (typeof COSMETIC_SLOT_VALUES)[number];
export type TransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];
