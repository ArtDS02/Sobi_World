// Gene pool (DECISIONS MU-1): what a species carries into breeding besides its rarity. Today it only
// shapes WHICH species of a random-genetics bucket comes out (never the bucket odds, never a
// requirement): theme = the species' family, gene tags = its traits (speciesTraits.ts).
// Extension point for later genetics (parent traits, dominant / recessive, mutation): see
// engine/genePool.ts `GeneticsContext`. Every number is TUNABLE; 0 turns a bonus off.
import type { Family } from './breeds';

export interface GeneBonuses {
  /** Weight every candidate starts with (the discovery tail; must be > 0). */
  base: number;
  /** Candidate shares a parent's theme. */
  sameTheme: number;
  /** Candidate's theme is related to a parent's (THEME_RELATIONS): a bonus, never a guarantee. */
  relatedTheme: number;
  /** Per gene tag shared with the parents, counted up to geneTagCap. */
  perGeneTag: number;
  geneTagCap: number;
}

// <admin:geneBonuses>
export const GENE_BONUSES: GeneBonuses = { base: 1, sameTheme: 8, relatedTheme: 3, perGeneTag: 4, geneTagCap: 3 };
// </admin:geneBonuses>

/** Related themes (unordered pairs): a candidate of a related theme gets `relatedTheme` extra weight. */
// <admin:themeRelations>
export const THEME_RELATIONS: readonly (readonly [Family, Family])[] = [
  ['FARM', 'MEADOW'],
  ['MEADOW', 'WILD'],
  ['WILD', 'WATER'],
  ['HERO', 'ADVENTURE'],
  ['MYTHIC', 'FANTASY'],
  ['SCIFI', 'JOB'],
  ['HORROR', 'FANTASY'],
  ['FOOD', 'FARM'],
  ['FUNNY', 'FOOD'],
  ['VIETNAM', 'FARM'],
];
// </admin:themeRelations>
