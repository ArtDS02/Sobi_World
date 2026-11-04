// The secondary motion of a big object in a script (ANIM-007): an easing for its path, a wobble, a pulse, a bob, a stretch along its
// speed, a squash when it lands. Each path has its defaults so that no prop slides along a straight line like a pasted picture; an act
// can override any of them. Pure: the battle scene (scene/battle/fxProps.ts) only draws what this returns.
import type { PropEase, PropMods, PropPath } from '../../../../content/schemas/adventure/battleScript';

export type { PropMods };

const EASE: Readonly<Record<PropEase, (t: number) => number>> = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inBack: (t) => 2.70158 * t ** 3 - 1.70158 * t ** 2,
  outBack: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  spring: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-5.5 * t) * Math.cos(t * Math.PI * 2.2)),
};

/** What each path does when the act says nothing (tune the feel here). */
export const PATH_DEFAULTS: Readonly<Record<PropPath, PropMods>> = {
  fall: { ease: 'inBack', squashOnHit: true },
  rise: {},
  sweep: { ease: 'inOutSine', wobble: { rot: 3, freq: 2.5 }, bobY: { amp: 6, freq: 3 } },
  orbit: {},
  pop: {},
  grow: {},
  throw: { ease: 'linear', stretch: true },
  fly: { ease: 'inQuad', stretch: true },
  stretch: {},
  hover: {},
};

export interface PropFrame {
  /** The progress along the path (0..1) after easing. */
  prog: number;
  dy: number;
  /** Extra turn (radians). */
  rot: number;
  sx: number;
  sy: number;
}

/** The mods of an act: its path's defaults, then what the act sets. */
export const modsOf = (path: PropPath, own: PropMods): PropMods => ({ ...PATH_DEFAULTS[path], ...own });

/**
 * The frame of a prop at `t` ∈ [0, 1] of its `dur` ms. `raw` is the progress the path would make without easing (what the path computes
 * from `t`), `hitAt` the `t` when it lands (the squash plays just after it).
 */
export function propFrame(mods: PropMods, t: number, raw: number, hitAt: number): PropFrame {
  const ease = EASE[mods.ease ?? 'linear'];
  const prog = ease(Math.min(1, Math.max(0, raw)));
  let dy = 0;
  let rot = 0;
  let sx = 1;
  let sy = 1;
  // The waves die away a little towards the end: y += sin(2π·f·t)·amp·(1 − 0.4t).
  const fade = 1 - t * 0.4;
  if (mods.bobY) dy += Math.sin(t * mods.bobY.freq * Math.PI * 2) * mods.bobY.amp * fade;
  if (mods.wobble) rot += ((Math.sin(t * mods.wobble.freq * Math.PI * 2) * mods.wobble.rot) / 180) * Math.PI;
  if (mods.pulse) {
    const p = 1 + Math.sin(t * mods.pulse.freq * Math.PI * 2) * mods.pulse.amp;
    sx *= p;
    sy *= p;
  }
  if (mods.stretch) {
    // Longer along the way it goes the faster it goes (the slope of the easing), squeezed across.
    const d = (ease(Math.min(1, raw + 0.02)) - ease(Math.max(0, raw - 0.02))) / 0.04;
    const speed = Math.min(1, Math.max(0, d / 2));
    sx *= 1 + 0.35 * speed;
    sy *= 1 - 0.15 * speed;
  }
  if (mods.squashOnHit) {
    const k = (t - hitAt) / 0.12;
    if (k > 0 && k < 1) {
      const v = Math.sin(k * Math.PI);
      sx *= 1 + 0.25 * v;
      sy *= 1 - 0.22 * v;
    }
  }
  return { prog, dy, rot, sx, sy };
}
