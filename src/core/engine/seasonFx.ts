// Seasonal FX maths (DECISIONS MU-2), pure: which emitters run for a season + day / night phase,
// their effective limits after admin tuning, and each particle's spawn and motion. The Phaser side
// (game/fx/SeasonFxLayer.ts) only pools sprites and copies these numbers onto them.
import type { DayPhase } from '../config/dayNight';
import {
  SEASON_FX_LIMITS,
  SEASON_FX_TUNING,
  type FxEmitter,
  type Range,
  type SeasonFxTuning,
} from '../config/seasonFx';
import { SEASON_FX } from '../config/seasonFxTable';
import type { SeasonId } from '../config/seasons';
import type { Rng } from '../rng';

/** An emitter after tuning: the spawn chance and cap actually used. */
export interface ActiveEmitter {
  emitter: FxEmitter;
  maxActive: number;
  /** Share 0..1 of spawn attempts that spawn. */
  chance: number;
  /** Interval range (ms) after the spawn-rate multiplier. */
  intervalMs: Range;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Emitters that may run now: season, phase condition, admin on / off; empty when FX are off. */
export function activeEmitters(
  season: SeasonId,
  phase: DayPhase,
  tuning: SeasonFxTuning = SEASON_FX_TUNING,
  table: Readonly<Record<SeasonId, readonly FxEmitter[]>> = SEASON_FX,
): ActiveEmitter[] {
  if (!tuning.enabled) return [];
  const L = SEASON_FX_LIMITS;
  const global = clamp(tuning.density, 0, L.densityMax);
  const out: ActiveEmitter[] = [];
  for (const e of table[season]) {
    const t = tuning.emitters[e.id];
    if (t && !t.enabled) continue;
    if (e.phases && !e.phases.includes(phase)) continue;
    const density = global * clamp(t?.density ?? 1, 0, L.densityMax);
    const rate = clamp(t?.spawnRate ?? 1, L.spawnRateMin, L.spawnRateMax);
    const maxActive = Math.min(L.maxActiveCap, Math.round(e.maxActive * density));
    if (maxActive <= 0 || density <= 0) continue;
    out.push({
      emitter: e,
      maxActive,
      chance: clamp(e.density * density, 0, 1),
      intervalMs: [e.spawnIntervalMs[0] / rate, e.spawnIntervalMs[1] / rate],
    });
  }
  return out;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A placement an anchored emitter gathers around (display centre + size). */
export interface FxAnchor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FxParticle {
  /** The fixed frame, or the first frame of its flap group (animated emitters). */
  frame: number;
  bornAt: number;
  lifeMs: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  swayAmp: number;
  swayHz: number;
  swayPhase: number;
  spin: number;
  angle0: number;
  size: number;
  opacity: number;
  tint: number | null;
  pulseHz: number;
}

/** The pose of a particle at a time: position, angle, alpha, frame. */
export interface FxPose {
  x: number;
  y: number;
  angle: number;
  alpha: number;
  frame: number;
  alive: boolean;
}

const draw = (rng: Rng, [lo, hi]: Range) => lo + (hi - lo) * rng.next();
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * A new particle of `e`: start point by area, velocity from direction ± jitter, the rest drawn in
 * the emitter's ranges. Returns null when an anchored emitter has no anchor on the farm.
 */
export function spawnParticle(
  e: FxEmitter,
  frameCount: number,
  view: Rect,
  anchors: readonly FxAnchor[],
  now: number,
  rng: Rng,
): FxParticle | null {
  let x: number, y: number;
  const size = draw(rng, e.size);
  if (e.area === 'anchors') {
    const near = anchors.filter((a) => e.anchors?.includes(a.id));
    if (near.length === 0) return null;
    const a = near[Math.floor(rng.next() * near.length)]!;
    const spread = e.anchorSpread ?? 0.6;
    x = a.x + (rng.next() - 0.5) * a.width * spread;
    y = a.y + (rng.next() - 0.5) * a.height * spread;
  } else if (e.area === 'top') {
    // Along the top edge and the left edge (top-left drift), just outside the view.
    const along = rng.next() * (view.width + view.height);
    if (along < view.width) {
      x = view.x + along;
      y = view.y - size;
    } else {
      x = view.x - size;
      y = view.y + (along - view.width) * 0.6;
    }
  } else {
    x = view.x + rng.next() * view.width;
    y = view.y + rng.next() * view.height;
  }
  const dir = toRad(e.direction + (rng.next() * 2 - 1) * e.directionJitter);
  const speed = draw(rng, e.speed);
  const groups = e.flap ? Math.max(1, Math.floor(frameCount / e.flap.size)) : 0;
  const pool = e.frames?.length ? e.frames : Array.from({ length: frameCount }, (_, i) => i);
  const frame = e.flap
    ? Math.floor(rng.next() * groups) * e.flap.size
    : pool[Math.floor(rng.next() * pool.length)] ?? 0;
  return {
    frame,
    bornAt: now,
    lifeMs: draw(rng, e.lifetimeMs),
    x0: x,
    y0: y,
    vx: Math.cos(dir) * speed,
    vy: Math.sin(dir) * speed,
    swayAmp: draw(rng, e.sway.amp),
    swayHz: draw(rng, e.sway.hz),
    swayPhase: rng.next() * Math.PI * 2,
    spin: draw(rng, e.spin),
    angle0: draw(rng, e.angle),
    size,
    opacity: draw(rng, e.opacity),
    tint: e.tint?.length ? e.tint[Math.floor(rng.next() * e.tint.length)]! : null,
    pulseHz: e.pulse ? draw(rng, e.pulse.hz) : 0,
  };
}

/** Where particle `p` of `e` is at `now` (sway perpendicular to its velocity, fades at both ends). */
export function particlePose(e: FxEmitter, p: FxParticle, now: number): FxPose {
  const age = now - p.bornAt;
  const t = age / 1000;
  const speed = Math.hypot(p.vx, p.vy) || 1;
  const sway = Math.sin(t * p.swayHz * Math.PI * 2 + p.swayPhase) * p.swayAmp;
  const x = p.x0 + p.vx * t + (-p.vy / speed) * sway;
  const y = p.y0 + p.vy * t + (p.vx / speed) * sway;
  const fade = Math.max(1, e.fadeMs);
  const env = Math.min(1, age / fade, (p.lifeMs - age) / fade);
  const pulse = e.pulse
    ? 1 - e.pulse.depth + e.pulse.depth * (0.5 + 0.5 * Math.sin(t * p.pulseHz * Math.PI * 2 + p.swayPhase))
    : 1;
  const frame = e.flap ? p.frame + (Math.floor(t * e.flap.fps) % e.flap.size) : p.frame;
  return {
    x,
    y,
    angle: p.angle0 + p.spin * t,
    alpha: Math.max(0, env) * p.opacity * pulse,
    frame,
    alive: age >= 0 && age < p.lifeMs,
  };
}

/** Admin save check: global / per-emitter numbers inside their limits. */
export function seasonFxIssues(t: SeasonFxTuning): string[] {
  const L = SEASON_FX_LIMITS;
  const issues: string[] = [];
  if (!(t.density >= 0 && t.density <= L.densityMax)) issues.push(`density ${t.density} ngoài 0…${L.densityMax}`);
  const known = new Set(Object.values(SEASON_FX).flatMap((list) => list.map((e) => e.id)));
  for (const [id, e] of Object.entries(t.emitters)) {
    if (!known.has(id)) issues.push(`${id}: emitter không tồn tại`);
    if (!(e.density >= 0 && e.density <= L.densityMax)) issues.push(`${id}: density ${e.density} ngoài 0…${L.densityMax}`);
    if (!(e.spawnRate >= L.spawnRateMin && e.spawnRate <= L.spawnRateMax))
      issues.push(`${id}: spawnRate ${e.spawnRate} ngoài ${L.spawnRateMin}…${L.spawnRateMax}`);
  }
  return issues;
}
