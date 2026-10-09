// Local calendar day number for the daily reward (DECISIONS PG-2). Core never reads the time zone;
// the UI turns `now` into "days since epoch in the player's local time" and passes it to claimDaily.
const DAY_MS = 86_400_000;

/** Local time minus UTC at `at`, the day offset the core takes (same as the runtime clock's). */
export const localOffsetMs = (at: number): number => -new Date(at).getTimezoneOffset() * 60_000;

export function localDay(now: number): number {
  const offsetMs = new Date(now).getTimezoneOffset() * 60_000;
  return Math.floor((now - offsetMs) / DAY_MS);
}
