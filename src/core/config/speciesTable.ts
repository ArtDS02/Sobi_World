// Species rows (content/farm/species.json, written by the admin dashboard, DECISIONS A7-1), in file
// order (grouped by rarity). A missing stat = the rarity tier. Gene tags: speciesTraits.ts.
import type { SpeciesRow } from './breeds';
import { CONTENT } from './content';

export const SPECIES_ROWS: readonly SpeciesRow[] = CONTENT.species.species.map(
  ({ traits: _traits, ...row }) => row,
);
