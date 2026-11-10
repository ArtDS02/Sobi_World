// Automatic plot skin (decision 057, B7), pure: a cloud tier / garden zone can be set to change its look by the time of day or by
// the season. Presentation only: the skin the player assigned stays in the save untouched, and what the scene shows is worked out
// here from the moment, the content table (content/shared/plotSkins.json `auto`) and the skins the player owns.
import { DAY_NIGHT, type DayPhase } from '../config/dayNight';
import { PLOT_SKIN_RULES } from '../config/plotSkins';
import type { SeasonId } from '../config/seasons';
import { MINUTES_PER_DAY, phaseAt } from '../engine/dayNight';
import { seasonOfMonth } from '../engine/season';

export const SKIN_AUTO_MODES = ['time', 'season'] as const;
export type SkinAutoMode = (typeof SKIN_AUTO_MODES)[number];

export const isSkinAutoMode = (v: unknown): v is SkinAutoMode => (SKIN_AUTO_MODES as readonly unknown[]).includes(v);

/** Per moment, the skins wished for, best first. */
export interface SkinAutoRules {
  time: Readonly<Record<DayPhase, readonly string[]>>;
  season: Readonly<Record<SeasonId, readonly string[]>>;
}

export const SKIN_AUTO_RULES: SkinAutoRules = PLOT_SKIN_RULES.auto;

/** What the automatic skin follows: the phase of the player's local day and the season of the local month. */
export interface SkinMoment {
  phase: DayPhase;
  season: SeasonId;
}

const MINUTE_MS = 60_000;

/** The moment at `now` for a player whose local time is UTC + `dayOffsetMs` (the same clock as the day's light and the farm's seasons). */
export function skinMoment(now: number, dayOffsetMs: number): SkinMoment {
  const local = now + dayOffsetMs;
  const minute = ((Math.floor(local / MINUTE_MS) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return { phase: phaseAt(minute, DAY_NIGHT), season: seasonOfMonth(new Date(local).getUTCMonth() + 1) };
}

/** The automatic mode of group `group` in a sparse list; null = off. */
export const autoOfGroup = (modes: readonly (SkinAutoMode | null)[] | undefined, group: number): SkinAutoMode | null => modes?.[group] ?? null;

/** The list with group `group` set to `mode` (null = off), padded with null. */
export function withAuto(modes: readonly (SkinAutoMode | null)[] | undefined, group: number, mode: SkinAutoMode | null): (SkinAutoMode | null)[] {
  const next = [...(modes ?? [])];
  while (next.length <= group) next.push(null);
  next[group] = mode;
  return next;
}

/** The skin the moment wishes for that the player owns; null when the list is empty or none of it is owned. */
export function autoPick(mode: SkinAutoMode, moment: SkinMoment, owned: readonly string[], rules: SkinAutoRules = SKIN_AUTO_RULES): string | null {
  const wishes = mode === 'time' ? rules.time[moment.phase] : rules.season[moment.season];
  return wishes.find((id) => owned.includes(id)) ?? null;
}

/** The skin a group shows: its assigned one, or with an automatic mode the moment's pick (the assigned one when there is no pick). */
export function shownSkin(assigned: string | null, mode: SkinAutoMode | null, moment: SkinMoment, owned: readonly string[], rules: SkinAutoRules = SKIN_AUTO_RULES): string | null {
  return mode ? (autoPick(mode, moment, owned, rules) ?? assigned) : assigned;
}

/** The skin each of `count` groups shows now. */
export function shownSkins(
  skins: readonly (string | null)[] | undefined,
  modes: readonly (SkinAutoMode | null)[] | undefined,
  count: number,
  moment: SkinMoment,
  owned: readonly string[],
  rules: SkinAutoRules = SKIN_AUTO_RULES,
): (string | null)[] {
  return Array.from({ length: count }, (_, group) => shownSkin(skins?.[group] ?? null, autoOfGroup(modes, group), moment, owned, rules));
}
