// Species traits (DECISIONS PS-2): visual / theme tags that steer breeding beyond rarity and
// family — two parents sharing traits are more compatible and favour children with those traits
// (Watermelon × Turtle → green / water pigs; Pegasus × Zeus → sky / light / myth pigs). A new
// species lists its traits in content/farm/species.json; one with none breeds on rarity and family
// alone. TUNABLE.
import { TRAIT_VALUES, type Trait } from '../../../../../content/schemas/vocab';
import { FARM_CONTENT } from './content';
import type { BreedId } from './ids';

export { TRAIT_VALUES, type Trait };

export const SPECIES_TRAITS: Partial<Record<BreedId, readonly Trait[]>> = Object.fromEntries(
  FARM_CONTENT.species.species.filter((s) => s.traits.length > 0).map((s) => [s.id, s.traits]),
);
