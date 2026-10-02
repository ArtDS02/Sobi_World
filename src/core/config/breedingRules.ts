// Breeding odds as rules, not a pair matrix (DECISIONS U00-1 D4, PS-2). Adding a species needs no
// row here: it joins its rarity tier, family and traits. Two steps, both data:
//   1. which RARITY the child gets — RARITY_SAME / RARITY_MIXED, rarer results scaled by the
//      pair's compatibility (COMPAT);
//   2. which SPECIES of that rarity — SPECIES weights (parent species, family, shared traits).
// Then MUTATIONS (named recipes) add points for their result. Every number is TUNABLE.
import type { BreedId } from './ids';

export const BREEDING_RULES = {
  /** Parents of one rarity: percent of each child rarity (relative to theirs). */
  RARITY_SAME: { down: 8, same: 80, up: 10, up2: 1.5 },
  /**
   * Parents of two rarities (low < high): the lower one, the ones in between, the higher one,
   * one above the higher one. A rarity that does not exist is dropped and the rest rescaled.
   */
  RARITY_MIXED: { low: 44, between: 30, high: 22, above: 3 },
  /** Rarer-than-parents percents are multiplied by min + (max − min) × compatibility. */
  UP_SCALE: { min: 0.5, max: 1.5 },
  /** Relative weight of each species inside the child's rarity. */
  SPECIES: {
    /** One of the parents' species (inheritance). */
    PARENT: 150,
    /** Same family (collection theme) as a parent. */
    FAMILY: 8,
    /** Per trait shared with the parents (counted up to TRAIT_CAP). */
    TRAIT: 4,
    TRAIT_CAP: 3,
    /** Anything else of that rarity: the discovery tail. */
    BASE: 1,
  },
  /** Compatibility 0..1 of a pair (shown as hearts; scales the rare results). */
  COMPAT: {
    base: 0.35,
    sameFamily: 0.3,
    perSharedTrait: 0.1,
    traitCap: 3,
    perRarityGap: 0.08,
    /** A pair named in MUTATIONS is a known good match. */
    recipe: 0.25,
  },
  /** Breed dialog: the most likely results listed, the rest summed as one line. */
  CHANCES_SHOWN: 4,
  /**
   * Breed map (admin, DECISIONS BR-2): a route at least this likely places a species one
   * generation after its parents; species only reachable by weaker routes come after.
   */
  MAP_STRONG_PERCENT: 5,
  /** Weaker routes (the discovery tail) still place a species from this percent on. */
  MAP_WEAK_PERCENT: 1,
} as const;

/** Named recipes: extra percent points for a result the rules alone would not favour. */
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
