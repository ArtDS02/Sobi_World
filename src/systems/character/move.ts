// Moving the character (spec §4): 4 directions plus diagonals, feet box against the walkable ground and
// the objects, sliding along walls. Pure; the speed and the time step come in.
import type { Control } from '../../core/settings/keys';
import type { CharacterState, Facing, Rect, Vec, Walkable } from './types';

/** Longest slice of time moved in one go, so a slow frame cannot jump through a thin object. */
const MAX_DT_MS = 100;
/** Longest distance moved between two collision checks. */
const MAX_STEP_PX = 6;

/** Direction asked for by the controls held down (-1..1 per axis; opposite keys cancel). */
export function inputVector(pressed: ReadonlySet<Control>): Vec {
  return {
    x: (pressed.has('moveRight') ? 1 : 0) - (pressed.has('moveLeft') ? 1 : 0),
    y: (pressed.has('moveDown') ? 1 : 0) - (pressed.has('moveUp') ? 1 : 0),
  };
}

/** The way the character faces when walking along `dir`: a diagonal keeps the current facing if it is one of its axes. */
export function facingFor(dir: Vec, prev: Facing): Facing {
  if (dir.x === 0 && dir.y === 0) return prev;
  if (dir.y === 0) return dir.x > 0 ? 'right' : 'left';
  if (dir.x === 0) return dir.y > 0 ? 'down' : 'up';
  const horizontal: Facing = dir.x > 0 ? 'right' : 'left';
  const vertical: Facing = dir.y > 0 ? 'down' : 'up';
  return prev === horizontal || prev === vertical ? prev : horizontal;
}

const feetBox = (p: Vec, w: Walkable): Rect => ({
  x: p.x - w.halfW,
  y: p.y - w.halfH,
  width: w.halfW * 2,
  height: w.halfH * 2,
});

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const inside = (box: Rect, bounds: Rect) =>
  box.x >= bounds.x &&
  box.y >= bounds.y &&
  box.x + box.width <= bounds.x + bounds.width &&
  box.y + box.height <= bounds.y + bounds.height;

/** True when the character can stand at `p`. */
export function canStand(p: Vec, w: Walkable): boolean {
  const box = feetBox(p, w);
  return inside(box, w.bounds) && !w.obstacles.some((o) => overlaps(box, o));
}

/**
 * The nearest standable point to `p`: inside the bounds and out of every object (pushed out along the
 * shortest way). Used for the spawn and after the layout changes under the player.
 */
export function settle(p: Vec, w: Walkable): Vec {
  let out: Vec = {
    x: Math.min(Math.max(p.x, w.bounds.x + w.halfW), w.bounds.x + w.bounds.width - w.halfW),
    y: Math.min(Math.max(p.y, w.bounds.y + w.halfH), w.bounds.y + w.bounds.height - w.halfH),
  };
  for (let pass = 0; pass < 4 && !canStand(out, w); pass++) {
    const hit = w.obstacles.find((o) => overlaps(feetBox(out, w), o));
    if (!hit) break;
    const left = out.x + w.halfW - hit.x;
    const right = hit.x + hit.width - (out.x - w.halfW);
    const up = out.y + w.halfH - hit.y;
    const down = hit.y + hit.height - (out.y - w.halfH);
    const least = Math.min(left, right, up, down);
    out =
      least === left
        ? { x: out.x - left, y: out.y }
        : least === right
          ? { x: out.x + right, y: out.y }
          : least === up
            ? { x: out.x, y: out.y - up }
            : { x: out.x, y: out.y + down };
    out = {
      x: Math.min(Math.max(out.x, w.bounds.x + w.halfW), w.bounds.x + w.bounds.width - w.halfW),
      y: Math.min(Math.max(out.y, w.bounds.y + w.halfH), w.bounds.y + w.bounds.height - w.halfH),
    };
  }
  return out;
}

/**
 * One frame of walking. `dir` is the asked direction (any length: it is normalised, so a diagonal is
 * not faster); `speed` is in pixels per second. A blocked axis is dropped, so the character slides.
 */
export function stepCharacter(
  state: CharacterState,
  dir: Vec,
  dtMs: number,
  speed: number,
  walk: Walkable,
): CharacterState {
  const len = Math.hypot(dir.x, dir.y);
  if (len === 0 || dtMs <= 0) return state.moving ? { ...state, moving: false } : state;
  const dist = (speed * Math.min(dtMs, MAX_DT_MS)) / 1000;
  const steps = Math.max(1, Math.ceil(dist / MAX_STEP_PX));
  const dx = ((dir.x / len) * dist) / steps;
  const dy = ((dir.y / len) * dist) / steps;
  let p: Vec = { x: state.x, y: state.y };
  for (let i = 0; i < steps; i++) {
    const tryX = { x: p.x + dx, y: p.y };
    if (dx !== 0 && canStand(tryX, walk)) p = tryX;
    const tryY = { x: p.x, y: p.y + dy };
    if (dy !== 0 && canStand(tryY, walk)) p = tryY;
  }
  const moved = Math.hypot(p.x - state.x, p.y - state.y) > 1e-6;
  return { x: p.x, y: p.y, facing: facingFor(dir, state.facing), moving: moved };
}

/** The asked direction to reach `target` (unit length), or none when closer than `arrive`. */
export function directionTo(from: Vec, target: Vec, arrive: number): Vec {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const d = Math.hypot(dx, dy);
  return d <= arrive ? { x: 0, y: 0 } : { x: dx / d, y: dy / d };
}
