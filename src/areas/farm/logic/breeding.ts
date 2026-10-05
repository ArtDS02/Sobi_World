// Breeding outcome and births (spec §6.5, §8.8, §8.9).
import { breedingOutcomes, type BreedingOutcome } from './breedingOdds';
import { BREEDS } from '../../../core/config/breeds';
import type { BreedId, Gender } from '../../../core/config/ids';
import type { GameEvent } from './events';
import { mulberry32, randomId, type Rng } from '../../../core/rng';
import type { NurseryPig, Pig, FarmGame } from './types';
import { discoverBreed } from './collection';
import { pickPigName } from './pigNames';

/** Weighted pick over relative weights. rng.next() in [0, 1). */
export function weightedPick(rng: Rng, outcomes: readonly BreedingOutcome[]): BreedId {
  const total = outcomes.reduce((sum, o) => sum + o.weight, 0);
  let roll = rng.next() * total;
  for (const o of outcomes) {
    roll -= o.weight;
    if (roll < 0) return o.breed;
  }
  return outcomes[outcomes.length - 1]!.breed;
}

/** Child breed (weighted, matrix) then gender (50/50), in that rng order. */
export function rollChild(rng: Rng, a: BreedId, b: BreedId): { breed: BreedId; gender: Gender } {
  const outcomes = breedingOutcomes(a, b);
  if (!outcomes) throw new Error(`no breeding outcomes for ${a} x ${b}`);
  const breed = weightedPick(rng, outcomes);
  const gender: Gender = rng.next() < 0.5 ? 'MALE' : 'FEMALE';
  return { breed, gender };
}

/**
 * rollChild under a fixed seed (DECISIONS MU-1): the same pair and seed always give the same child —
 * for bug reproduction, tests and deterministic simulation. Never shown to the player.
 */
export const rollChildSeeded = (seed: number, a: BreedId, b: BreedId) => rollChild(mulberry32(seed), a, b);

/** The pen slot a new farm pig takes: the lowest index no pig uses. */
export function lowestFreeSlot(pigs: readonly Pig[]): number {
  const used = new Set(pigs.map((p) => p.slotIndex));
  let i = 0;
  while (used.has(i)) i += 1;
  return i;
}

/**
 * One birth (§8.9 steps 1–4) for a mother whose pregnancy has ended. BR-1: the newborn is its own
 * pig instance with its genealogy, put in the inventory nursery — never straight onto the farm.
 */
function giveBirth(state: FarmGame, mother: Pig, now: number, rng: Rng) {
  const preg = mother.pregnancy!;
  const father = state.pigs.find((p) => p.id === preg.fatherId);
  const record = state.breedingRecords.find(
    (r) => r.motherId === mother.id && r.bornAt === null && r.at === preg.startedAt,
  );
  const newborn: NurseryPig = {
    id: randomId(rng),
    breed: BREEDS[preg.childBreed].id,
    name: pickPigName(rng, [...state.pigs, ...state.nursery]),
    gender: preg.childGender,
    generation: preg.childGeneration ?? 2,
    bornAt: preg.endsAt,
    parents: {
      motherId: mother.id,
      fatherId: preg.fatherId,
      motherBreed: mother.breed,
      // The father may be sold before the birth: the breeding record still knows his species.
      fatherBreed: father?.breed ?? record?.fatherBreed ?? mother.breed,
    },
  };
  const born: FarmGame = {
    ...state,
    pigs: state.pigs.map((p) => (p.id === mother.id ? { ...p, pregnancy: null } : p)),
    nursery: [...state.nursery, newborn],
    breedingRecords: state.breedingRecords.map((r) =>
      r === record ? { ...r, bornAt: preg.endsAt } : r,
    ),
  };
  const found = discoverBreed(born, newborn.breed, { now, rng });
  const birth: GameEvent = {
    type: 'BIRTH',
    motherId: mother.id,
    childId: newborn.id,
    childBreed: newborn.breed,
  };
  return { state: found.state, events: [birth, ...found.events] };
}

/**
 * advanceWorld step 3: a birth for every pregnancy with endsAt <= now. Keyed by clearing
 * `pregnancy`, so a second run never duplicates a child (§8.9). Earliest due first.
 */
export function resolveBirths(
  state: FarmGame,
  now: number,
  rng: Rng,
): { state: FarmGame; events: GameEvent[] } {
  const due = state.pigs
    .filter((p) => p.pregnancy !== null && now >= p.pregnancy.endsAt)
    .sort((a, b) => a.pregnancy!.endsAt - b.pregnancy!.endsAt);
  let next = state;
  const events: GameEvent[] = [];
  for (const mother of due) {
    const r = giveBirth(next, mother, now, rng);
    next = r.state;
    events.push(...r.events);
  }
  return { state: next, events };
}
