// Primitive id unions shared by config and domain. Lives in config so config never imports domain.
export type Gender = 'MALE' | 'FEMALE';
export type BreedId = 'PIG_EARTH_PINK' | 'PIG_STRIPED_MELON' | 'PIG_SUPERMAN' | 'PIG_MYTHICAL';
export type ItemId = 'FOOD_BASIC' | 'MEDICINE_COMMON';
export type CosmeticSlot = 'head' | 'face' | 'body' | 'back' | 'prop' | 'fx';
