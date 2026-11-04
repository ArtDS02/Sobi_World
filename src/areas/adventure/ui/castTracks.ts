// Keyframe tracks for the body (ANIM-005): the `track` act of a script, and the named cast presets (`cast_charge`…), one per way a
// body gathers power and lets it go. A key is an offset from rest in the direction the unit faces (dx > 0: forward, rot > 0: leaning
// forward); the amplitudes scale with the unit's width. Every track starts and ends at rest (tests/unit/castTracks.test.ts). Pure.
import type { BodyPlan } from '../../../../content/schemas/adventure/battleFx';
import type { CAST_PRESET_VALUES, EASE_VALUES } from '../../../../content/schemas/adventure/battleScript';

export type CastPreset = (typeof CAST_PRESET_VALUES)[number];
export type Ease = (typeof EASE_VALUES)[number];

export interface Key {
  t: number;
  dx?: number | undefined;
  dy?: number | undefined;
  rot?: number | undefined;
  sx?: number | undefined;
  sy?: number | undefined;
  ease?: Ease | undefined;
}
export interface TrackPose {
  dx: number;
  dy: number;
  rot: number;
  sx: number;
  sy: number;
}

/** The width the preset amplitudes are written for (px); wider bodies move proportionally more. */
export const REFERENCE_WIDTH = 160;

const EASE: Readonly<Record<Ease, (t: number) => number>> = {
  linear: (t) => t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inQuad: (t) => t * t,
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  outBack: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  spring: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-5.5 * t) * Math.cos(t * Math.PI * 2.2)),
};

const valuesOf = (k: Key): TrackPose => ({ dx: k.dx ?? 0, dy: k.dy ?? 0, rot: k.rot ?? 0, sx: k.sx ?? 1, sy: k.sy ?? 1 });

/** The pose of a track at k ∈ [0, 1] (before the first key and after the last: the nearest key). */
export function sampleTrack(keys: readonly Key[], k: number): TrackPose {
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  if (k <= first.t) return valuesOf(first);
  if (k >= last.t) return valuesOf(last);
  let i = 0;
  while (i < keys.length - 2 && k > keys[i + 1]!.t) i += 1;
  const a = keys[i]!;
  const b = keys[i + 1]!;
  const u = EASE[b.ease ?? 'inOutQuad']((k - a.t) / Math.max(1e-6, b.t - a.t));
  const p = valuesOf(a);
  const q = valuesOf(b);
  return { dx: p.dx + (q.dx - p.dx) * u, dy: p.dy + (q.dy - p.dy) * u, rot: p.rot + (q.rot - p.rot) * u, sx: p.sx + (q.sx - p.sx) * u, sy: p.sy + (q.sy - p.sy) * u };
}

const rest = (t: number): Key => ({ t, ease: 'spring' });

/** Anticipation (draw back), hold, release (reach out), settle. Tune the feel here. */
export const CAST_TRACKS: Readonly<Record<CastPreset, readonly Key[]>> = {
  cast_charge: [rest(0), { t: 0.4, dx: -14, dy: 6, rot: -7, sx: 1.06, sy: 0.92, ease: 'outBack' }, { t: 0.55, dx: -14, dy: 6, rot: -7, sx: 1.06, sy: 0.92 }, { t: 0.75, dx: 18, dy: -10, rot: 9, sx: 0.94, sy: 1.1, ease: 'outQuad' }, rest(1)],
  cast_raise: [rest(0), { t: 0.35, dy: 4, sx: 1.04, sy: 0.94, ease: 'outQuad' }, { t: 0.6, dy: -16, rot: -4, sx: 0.96, sy: 1.1, ease: 'outBack' }, { t: 0.75, dy: -16, rot: -4, sx: 0.96, sy: 1.1 }, rest(1)],
  cast_roar: [rest(0), { t: 0.4, dx: -6, rot: -12, sx: 1.12, sy: 1.12, ease: 'outBack' }, { t: 0.7, dx: -6, rot: -12, sx: 1.12, sy: 1.12 }, { t: 0.85, dx: 10, rot: 8, sx: 0.96, sy: 0.96, ease: 'outQuad' }, rest(1)],
  cast_stomp: [rest(0), { t: 0.3, dy: 10, sx: 1.08, sy: 0.86, ease: 'outQuad' }, { t: 0.45, dy: -14, sx: 0.94, sy: 1.1, ease: 'outQuad' }, { t: 0.6, dy: 4, sx: 1.12, sy: 0.84, ease: 'inQuad' }, rest(1)],
  // A full turn: it ends at 360 degrees, which looks the same as rest (the tests compare turns modulo 360).
  cast_spin: [rest(0), { t: 0.25, dx: -10, rot: -12, sx: 1.04, sy: 0.94, ease: 'outBack' }, { t: 0.7, dy: -10, rot: 330, sx: 0.96, sy: 1.06, ease: 'inOutQuad' }, { t: 0.85, dx: 12, dy: -6, rot: 360, ease: 'outQuad' }, { t: 1, rot: 360, ease: 'spring' }],
  cast_hover: [rest(0), { t: 0.4, dy: -22, rot: -3, ease: 'outQuad' }, { t: 0.7, dy: -24, rot: 3, ease: 'inOutQuad' }, { t: 0.85, dy: -20, rot: -2, sx: 1.04, sy: 0.97, ease: 'inOutQuad' }, rest(1)],
  cast_sprout: [rest(0), { t: 0.35, dy: 8, sx: 1.1, sy: 0.78, ease: 'outQuad' }, { t: 0.6, dy: -6, sx: 0.9, sy: 1.22, ease: 'outBack' }, { t: 0.8, dy: -4, sx: 0.96, sy: 1.1, ease: 'inOutQuad' }, rest(1)],
  cast_coil: [rest(0), { t: 0.3, dx: -10, rot: -10, sx: 1.08, sy: 0.9, ease: 'outQuad' }, { t: 0.55, dx: -4, rot: 12, sx: 0.96, sy: 1.04, ease: 'inOutQuad' }, { t: 0.8, dx: 12, rot: -8, sx: 0.94, sy: 1.08, ease: 'outQuad' }, rest(1)],
  cast_bow: [rest(0), { t: 0.4, dx: 6, dy: 8, rot: 14, sx: 1.04, sy: 0.92, ease: 'outQuad' }, { t: 0.65, dx: 6, dy: 8, rot: 14, sx: 1.04, sy: 0.92 }, { t: 0.85, dy: -6, rot: -4, sx: 0.98, sy: 1.06, ease: 'outBack' }, rest(1)],
  cast_wing: [rest(0), { t: 0.25, dy: 6, sx: 1.06, sy: 0.9, ease: 'outQuad' }, { t: 0.45, dy: -22, sx: 0.92, sy: 1.12, ease: 'outQuad' }, { t: 0.6, dy: -10, sx: 1.06, sy: 0.94, ease: 'inOutQuad' }, { t: 0.78, dy: -24, sx: 0.92, sy: 1.12, ease: 'outQuad' }, rest(1)],
};

/** The cast a body makes by default when its skill gives none: one per body plan. */
export const CAST_BY_BODY: Readonly<Record<BodyPlan, CastPreset>> = {
  quadruped: 'cast_charge',
  aquatic: 'cast_coil',
  flyer: 'cast_wing',
  floater: 'cast_hover',
  sprout: 'cast_sprout',
  heavy: 'cast_stomp',
};

/** A track's pose scaled for a body `width` wide and a unit facing `dir` (1 right, -1 left): x offsets and turns mirror. */
export function trackFor(keys: readonly Key[], k: number, width: number, dir: 1 | -1): TrackPose {
  const p = sampleTrack(keys, k);
  const s = width / REFERENCE_WIDTH;
  return { dx: p.dx * s * dir, dy: p.dy * s, rot: p.rot * dir, sx: p.sx, sy: p.sy };
}
