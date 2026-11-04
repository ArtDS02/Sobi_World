// A ribbon of water, wind or vine (ANIM-006): a row of points whose heights follow a travelling sine, tallest at the head and low at
// the tail, each point lagging a little behind the one in front of it (inertia), so the ribbon flows instead of sliding as one piece.
// Pure: the battle scene (scene/battle/fxRibbon.ts) draws the points this returns.

/** At most this many points per ribbon and this many ribbons at once (performance budget, feedback §5). */
export const RIBBON_MAX_POINTS = 20;
export const RIBBON_MAX_LIVE = 3;

export interface RibbonSpec {
  /** Points along the ribbon (2..RIBBON_MAX_POINTS). */
  n: number;
  /** Height of the wave at the head (px). */
  amp: number;
  /** Waves along the ribbon. */
  freq: number;
  /** Travel of the wave (rad/s). */
  speed: number;
}

/** The share of the head's height the tail keeps (the head is tallest). */
export const TAIL_SHARE = 0.27;
/** How fast a point follows the one in front of it (1/s): the lag between neighbours is about 1/this. */
const FOLLOW = 18;

/** The height envelope at s ∈ [0, 1] along the ribbon, 0 at the tail and 1 at the head. */
export const envelope = (s: number) => TAIL_SHARE + (1 - TAIL_SHARE) * s;

/**
 * The offsets (px) of the points at `t` seconds; `state` holds the previous frame's (it is updated and returned), `dt` the seconds
 * since. A point moves towards its own target by the share of the lag that `dt` covers.
 */
export function ribbonStep(spec: RibbonSpec, t: number, state: number[], dt: number): number[] {
  const n = Math.max(2, Math.min(RIBBON_MAX_POINTS, spec.n));
  const k = 1 - Math.exp(-FOLLOW * Math.max(0, dt));
  for (let i = 0; i < n; i += 1) {
    const s = i / (n - 1);
    const target = Math.sin(s * spec.freq * Math.PI * 2 - t * spec.speed) * spec.amp * envelope(s);
    const prev = state[i];
    state[i] = prev === undefined ? target : prev + (target - prev) * k;
  }
  state.length = n;
  return state;
}
