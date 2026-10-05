// Breeding as data (DECISIONS U00-1 D4, PS-2, MU-1). A pair's child is decided in layers, highest
// priority first — a lower layer never overrides a higher one:
//   1. the admin pair table (breedingPairs.ts, AD-1): an active row IS the pair's whole odds;
//   2. SPECIAL RECIPES (MUTATIONS): a named result takes its percent of the pair's odds first;
//   3. RANDOM GENETICS (GENETICS): the rest, so every valid pair has a child — parent species
//      first, then other species of the same / middle rarity, then one tier up at most.
// Inside a bucket the gene pool (genePool.ts: theme + gene tags) only shapes which species of that
// bucket comes out. Adding a species needs no row here. Every number is TUNABLE, in
// content/farm/breeding.json (admin dashboard → Phối giống).
import { CONTENT } from './content';
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

export const GENETICS: GeneticsRules = CONTENT.breeding.genetics;

/**
 * COMPAT: compatibility 0..1 of a pair (shown as hearts; scales the one-tier-up chance): base, same
 * family, per shared trait (up to traitCap), minus per rarity gap, plus `recipe` for a MUTATIONS pair.
 * CHANCES_SHOWN: breed dialog lines before the rest are summed. MAP_STRONG / MAP_WEAK_PERCENT: the
 * admin breed map (DECISIONS BR-2) places a species after its parents from these route odds.
 */
export const BREEDING_RULES = CONTENT.breeding.rules;

/** A special recipe: this unordered pair gives `result` with `weight` percent, before any random genetics. */
export interface Mutation {
  parents: readonly [BreedId, BreedId]; // unordered
  result: BreedId;
  /** Percent of the pair's odds (0 < weight ≤ 100); one pair's recipes together stay ≤ 100. */
  weight: number;
}

export const MUTATIONS: readonly Mutation[] = CONTENT.breeding.mutations;
