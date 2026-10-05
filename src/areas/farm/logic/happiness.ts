// Happiness (spec §5.4, D18): the shared care mood (systems/creature) with the farm's weights.
// Derived, never stored.
import { careMood, type MoodRules } from '../../../systems/creature/mood';
import { BALANCE } from './config/balance';
import type { Pig } from './types';

const MOOD: MoodRules = {
  cleanWeight: BALANCE.HAPPY_CLEAN_WEIGHT,
  hungerWeight: BALANCE.HAPPY_HUNGER_WEIGHT,
  sickPenalty: BALANCE.HAPPY_SICK_PENALTY,
};

/** `decorBonus`: the farm's decoration bonus (§5.4 reserved term, decor.ts). */
export const happiness = (pig: Pick<Pig, 'cleanliness' | 'hunger' | 'isSick'>, decorBonus = 0): number =>
  careMood(pig, MOOD, decorBonus);
