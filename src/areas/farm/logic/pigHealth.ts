// Pig needs & health (NH-1): the shared creature needs and disease lifecycle (systems/creature,
// systems/health) with the farm's numbers. Pure; the local day offset is injected.
import {
  dayStart,
  episodesOn,
  gameDay,
  onsetFields as creatureOnset,
  sickBlockedUntil as creatureBlockedUntil,
  type DiseaseState,
  type OnsetFields,
} from '../../../systems/health/disease';
import { needLevel as creatureNeedLevel, needRank, type NeedLevel } from '../../../systems/creature/needs';
import { BALANCE } from './config/balance';
import { NEED_LEVEL_MIN } from './config/care';
import type { Pig } from './types';

export { dayStart, episodesOn, gameDay, needRank, type DiseaseState };
export { diseaseState } from '../../../systems/health/disease';

/** Care level of a hunger / cleanliness value. */
export const needLevel = (value: number): NeedLevel => creatureNeedLevel(value, NEED_LEVEL_MIN);

/** Earliest epoch ms a new episode may start: after recovery and the day's episode budget. */
export const sickBlockedUntil = (pig: Pig, dayOffsetMs: number): number =>
  creatureBlockedUntil(pig, dayOffsetMs, BALANCE.SICK_MAX_EPISODES_PER_DAY);

/** Fields written when an episode starts at `at`. */
export const onsetFields = (pig: Pig, at: number, dayOffsetMs: number): OnsetFields =>
  creatureOnset(pig, at, dayOffsetMs);
