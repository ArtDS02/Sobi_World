// Breeding as data (DECISIONS U00-1 D4, PS-2, MU-1). A pair's child is decided in layers, highest
// priority first — a lower layer never overrides a higher one:
//   1. the admin pair table (breedingPairs.ts, AD-1): an active row IS the pair's whole odds;
//   2. SPECIAL RECIPES (MUTATIONS): a named result takes its percent of the pair's odds first;
//   3. RANDOM GENETICS (GENETICS): the rest, so every valid pair has a child — parent species
//      first, then other species of the same / middle rarity, then one tier up at most.
// Inside a bucket the gene pool (genePool.ts: theme + gene tags) only shapes which species of that
// bucket comes out. Adding a species needs no row here. Every number is TUNABLE; the blocks
// between the admin markers are rewritten by the admin dashboard (→ Phối giống).
import type { BreedId } from './ids';

/** Percent buckets of one random-genetics case; a bucket with no species is dropped, the rest rescale. */
export interface GeneticsBuckets {
  /** Child is the species of parent A or parent B (split evenly). */
  parentTypeChance: number;
  /** Another species of a parent's rarity (sameRarity: theirs; adjacentRarity: either one). */
  sameRarityTypeChance: number;
  /** A species of a rarity strictly between the parents' (differentRarity only). */
  middleRarityChance: number;
  /**
   * sameRarity: a species one tier above the parents (never more than one tier).
   * different / adjacentRarity: another species of the higher parent's rarity.
   */
  higherRarityChance: number;
}

export interface GeneticsRules {
  /** Parents of one rarity. */
  sameRarity: GeneticsBuckets;
  /** Parents with at least one rarity tier between them (Common × Epic → Uncommon, Rare). */
  differentRarity: GeneticsBuckets;
  /** Parents of neighbouring rarities (Common × Uncommon): no middle tier. */
  adjacentRarity: GeneticsBuckets;
  /** sameRarity's one-tier-up bucket is multiplied by min + (max − min) × compatibility. */
  compatScale: { min: number; max: number };
}

// <admin:genetics>
export const GENETICS: GeneticsRules = {
  sameRarity: { parentTypeChance: 66, sameRarityTypeChance: 26, middleRarityChance: 0, higherRarityChance: 8 },
  differentRarity: { parentTypeChance: 60, sameRarityTypeChance: 0, middleRarityChance: 28, higherRarityChance: 12 },
  adjacentRarity: { parentTypeChance: 62, sameRarityTypeChance: 26, middleRarityChance: 0, higherRarityChance: 12 },
  compatScale: { min: 0.5, max: 1.5 },
};
// </admin:genetics>

export const BREEDING_RULES = {
  /** Compatibility 0..1 of a pair (shown as hearts; scales the one-tier-up chance). */
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

/** A special recipe: this unordered pair gives `result` with `weight` percent, before any random genetics. */
export interface Mutation {
  parents: readonly [BreedId, BreedId]; // unordered
  result: BreedId;
  /** Percent of the pair's odds (0 < weight ≤ 100); one pair's recipes together stay ≤ 100. */
  weight: number;
}

// <admin:mutations>
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
// </admin:mutations>
