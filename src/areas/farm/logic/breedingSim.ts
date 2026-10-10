// A what-if of the breeding station (GĐ7, admin "Mô phỏng lai"): N breedings of one pair with a seeded rng,
// through the same rules as the game (species odds, pity, trait inheritance, mutation). Pure; nothing is saved.
import { mulberry32 } from '../../../core/rng';
import { BREEDING_RULES_DEFAULT, nextPity, rollChildTraits, TRAITS, type BreedingRules, type ParentTraits } from '../../../systems/breeding';
import { breedingOutcomes } from './breedingOdds';
import { rollChild } from './breeding';
import { BREEDS } from './config/breeds';
import type { BreedId } from './config/ids';
import { isRareBreed } from './heredity';

export interface SimInput {
  a: BreedId;
  b: BreedId;
  samples: number;
  seed: number;
  /** Traits of the two parents (a hidden one counts as revealed when `hiddenRevealed`). */
  parentA?: ParentTraits;
  parentB?: ParentTraits;
  /** Start the run with this pity. */
  pity?: number;
  /** Pity carries from one breeding to the next, as in the game (false = every breeding starts at `pity`). */
  carryPity?: boolean;
  mutationBoost?: number;
  /** Swap the rules (a draft in the dashboard). */
  rules?: BreedingRules;
}

export interface SimCount {
  id: string;
  count: number;
  /** 0..100 of the samples. */
  percent: number;
}

export interface SimResult {
  samples: number;
  /** The species that came out, most often first. */
  species: SimCount[];
  /** Share of children of Rare+ species. */
  rarePercent: number;
  /** Share of births that mutated. */
  mutationPercent: number;
  /** How often each trait showed up (visible or hidden). */
  traits: SimCount[];
  /** Share of children holding a hidden trait. */
  hiddenPercent: number;
  /** Average number of traits per child. */
  averageTraits: number;
  /** Longest run of births without a Rare+ child while one was possible. */
  longestMiss: number;
  /** Highest pity reached. */
  maxPity: number;
  /** Whether the pair can give a Rare+ child at all. */
  couldBeRare: boolean;
}

const tally = (counts: Map<string, number>, samples: number): SimCount[] =>
  [...counts.entries()]
    .map(([id, count]) => ({ id, count, percent: (count * 100) / samples }))
    .sort((x, y) => y.count - x.count || (x.id < y.id ? -1 : 1));

export function simulateBreeding(input: SimInput): SimResult {
  const rules = input.rules ?? BREEDING_RULES_DEFAULT;
  const none: ParentTraits = { hiddenRevealed: false };
  const parents: [ParentTraits, ParentTraits] = [input.parentA ?? none, input.parentB ?? none];
  const rng = mulberry32(input.seed);
  const species = new Map<string, number>();
  const traits = new Map<string, number>();
  let rare = 0;
  let mutated = 0;
  let hidden = 0;
  let traitTotal = 0;
  let pity = input.pity ?? 0;
  let maxPity = pity;
  let miss = 0;
  let longestMiss = 0;
  const base = breedingOutcomes(input.a, input.b) ?? [];
  const possible = base.some((o) => o.weight > 0 && isRareBreed(o.breed));
  for (let i = 0; i < input.samples; i += 1) {
    const child = rollChild(rng, input.a, input.b, pity);
    species.set(child.breed, (species.get(child.breed) ?? 0) + 1);
    const gotRare = isRareBreed(child.breed);
    if (gotRare) rare += 1;
    const t = rollChildTraits(rng, parents, TRAITS, rules, { mutationBoost: input.mutationBoost ?? 0, signature: BREEDS[child.breed].signatureTrait });
    if (t.mutated) mutated += 1;
    if (t.hiddenTrait) hidden += 1;
    for (const id of [...t.traits, ...(t.hiddenTrait ? [t.hiddenTrait] : [])]) {
      traits.set(id, (traits.get(id) ?? 0) + 1);
      traitTotal += 1;
    }
    if (possible) {
      miss = gotRare ? 0 : miss + 1;
      longestMiss = Math.max(longestMiss, miss);
    }
    pity = input.carryPity === false ? (input.pity ?? 0) : nextPity(pity, rules, possible, gotRare);
    maxPity = Math.max(maxPity, pity);
  }
  const n = Math.max(1, input.samples);
  return {
    samples: input.samples,
    species: tally(species, n),
    rarePercent: (rare * 100) / n,
    mutationPercent: (mutated * 100) / n,
    traits: tally(traits, n),
    hiddenPercent: (hidden * 100) / n,
    averageTraits: traitTotal / n,
    longestMiss,
    maxPity,
    couldBeRare: possible,
  };
}
