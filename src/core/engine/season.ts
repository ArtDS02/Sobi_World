// Farm seasons (SE task): the season of a local calendar month and the manifest file key of a
// seasonal variant. Pure: callers pass the month (1–12), never a clock.
import { SEASON_BY_MONTH, SEASON_IDS, type SeasonId } from '../config/seasons';

/** Registry file keys of seasonal variants: `season_spring`, `season_winter`, … */
export const SEASON_FILE_PREFIX = 'season_';

export const seasonFile = (season: SeasonId): string => `${SEASON_FILE_PREFIX}${season}`;

export const isSeasonFile = (file: string): boolean => file.startsWith(SEASON_FILE_PREFIX);

/** Local month 1–12 → season; an out-of-range month falls back to summer (the default look). */
export const seasonOfMonth = (month: number): SeasonId => SEASON_BY_MONTH[month] ?? 'summer';

/** The previewed season when one is set, else the calendar's. */
export const activeSeason = (month: number, preview: SeasonId | null): SeasonId =>
  preview ?? seasonOfMonth(month);

export const parseSeason = (v: string | null | undefined): SeasonId | null =>
  (SEASON_IDS as readonly string[]).includes(v ?? '') ? (v as SeasonId) : null;
