// Slices of simulated time (ARCHITECTURE §6): the world is simulated in slices of at most one step
// (1 minute while the game runs, 10 minutes catching up). Slice edges lie on a grid of the *local*
// time, so the starts of the periods of the day (whole hours) are always slice edges, whatever the
// step or the time zone: a 1-minute run and a 10-minute run see the same night start. Pure.

/** Slice end times after `from`, up to and including `to`. Empty when `to <= from`. */
export function sliceEnds(from: number, to: number, dayOffsetMs: number, stepMs: number): number[] {
  const ends: number[] = [];
  let t = from;
  while (t < to) {
    const next = Math.floor((t + dayOffsetMs) / stepMs) * stepMs + stepMs - dayOffsetMs; // next grid line after t
    t = Math.min(next, to);
    ends.push(t);
  }
  return ends;
}
