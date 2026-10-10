// The farm's side of advanced breeding (GĐ7, systems/breeding): traits and family tree of a pig, pity and
// the Rare+ rule, and how a birth draws its child's traits. Derived values are never stored.
import { BOND } from '../../../core/config/bond';
import { heartsOf } from '../../../systems/bond/bond';
import { hashSeed, mulberry32 } from '../../../core/rng';
import { rarityRank } from '../../../core/config/rarity';
import {
  BREEDING_RULES_DEFAULT,
  TRAITS,
  knownTraits,
  lineageFor,
  rollChildTraits,
  traitMultiplier,
  type ChildTraits,
  type Heredity,
  type ParentTraits,
} from '../../../systems/breeding';
import { BREEDS } from './config/breeds';
import type { BreedId } from './config/ids';
import type { GameEvent } from './events';
import type { Pig, NurseryPig } from './types';

/** Whole hearts of a pig's Bond. */
export const pigHearts = (pig: Pick<Pig, 'bond'>): number => heartsOf(pig.bond, BOND);

/** A parent for inheritance: its traits and whether its hidden one is open. */
export const parentTraits = (pig: Pig): ParentTraits => ({
  traits: pig.traits,
  hiddenTrait: pig.hiddenTrait,
  hiddenRevealed: pigHearts(pig) >= 5,
});

/** The pig's traits the player can see and that take effect (hidden one from 5 hearts). */
export const pigKnownTraits = (pig: Pig): string[] => knownTraits(pig, pigHearts(pig));

/** Multiplier of one trait effect on this pig: 1 when it has none. */
export const pigTraitFactor = (pig: Heredity & Pick<Pig, 'bond'>, effect: 'growth' | 'sellValue' | 'bondGain'): number =>
  traitMultiplier(TRAITS, pig, pigHearts(pig), effect);

/** A Bond gain scaled by the pig's `bondGain` traits, in whole points. */
export const bondGainFor = (pig: Heredity & Pick<Pig, 'bond'>, gain: number): number => Math.round(gain * pigTraitFactor(pig, 'bondGain'));

/** Species of this rarity or above count as "Rare+" for pity. */
export const isRareBreed = (breed: BreedId): boolean =>
  rarityRank(BREEDS[breed].rarity) >= rarityRank(BREEDING_RULES_DEFAULT.pity.fromRarity);

/** The hidden trait opens when Bond reaches 5 hearts: the event for a pig whose bond just crossed that line. */
export function revealEvents(before: Pig, after: Pig): GameEvent[] {
  if (!after.hiddenTrait || pigHearts(before) >= 5 || pigHearts(after) < 5) return [];
  return [{ type: 'PIG_TRAIT_REVEALED', pigId: after.id, traitId: after.hiddenTrait }];
}

/** Whether the pig holds a trait it has not shown yet (a hidden trait still closed). */
export const hasClosedTrait = (pig: Heredity & Pick<Pig, 'bond'>): boolean => !!pig.hiddenTrait && pigHearts(pig) < 5;

export interface BornHeredity extends ChildTraits {
  lineage: ReturnType<typeof lineageFor>;
}

/**
 * Traits and family tree of the child of `mother` and `father`, drawn when the breeding starts. The rng is
 * derived from the pair and the start time, so the draw never consumes the shared stream (a seed always gives
 * the same child, whatever else the game rolls).
 */
export function bornHeredity(mother: Pig, father: Pig, childBreed: BreedId, startedAt: number, mutationBoost = 0): BornHeredity {
  const rng = mulberry32(hashSeed('traits', mother.id, father.id, startedAt));
  const traits = rollChildTraits(rng, [parentTraits(mother), parentTraits(father)], TRAITS, BREEDING_RULES_DEFAULT, {
    mutationBoost,
    signature: BREEDS[childBreed].signatureTrait,
  });
  const source = (p: Pig) => ({
    name: p.name,
    breed: p.breed,
    gender: p.gender,
    generation: p.generation,
    traits: p.traits,
    lineage: p.lineage,
  });
  return { ...traits, lineage: lineageFor(source(mother), source(father), BREEDING_RULES_DEFAULT.lineageDepth) };
}

/** What a newborn or a raised pig carries over from the pregnancy. */
export const heredityFields = (
  from: Pick<NurseryPig, 'traits' | 'hiddenTrait' | 'lineage'>,
): Pick<Pig, 'traits' | 'hiddenTrait' | 'lineage'> => ({
  ...(from.traits ? { traits: from.traits } : {}),
  ...(from.hiddenTrait ? { hiddenTrait: from.hiddenTrait } : {}),
  ...(from.lineage ? { lineage: from.lineage } : {}),
});
