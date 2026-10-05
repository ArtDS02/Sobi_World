// content/farm/breeding.json — breeding as data (DECISIONS U00-1 D4, PS-2, MU-1, AD-1). A pair's child
// is decided in layers, highest first: an active pair row IS the pair's odds; then the special recipes
// (mutations) take their percent; random genetics share the rest; the gene pool only shapes which
// species of a bucket comes out. Cross-field rules: engine/breedingOdds.ts geneticsIssues + the
// coverage check (every valid pair has a child).
import { z } from 'zod';
import { FAMILY_VALUES } from '../vocab';
import { breedId, nonNeg, percent, posInt, unit } from '../fields';

const buckets = z.strictObject({
  parentTypeChance: percent,
  sameRarityTypeChance: percent,
  middleRarityChance: percent,
  higherRarityChance: percent,
});

const pair = z.tuple([breedId, breedId]);

export const breedingFileSchema = z.strictObject({
  rules: z.strictObject({
    COMPAT: z.strictObject({
      base: unit,
      sameFamily: unit,
      perSharedTrait: unit,
      traitCap: posInt,
      perRarityGap: unit,
      recipe: unit,
    }),
    CHANCES_SHOWN: posInt,
    MAP_STRONG_PERCENT: percent,
    MAP_WEAK_PERCENT: percent,
  }),
  genetics: z.strictObject({
    sameRarity: buckets,
    differentRarity: buckets,
    adjacentRarity: buckets,
    compatScale: z.strictObject({ min: nonNeg, max: nonNeg }),
  }),
  mutations: z.array(z.strictObject({ parents: pair, result: breedId, weight: z.number().gt(0).max(100) })),
  pairs: z.array(
    z.strictObject({
      id: z.string().min(1),
      parents: pair,
      outcomes: z.array(z.strictObject({ breed: breedId, percent: percent })).min(1),
      active: z.boolean(),
      note: z.string().optional(),
    }),
  ),
  geneBonuses: z.strictObject({
    base: z.number().gt(0),
    sameTheme: nonNeg,
    relatedTheme: nonNeg,
    perGeneTag: nonNeg,
    geneTagCap: z.number().int().min(0),
  }),
  themeRelations: z.array(z.tuple([z.enum(FAMILY_VALUES), z.enum(FAMILY_VALUES)])),
});
