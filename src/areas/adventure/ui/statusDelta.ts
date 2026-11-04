// What changed in the statuses of a unit between two frames (ANIM-003). The battle log has no "expired" event, so the stage compares
// the statuses it saw last frame with the ones it sees now: an id that is gone has expired (or was cleansed or broken), so its
// `expire` script plays once. A unit seen for the first time (a reload, a new battle) or knocked out has no delta, so no false expiry
// plays. Presentation only. Pure.

export interface StatusDelta {
  /** Statuses that were on the unit last frame and are not now. */
  removed: string[];
  /** Statuses on the unit now that were not last frame. */
  added: string[];
}

const NONE: StatusDelta = { removed: [], added: [] };

/** `prev` is null when the unit was not seen before; a unit that is down keeps no delta (its layers are dropped, not "expired"). */
export function statusDelta(prev: ReadonlySet<string> | null, next: readonly string[], down: boolean): StatusDelta {
  if (prev === null || down) return NONE;
  const now = new Set(next);
  return {
    removed: [...prev].filter((s) => !now.has(s)),
    added: next.filter((s) => !prev.has(s)),
  };
}
