// Breeding outcome and births (spec §6.5, §8.8, §8.9).
import { BALANCE } from '../config/balance';
import { breedingOutcomes, type BreedingOutcome } from './breedingOdds';
import { BREEDS } from '../config/breeds';
import type { BreedId, Gender } from '../config/ids';
import type { GameEvent } from '../events';
import { randomId, type Rng } from '../rng';
import type { Pig, SaveGame } from '../types';
import { advancePig } from './advancePig';
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

function lowestFreeSlot(pigs: readonly Pig[]): number {
  const used = new Set(pigs.map((p) => p.slotIndex));
  let i = 0;
  while (used.has(i)) i += 1;
  return i;
}

/** One birth (§8.9 steps 1–4) for a mother whose pregnancy has ended. */
function giveBirth(state: SaveGame, mother: Pig, now: number, rng: Rng) {
  const preg = mother.pregnancy!;
  const def = BREEDS[preg.childBreed];
  const newborn: Pig = {
    id: randomId(rng),
    slotIndex: lowestFreeSlot(state.pigs),
    breed: def.id,
    skinId: def.defaultSkin,
    cosmetics: {},
    name: pickPigName(rng, state.pigs),
    gender: preg.childGender,
    growthProgress: 0,
    hunger: BALANCE.HUNGER_MAX,
    cleanliness: BALANCE.CLEAN_MAX,
    isSick: false,
    pregnancy: null,
    lastTickedAt: preg.endsAt, // offline growth counts from the birth time
    createdAt: preg.endsAt,
  };
  const child = advancePig(newborn, now, rng);
  const born: SaveGame = {
    ...state,
    pigs: [...state.pigs.map((p) => (p.id === mother.id ? { ...p, pregnancy: null } : p)), child],
    breedingRecords: state.breedingRecords.map((r) =>
      r.motherId === mother.id && r.bornAt === null && r.at === preg.startedAt
        ? { ...r, bornAt: preg.endsAt }
        : r,
    ),
  };
  const found = discoverBreed(born, child.breed, { now, rng });
  const birth: GameEvent = {
    type: 'BIRTH',
    motherId: mother.id,
    childId: child.id,
    childBreed: child.breed,
  };
  return { state: found.state, events: [birth, ...found.events] };
}

/**
 * advanceWorld step 3: a birth for every pregnancy with endsAt <= now. Keyed by clearing
 * `pregnancy`, so a second run never duplicates a child (§8.9). Earliest due first.
 */
export function resolveBirths(
  state: SaveGame,
  now: number,
  rng: Rng,
): { state: SaveGame; events: GameEvent[] } {
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
