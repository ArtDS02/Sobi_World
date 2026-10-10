// The farm's side of Bond and purpose (systems/bond, GAME_BALANCE §3): which food a pig loves, how much
// a pen of pets lifts the mood, and what a purpose allows. Derived, never stored.
import { BOND } from '../../../core/config/bond';
import type { ItemId } from '../../../core/config/ids';
import { favoriteOf } from '../../../systems/bond/bond';
import { BREEDS } from './config/breeds';
import type { FarmGame, Pig } from './types';

/** The species' own favourite when it has one (GĐ7), else one drawn from the Bond pool by the pig's id. */
export const pigFavorite = (pig: Pick<Pig, 'id' | 'breed'>): ItemId => BREEDS[pig.breed].favorite ?? (favoriteOf(pig.id, BOND) as ItemId);

/** Pigs kept as pets (not for sale, not for breeding). */
export const isPet = (pig: Pick<Pig, 'purpose'>): boolean => pig.purpose === 'PET';

/** Mood points the pets give every pig of the pen: `perPet` each, up to `max` (GAME_BALANCE, spec V2 §7). */
export const petBonus = (state: Pick<FarmGame, 'pigs'>): number =>
  Math.min(BOND.petPurpose.max, state.pigs.filter(isPet).length * BOND.petPurpose.perPet);
