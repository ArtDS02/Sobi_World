// Pig needs & health rules (NH-1): care levels, game day, disease lifecycle. Pure; the local
// day offset is injected (core never reads the time zone).
import { BALANCE } from './config/balance';
import { NEED_LEVEL_MIN, NEED_LEVELS, type NeedLevel } from './config/care';
import type { Pig } from './types';

const DAY_MS = 86_400_000;

export type DiseaseState = 'healthy' | 'ill' | 'recovering';

/** Care level of a hunger / cleanliness value. */
export function needLevel(value: number): NeedLevel {
  return NEED_LEVELS.find((l) => value >= NEED_LEVEL_MIN[l]) ?? 'critical';
}

/** 0 = best. */
export const needRank = (level: NeedLevel): number => NEED_LEVELS.indexOf(level);

/** Game day number: local calendar day; `dayOffsetMs` = local time minus UTC. */
export const gameDay = (at: number, dayOffsetMs: number): number =>
  Math.floor((at + dayOffsetMs) / DAY_MS);

/** Epoch ms at which game day `day` starts. */
export const dayStart = (day: number, dayOffsetMs: number): number => day * DAY_MS - dayOffsetMs;

/** Ill until treated; Recovering until `recoveringUntil`; else Healthy. */
export function diseaseState(pig: Pig, at: number): DiseaseState {
  if (pig.isSick) return 'ill';
  return (pig.recoveringUntil ?? 0) > at ? 'recovering' : 'healthy';
}

/** Episodes started on game day `day` (the counter resets by itself on a new day). */
export function episodesOn(pig: Pig, day: number): number {
  return pig.sickDay === day ? (pig.sickEpisodes ?? 0) : 0;
}

/**
 * Earliest epoch ms a new disease episode may start: after recovery, and after the day whose
 * episode budget is used up.
 */
export function sickBlockedUntil(pig: Pig, dayOffsetMs: number): number {
  let until = pig.recoveringUntil ?? 0;
  if (pig.sickDay !== undefined && (pig.sickEpisodes ?? 0) >= BALANCE.SICK_MAX_EPISODES_PER_DAY) {
    until = Math.max(until, dayStart(pig.sickDay + 1, dayOffsetMs));
  }
  return until;
}

/** Fields written when an episode starts at `at`. */
export function onsetFields(pig: Pig, at: number, dayOffsetMs: number): Partial<Pig> {
  const day = gameDay(at, dayOffsetMs);
  return { isSick: true, lastSickAt: at, sickDay: day, sickEpisodes: episodesOn(pig, day) + 1 };
}
