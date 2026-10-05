// Creature health (spec §7, DECISIONS 002/004): the disease lifecycle Healthy → Ill (until treated)
// → Recovering → Healthy, with a per-day episode limit (NH-1). Critical and death are the frame of
// GĐ2: their delays are null (off) until the Sobi World health rules are switched on. Pure; the local
// day offset is injected (core never reads the time zone).
import type { Creature } from '../creature/types';

const DAY_MS = 86_400_000;

export type DiseaseState = 'healthy' | 'ill' | 'recovering';
/** The full health picture: GĐ2 adds critical (warning) and dead. */
export type HealthStage = DiseaseState | 'critical' | 'dead';

export interface HealthRules {
  /** Ill this long → critical (GAME_BALANCE §2.4: 48 h); null = never. */
  criticalAfterMs: number | null;
  /** Ill this long → dead (72 h); null = never (Sobi Farm D21, kept in GĐ1). */
  deathAfterMs: number | null;
}

/** Game day number: local calendar day; `dayOffsetMs` = local time minus UTC. */
export const gameDay = (at: number, dayOffsetMs: number): number => Math.floor((at + dayOffsetMs) / DAY_MS);

/** Epoch ms at which game day `day` starts. */
export const dayStart = (day: number, dayOffsetMs: number): number => day * DAY_MS - dayOffsetMs;

/** Ill until treated; Recovering until `recoveringUntil`; else Healthy. */
export function diseaseState(c: Creature, at: number): DiseaseState {
  if (c.isSick) return 'ill';
  return (c.recoveringUntil ?? 0) > at ? 'recovering' : 'healthy';
}

/** Disease state, or critical / dead once an illness has lasted the rules' delays. */
export function healthStage(c: Creature, at: number, rules: HealthRules): HealthStage {
  const state = diseaseState(c, at);
  if (state !== 'ill' || c.lastSickAt === undefined) return state;
  const ill = at - c.lastSickAt;
  if (rules.deathAfterMs !== null && ill >= rules.deathAfterMs) return 'dead';
  if (rules.criticalAfterMs !== null && ill >= rules.criticalAfterMs) return 'critical';
  return 'ill';
}

/** Episodes started on game day `day` (the counter resets by itself on a new day). */
export const episodesOn = (c: Creature, day: number): number => (c.sickDay === day ? (c.sickEpisodes ?? 0) : 0);

/**
 * Earliest epoch ms a new episode may start: after recovery, and after the day whose episode budget
 * (`maxPerDay`) is used up.
 */
export function sickBlockedUntil(c: Creature, dayOffsetMs: number, maxPerDay: number): number {
  let until = c.recoveringUntil ?? 0;
  if (c.sickDay !== undefined && (c.sickEpisodes ?? 0) >= maxPerDay) {
    until = Math.max(until, dayStart(c.sickDay + 1, dayOffsetMs));
  }
  return until;
}

/** The health fields an episode start writes. */
export type OnsetFields = Required<Pick<Creature, 'isSick' | 'lastSickAt' | 'sickDay' | 'sickEpisodes'>>;

/** Fields written when an episode starts at `at`. */
export function onsetFields(c: Creature, at: number, dayOffsetMs: number): OnsetFields {
  const day = gameDay(at, dayOffsetMs);
  return { isSick: true, lastSickAt: at, sickDay: day, sickEpisodes: episodesOn(c, day) + 1 };
}
