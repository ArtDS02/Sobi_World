// Fish breeding (spec V2 §8.3, "lai một số loài"): two fish of one breedable species, a male and a female, both fully
// grown and well fed, lay an egg. The child (gender, traits, family tree) is drawn now and kept on the egg, so it
// never changes; the egg hatches when its time comes and the tank has room (logic/simulate.ts).
import type { ErrorCode } from '../../../../core/config/errors';
import type { ItemId } from '../../../../core/config/ids';
import { ITEMS } from '../../../../core/config/items';
import { hashSeed, mulberry32, randomId } from '../../../../core/rng';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { BREEDING_RULES_DEFAULT, TRAITS, lineageFor, rollChildTraits, type ParentTraits } from '../../../../systems/breeding';
import { AB, FEED_ITEM, FISH, HOUR_MS } from '../config/content';
import { fishHearts, isGrown, isPet } from '../fishLife';
import type { AquariumState, Fish, FishEgg } from '../state';
import { mapFish, put, runAquarium, take, type AquariumResult } from './kit';

const parentTraits = (f: Fish): ParentTraits => ({ traits: f.traits, hiddenTrait: f.hiddenTrait, hiddenRevealed: fishHearts(f) >= 5 });
const source = (f: Fish) => ({ name: f.name, breed: f.breed, gender: f.gender, generation: f.generation, traits: f.traits, lineage: f.lineage });

/** The first rule a pair breaks (in the order the screen explains them), or null. */
export function pairError(a: AquariumState, x: Fish | undefined, y: Fish | undefined, now: number): ErrorCode | null {
  if (!x || !y || x.id === y.id) return 'NOT_A_PAIR';
  if (x.breed !== y.breed || x.gender === y.gender || !FISH[x.breed]?.breedable) return 'NOT_A_PAIR';
  if (isPet(x) || isPet(y)) return 'FISH_IS_PET';
  if (!isGrown(x) || !isGrown(y)) return 'FISH_NOT_MATURE';
  if (x.isSick || y.isSick) return 'FISH_IS_SICK';
  if (x.hunger < AB.breeding.minHunger || y.hunger < AB.breeding.minHunger) return 'FISH_TOO_HUNGRY';
  if ((x.breedReadyAt ?? 0) > now || (y.breedReadyAt ?? 0) > now) return 'FISH_RESTING';
  if (a.eggs.length >= AB.breeding.maxEggs) return 'TOO_MANY_EGGS';
  return null;
}

/** The mutation boost of a flower (or anything) the player adds to a breeding, in percentage points; null when it has none. */
export const boostOf = (itemId: string): number | null => {
  const boost = ITEMS[itemId as ItemId]?.mutationBoost ?? 0;
  return boost > 0 ? boost : null;
};

/** `boostItem`: an item with a `mutationBoost` (a rare flower) used up to raise the mutation chance of this egg. */
export function breedFish(world: WorldSave, args: { fishAId: string; fishBId: string; boostItem?: string }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const x = a.fish.find((f) => f.id === args.fishAId);
    const y = a.fish.find((f) => f.id === args.fishBId);
    const error = pairError(a, x, y, ctx.now);
    if (error || !x || !y) return { ok: false, error: error ?? 'NOT_A_PAIR' };
    const mother = x.gender === 'FEMALE' ? x : y;
    const father = mother === x ? y : x;
    const boost = args.boostItem === undefined ? 0 : boostOf(args.boostItem);
    if (boost === null) return { ok: false, error: 'INVALID_REQUEST' };
    const fed = take(w, FEED_ITEM, AB.breeding.feed);
    if (!fed.ok) return fed;
    const taken = args.boostItem === undefined ? fed : take(fed.world, args.boostItem, 1);
    if (!taken.ok) return taken;
    // The draw is seeded by the pair and the time, so it never consumes the shared rng stream.
    const rng = mulberry32(hashSeed('fish-traits', mother.id, father.id, ctx.now));
    const traits = rollChildTraits(rng, [parentTraits(mother), parentTraits(father)], TRAITS, BREEDING_RULES_DEFAULT, { mutationBoost: boost });
    const egg: FishEgg = {
      id: randomId(ctx.rng),
      species: mother.breed,
      startedAt: ctx.now,
      hatchAt: ctx.now + AB.breeding.eggHours * HOUR_MS,
      gender: ctx.rng.next() < 0.5 ? 'MALE' : 'FEMALE',
      generation: Math.max(mother.generation ?? 1, father.generation ?? 1) + 1,
      traits: traits.traits,
      ...(traits.hiddenTrait ? { hiddenTrait: traits.hiddenTrait } : {}),
      ...(traits.mutated ? { mutated: true } : {}),
      lineage: lineageFor(source(mother), source(father), BREEDING_RULES_DEFAULT.lineageDepth),
    };
    const rest = ctx.now + AB.breeding.cooldownHours * HOUR_MS;
    let tank: AquariumState = { ...a, eggs: [...a.eggs, egg] };
    tank = mapFish(mapFish(tank, mother.id, (f) => ({ ...f, breedReadyAt: rest })), father.id, (f) => ({ ...f, breedReadyAt: rest }));
    return {
      ok: true,
      world: put(taken.world, tank),
      events: [{ type: 'AQUARIUM_EGGS_LAID', speciesId: egg.species, eggId: egg.id, mutated: traits.mutated, ...(args.boostItem === undefined ? {} : { boostItem: args.boostItem }) }],
      xp: AB.xp.breed,
    };
  });
}
