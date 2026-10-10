// content/shared/bond.json — Bond (GAME_BALANCE §3, spec V2 §7): five hearts a creature grows with the
// player. It rises when petted, fed its favourite food or nursed through an illness; it never falls.
import { z } from 'zod';
import { itemId, nonNeg, posInt } from '../fields';

export const bondFileSchema = z.strictObject({
  /** Bond runs 0..maxBond; one heart is `perHeart` of it (5 hearts in all). */
  maxBond: posInt,
  perHeart: posInt,
  /** Petting: bond gained, and how often a creature can be petted per game day. */
  pet: z.strictObject({ gain: nonNeg, perDay: posInt }),
  /** Its favourite food (one item of `favorites`, chosen per creature): hunger restored and bond gained. */
  favorite: z.strictObject({ gain: nonNeg, hunger: nonNeg }),
  /** Nursing a sick creature (giving the medicine). */
  care: z.strictObject({ gain: nonNeg }),
  /** Food that lifts mood for a while: mood points by item, for `hours` hours. */
  moodBoost: z.strictObject({ hours: posInt, byItem: z.partialRecord(itemId, nonNeg) }),
  favorites: z.array(itemId).min(1),
  /** A creature kept as a pet raises the mood of the whole pen by `perPet` each, up to `max`. */
  petPurpose: z.strictObject({ perPet: nonNeg, max: nonNeg }),
}).refine((f) => f.maxBond === f.perHeart * 5, 'maxBond must be five hearts (5 x perHeart)');
