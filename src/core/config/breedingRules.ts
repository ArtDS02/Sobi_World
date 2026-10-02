// Breeding odds as rules, not a pair matrix (DECISIONS U00-1 D4). Adding a species needs no row
// here: it joins its family and rarity tier. Weights are relative points, TUNABLE.
import type { BreedId } from './ids';

export const BREEDING_RULES = {
  /** Shared by the two parent species (all of it when both are the same species). */
  SAME_PARENT: 60,
  /** Spread over other species of either parent's family, no rarer than the rarer parent. */
  SAME_FAMILY: 25,
  /** Spread over species one rarity above the rarer parent (parents' families first). */
  TIER_UP: 9,
  /** Same, two rarities above: the "very rare" result. */
  TIER_UP_2: 1,
  /** Breed dialog: the most likely results listed by name, the rest summed as one line. */
  CHANCES_SHOWN: 4,
} as const;

/** Special pairs: extra points for a result the rules alone would not favour. */
export interface Mutation {
  parents: readonly [BreedId, BreedId]; // unordered
  result: BreedId;
  weight: number;
}

export const MUTATIONS: readonly Mutation[] = [
  { parents: ['PIG_WHITE', 'PIG_BLACK'], result: 'PIG_PANDA', weight: 3 },
  { parents: ['PIG_WHITE', 'PIG_BLACK'], result: 'PIG_PENGUIN', weight: 6 },
  { parents: ['PIG_WHITE', 'PIG_WHITE'], result: 'PIG_SHEEP', weight: 6 },
  { parents: ['PIG_EARTH_PINK', 'PIG_EARTH_PINK'], result: 'PIG_STRIPED_MELON', weight: 5 },
  { parents: ['PIG_BROWN', 'PIG_BROWN'], result: 'PIG_BOAR', weight: 6 },
  { parents: ['PIG_BROWN', 'PIG_BOAR'], result: 'PIG_TIGER', weight: 5 },
  { parents: ['PIG_BOAR', 'PIG_BOAR'], result: 'PIG_TIGER', weight: 4 },
  { parents: ['PIG_STRIPED_MELON', 'PIG_SHEEP'], result: 'PIG_BEE', weight: 8 },
  { parents: ['PIG_STRIPED_MELON', 'PIG_STRIPED_MELON'], result: 'PIG_SUPERMAN', weight: 4 },
  { parents: ['PIG_PENGUIN', 'PIG_EARTH_PINK'], result: 'PIG_AXOLOTL', weight: 4 },
  { parents: ['PIG_AXOLOTL', 'PIG_WHITE'], result: 'PIG_KOI', weight: 3 },
  { parents: ['PIG_TIGER', 'PIG_SUPERMAN'], result: 'PIG_DRAGONLING', weight: 4 },
  { parents: ['PIG_BLACK', 'PIG_DRAGONLING'], result: 'PIG_GALAXY', weight: 4 },
  { parents: ['PIG_SUPERMAN', 'PIG_PENGUIN'], result: 'PIG_ROBOT', weight: 4 },
  { parents: ['PIG_SHEEP', 'PIG_SUPERMAN'], result: 'PIG_UNICORN', weight: 4 },
  { parents: ['PIG_BLACK', 'PIG_BOAR'], result: 'PIG_BUFFALO', weight: 5 },
  { parents: ['PIG_SPOTTED', 'PIG_BROWN'], result: 'PIG_DEER', weight: 6 },
  { parents: ['PIG_EARTH_PINK', 'PIG_STRIPED_MELON'], result: 'PIG_PUMPKIN', weight: 6 },
  { parents: ['PIG_BEE', 'PIG_PUMPKIN'], result: 'PIG_SUNFLOWER', weight: 5 },
  { parents: ['PIG_BOAR', 'PIG_SHEEP'], result: 'PIG_HEDGEHOG', weight: 5 },
  { parents: ['PIG_PENGUIN', 'PIG_STRIPED_MELON'], result: 'PIG_TURTLE', weight: 5 },
  { parents: ['PIG_KOI', 'PIG_DRAGONLING'], result: 'PIG_MYTHICAL', weight: 3 },
  { parents: ['PIG_DRAGONLING', 'PIG_GALAXY'], result: 'PIG_PHOENIX', weight: 2 },
];
