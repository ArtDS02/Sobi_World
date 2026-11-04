// The feel of walking on the map (ANIM-090..093): the party speeds up and slows down instead of jumping between standing and full
// speed, the legs keep up with the ground, the body bobs with each step, the face does not flicker on a diagonal, and the followers
// bob in step with the leader. Pure maths; walker.ts (Phaser) draws it. Presentation only: collisions stay in systems/character.

/** Time constants (ms) of the speed easing: speeding up takes ~120ms to get most of the way, stopping ~90ms. */
export const ACCEL_TAU_MS = 70;
export const DECEL_TAU_MS = 55;
/** Below this share of full speed the party counts as standing. */
export const STILL_BELOW = 0.04;
/** Walking pixels covered by one frame of the 4-frame cycle (one step = two frames): with 260 px/s ≈ 8.7 fps. */
export const FRAME_STRIDE_PX = 30;
export const FPS_MIN = 5;
export const FPS_MAX = 14;
/** The body rises by this many px at the top of a step, squashes by this share when a foot lands. */
export const BOB_PX = 5;
export const SQUASH_SHARE = 0.04;
/** A diagonal must keep pointing at another face for this long before the face turns (ms). */
export const FACING_HOLD_MS = 120;
/** After stopping, the body settles for this long (ms). */
export const SETTLE_MS = 90;
/** Followers fade their bob in and out over this tau (ms) and breathe while standing. */
export const FOLLOWER_EASE_MS = 120;
export const BREATH_PERIOD_MS = 2200;
export const BREATH_SHARE = 0.02;
/** Each follower is this far behind the one before in the step phase (steps). */
export const FOLLOWER_PHASE_LAG = 0.3;

export interface Vec2 {
  x: number;
  y: number;
}

/** Eases `v` (a velocity as a share of full speed, any direction) towards `target`: faster to start than to stop. */
export function approachVelocity(v: Vec2, target: Vec2, dtMs: number): Vec2 {
  if (dtMs <= 0) return v;
  const stopping = target.x === 0 && target.y === 0;
  const k = 1 - Math.exp(-dtMs / (stopping ? DECEL_TAU_MS : ACCEL_TAU_MS));
  const out = { x: v.x + (target.x - v.x) * k, y: v.y + (target.y - v.y) * k };
  return Math.hypot(out.x, out.y) < STILL_BELOW && stopping ? { x: 0, y: 0 } : out;
}

/** The asked direction as a vector of at most unit length (a diagonal is not faster). */
export function unitOf(dir: Vec2): Vec2 {
  const len = Math.hypot(dir.x, dir.y);
  return len === 0 ? { x: 0, y: 0 } : { x: dir.x / len, y: dir.y / len };
}

/** Frames of the walking cycle per second for a speed in px/s: slower walking steps slower, so the feet match the ground. */
export function frameRate(speedPx: number): number {
  return Math.min(FPS_MAX, Math.max(FPS_MIN, speedPx / FRAME_STRIDE_PX));
}

/** 0 when a foot is down, 1 at the top of the step; `steps` counts steps (two frames each). */
export function stepLift(steps: number): number {
  return Math.abs(Math.sin(steps * Math.PI));
}

export interface BodyBob {
  /** Raise the body by this many px. */
  lift: number;
  /** Vertical scale (squash when a foot lands). */
  sy: number;
  /** Rotation in degrees (sway), alternating with each step. */
  rot: number;
}

/** The leader's body for the step phase; walking up or down sways more (it has no side view of the legs). */
export function leaderBob(steps: number, vertical: boolean): BodyBob {
  const lift = stepLift(steps);
  return { lift: lift * BOB_PX, sy: 1 - SQUASH_SHARE * (1 - lift), rot: Math.sin(steps * Math.PI) * (vertical ? 3 : 1.5) };
}

export type Face = 'up' | 'down' | 'left' | 'right';

export interface FaceState {
  shown: Face;
  pending: Face | null;
  pendingMs: number;
}

/**
 * The face to show for the asked direction. A straight move turns the face at once; on a diagonal the axis with the larger part wins,
 * but only after it has held for FACING_HOLD_MS, so the face does not flicker when the two parts are close.
 */
export function pickFace(dir: Vec2, st: FaceState, dtMs: number): FaceState {
  if (dir.x === 0 && dir.y === 0) return st;
  const ax = Math.abs(dir.x);
  const ay = Math.abs(dir.y);
  const horizontal: Face = dir.x > 0 ? 'right' : 'left';
  const vertical: Face = dir.y > 0 ? 'down' : 'up';
  const want: Face = ay === 0 ? horizontal : ax === 0 ? vertical : ax > ay * 1.15 ? horizontal : ay > ax * 1.15 ? vertical : st.shown === horizontal || st.shown === vertical ? st.shown : horizontal;
  if (want === st.shown) return { shown: st.shown, pending: null, pendingMs: 0 };
  if (ax === 0 || ay === 0) return { shown: want, pending: null, pendingMs: 0 };
  const held = st.pending === want ? st.pendingMs + dtMs : dtMs;
  return held >= FACING_HOLD_MS ? { shown: want, pending: null, pendingMs: 0 } : { shown: st.shown, pending: want, pendingMs: held };
}

/** A follower's body: the bob follows the leader's step (a little behind each one before it), fades with `moveK` (0..1) and breathes when standing. */
export function followerBob(steps: number, index: number, moveK: number, clockMs: number): BodyBob {
  const lift = stepLift(steps - index * FOLLOWER_PHASE_LAG);
  const breath = Math.sin((clockMs / BREATH_PERIOD_MS) * Math.PI * 2 + index) * BREATH_SHARE * (1 - moveK);
  return { lift: lift * 6 * moveK, sy: 1 - SQUASH_SHARE * (1 - lift) * moveK + breath, rot: 0 };
}

/** Whether a follower faces left: by where it is heading (`ahead` is the trail point in front of it), keeping `prev` when it hardly moves. */
export function followerFlip(at: Vec2, ahead: Vec2, prev: boolean): boolean {
  const dx = ahead.x - at.x;
  return Math.abs(dx) < 0.5 ? prev : dx < 0;
}

/** A coordinate rounded to a whole screen pixel at this zoom (stops the sprite shimmering against the ground while the camera eases). */
export function snapToPixel(v: number, zoom: number): number {
  const z = zoom > 0 ? zoom : 1;
  return Math.round(v * z) / z;
}
