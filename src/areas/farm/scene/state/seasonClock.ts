// The farm's season from the device calendar (SE-1): local month of the injected `now` (so dev time
// travel moves it too), or the admin / dev preview.
import type { SeasonId } from '../../../../core/config/seasons';
import { activeSeason } from '../../../../core/engine/season';

/** Local month 1–12 for an epoch-ms timestamp (device time zone). */
export const localMonth = (now: number) => new Date(now).getMonth() + 1;

/** The season the farm shows at `now` (preview first). */
export const farmSeason = (now: number, preview: SeasonId | null): SeasonId =>
  activeSeason(localMonth(now), preview);
