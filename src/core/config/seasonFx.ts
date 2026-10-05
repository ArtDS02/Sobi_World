// Seasonal environment FX (DECISIONS MU-2): the emitter data model (table: seasonFxTable.ts).
// Every emitter spawns pooled sprites now and then (never a dense stream), within maxActive, from
// one of the art strips cut by `npm run art:season-fx` (manifest fx rows `fx_env_*`). An emitter
// may need a day / night phase (fireflies only at night, sunbeams only by day) — the phase comes
// from the one day / night clock (DayNightDirector). Nothing here changes layout, collision,
// pig movement or the camera: FX are view-only sprites, never interactive.
//   layer 'ground': just under every actor (pigs, buildings, props) — never covers a pig;
//   layer 'air': over the world, under the day / night tint — small, sparse falling particles;
//   layer 'glow': light sources over the night tint (like the window glows) — fireflies.
// TUNABLE; the tuning (enable / density / spawn rate) is content/farm/season-fx.json, written by the
// admin dashboard (→ Bố cục farm → Mùa).
import { CONTENT } from './content';
import type { DayPhase } from './dayNight';

export const SEASON_FX_ART_IDS = [
  'fx_env_petals',
  'fx_env_butterflies',
  'fx_env_fireflies',
  'fx_env_sunbeams',
  'fx_env_glow',
  'fx_env_leaves',
  'fx_env_haze',
  'fx_env_snowflakes',
  'fx_env_wind',
] as const;
export type SeasonFxArtId = (typeof SEASON_FX_ART_IDS)[number];

export const SEASON_FX_ART = {
  /** fps written into the strips' manifest rows (frames are variants; only butterflies flap). */
  stripFps: 8,
} as const;

/** [min, max] — a value is drawn uniformly in it per particle. */
export type Range = readonly [number, number];

export interface FxEmitter {
  /** Stable key (admin tuning). */
  id: string;
  labelVi: string;
  art: SeasonFxArtId;
  /** Frames of the strip this emitter uses (random per particle); absent = all. */
  frames?: readonly number[];
  /** Animated frames: consecutive groups of `size` frames played at `fps` (butterfly wings). */
  flap?: { size: number; fps: number };
  /** Time between spawn attempts (ms). */
  spawnIntervalMs: Range;
  /** Particles spawned per attempt. */
  burst: Range;
  lifetimeMs: Range;
  maxActive: number;
  /** Share 0..1 of attempts that spawn (sparse, "now and then" effects). */
  density: number;
  /** Speed (design px / s) along `direction` (degrees, 0 = right, 90 = down). */
  speed: Range;
  direction: number;
  directionJitter: number;
  /** Side-to-side sway perpendicular to the motion (zigzag, flutter, wobble). */
  sway: { amp: Range; hz: Range };
  /** Rotation speed (deg / s) and start angle range. */
  spin: Range;
  angle: Range;
  /** Display size (design px, longest side) and opacity. */
  size: Range;
  opacity: Range;
  /** Fade in / out at both ends of the life (ms). */
  fadeMs: number;
  /** Glow pulse: opacity × (1 − depth + depth·sin) at `hz` (fireflies). */
  pulse?: { depth: number; hz: Range };
  tint?: readonly number[];
  blend?: 'normal' | 'add';
  /**
   * Where particles appear: 'top' = above the top-left part of the view (they fall / drift in),
   * 'view' = anywhere in the view, 'anchors' = around the named placements.
   */
  area: 'top' | 'view' | 'anchors';
  anchors?: readonly string[];
  /** Anchored spawn radius around the placement's centre, as a share of its display size. */
  anchorSpread?: number;
  layer: 'ground' | 'air' | 'glow';
  /** Day / night phases it may appear in (absent = always). */
  phases?: readonly DayPhase[];
}

/** Admin tuning of the emitters (seasonFxTable.ts), kept apart so a dashboard save is a tiny diff. */
export interface SeasonFxTuning {
  enabled: boolean;
  /** Global density multiplier (0..2). */
  density: number;
  /** Per emitter: on / off, density multiplier (0..2), spawn-rate multiplier (0.25..4). */
  emitters: Readonly<Record<string, { enabled: boolean; density: number; spawnRate: number }>>;
}

export const SEASON_FX_LIMITS = { densityMax: 2, spawnRateMin: 0.25, spawnRateMax: 4, maxActiveCap: 60 } as const;

export const SEASON_FX_TUNING: SeasonFxTuning = CONTENT.seasonFx;
