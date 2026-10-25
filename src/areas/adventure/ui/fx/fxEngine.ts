// A small 2D effects engine for the battle canvas (adventure-big-update-1, in the spirit of Epic Battle Fantasy 3: many particles,
// glows added on top of each other, timed vector shapes such as bolts, beams, slashes and rune circles, flashes and shakes). The
// world holds particles (spawned in bursts, moved by velocity, gravity and drag, drawn by shape) and shapes (a draw function over
// their own time). It knows nothing of the battle: recipes in elementFx.ts fill it, battleStage.ts steps and draws it every frame.
// Randomness comes from the seeded `rand` of the world, so a step plays the same way twice.

export interface Pt {
  x: number;
  y: number;
}

export type ParticleShape = 'glow' | 'spark' | 'star' | 'leaf' | 'drop' | 'ember' | 'rock' | 'bubble' | 'shard' | 'ring' | 'smoke' | 'plus' | 'arrow' | 'rune' | 'petal';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Gravity (px/s²) and drag (share of speed lost per second). */
  g: number;
  drag: number;
  /** Seconds alive, and how long it lives. */
  age: number;
  life: number;
  /** Size at birth and at death (px). */
  size: number;
  size2: number;
  rot: number;
  spin: number;
  color: string;
  /** Opacity at birth (fades to 0 by its end unless `hold`). */
  alpha: number;
  shape: ParticleShape;
  /** Drawn added on top (light) instead of painted over. */
  add: boolean;
  /** Delay before it shows (s). */
  wait: number;
}

export interface Shape {
  /** Seconds before it starts, how long it lasts, seconds into it. */
  wait: number;
  dur: number;
  age: number;
  add: boolean;
  /** Drawn on the ground under the fighters (a magic circle) instead of over them. */
  ground?: boolean;
  draw(ctx: CanvasRenderingContext2D, t: number, world: FxWorld): void;
  /** Called every frame while it runs (to leave a trail of particles). */
  tick?(t: number, dt: number, world: FxWorld): void;
}

export interface FxWorld {
  particles: Particle[];
  shapes: Shape[];
  /** A full-screen flash: colour, strength, when it fades by (s). */
  flash: { color: string; alpha: number; left: number; dur: number } | null;
  /** The screen dims (an Ultimate): strength now and its target. */
  dim: number;
  dimTo: number;
  shake: { mag: number; left: number; dur: number } | null;
  rand: () => number;
  /** How big the particles of a burst are drawn (and how fast they fly) next to the fighters on screen. */
  scale: number;
}

/** A small seeded generator (mulberry32): the effects of a step play the same each time. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newWorld = (seed = 1): FxWorld => ({ particles: [], shapes: [], flash: null, dim: 0, dimTo: 0, shake: null, rand: seeded(seed), scale: 1.5 });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
export const easeIn = (t: number) => t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOutBack = (t: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

export interface BurstOptions {
  count: number;
  at: Pt;
  /** Spread of the spawn point (px). */
  spread?: number;
  /** Speed range (px/s) and the direction cone (radians: centre, half width). */
  speed: [number, number];
  angle?: number;
  cone?: number;
  life: [number, number];
  size: [number, number];
  /** Size at death as a share of the size at birth. */
  shrink?: number;
  colors: readonly string[];
  shape: ParticleShape;
  g?: number;
  drag?: number;
  spin?: number;
  alpha?: number;
  add?: boolean;
  wait?: number;
  /** Elliptic spread (the ground seen from the side): spread × this on y. */
  flat?: number;
}

/** The most particles alive at once: a burst past it spawns fewer, so a big skill never drags the frame rate down. */
export const MAX_PARTICLES = 420;

/** A burst of particles around a point. */
export function burst(w: FxWorld, o: BurstOptions) {
  const r = w.rand;
  const k = w.scale;
  const count = Math.min(o.count, MAX_PARTICLES - w.particles.length);
  for (let i = 0; i < count; i += 1) {
    const a = (o.angle ?? 0) + (r() * 2 - 1) * (o.cone ?? Math.PI);
    const sp = lerp(o.speed[0], o.speed[1], r()) * k;
    const spread = (o.spread ?? 0) * Math.sqrt(r()) * k;
    const sa = r() * Math.PI * 2;
    const size = lerp(o.size[0], o.size[1], r()) * k;
    w.particles.push({
      x: o.at.x + Math.cos(sa) * spread,
      y: o.at.y + Math.sin(sa) * spread * (o.flat ?? 1),
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      g: (o.g ?? 0) * k,
      drag: o.drag ?? 0,
      age: 0,
      life: lerp(o.life[0], o.life[1], r()),
      size,
      size2: size * (o.shrink ?? 0.2),
      rot: r() * Math.PI * 2,
      spin: (r() * 2 - 1) * (o.spin ?? 0),
      color: o.colors[Math.floor(r() * o.colors.length)] ?? '#fff',
      alpha: o.alpha ?? 1,
      shape: o.shape,
      add: o.add ?? true,
      wait: o.wait ?? 0,
    });
  }
}

export function addShape(w: FxWorld, s: Omit<Shape, 'age'> & { age?: number }) {
  w.shapes.push({ age: 0, ...s });
}

export function flash(w: FxWorld, color: string, alpha: number, dur: number) {
  if (w.flash && w.flash.alpha * (w.flash.left / w.flash.dur) > alpha) return;
  w.flash = { color, alpha, left: dur, dur };
}

export function shake(w: FxWorld, mag: number, dur: number) {
  if (w.shake && w.shake.mag * (w.shake.left / w.shake.dur) > mag) return;
  w.shake = { mag, left: dur, dur };
}

/** Moves everything on by `dt` seconds. */
export function step(w: FxWorld, dt: number) {
  const ps = w.particles;
  let n = 0;
  for (const p of ps) {
    if (p.wait > 0) {
      p.wait -= dt;
      ps[n++] = p;
      continue;
    }
    p.age += dt;
    if (p.age >= p.life) continue;
    const k = Math.max(0, 1 - p.drag * dt);
    p.vx *= k;
    p.vy = p.vy * k + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    ps[n++] = p;
  }
  ps.length = n;
  const ss = w.shapes;
  let m = 0;
  for (const s of ss) {
    if (s.wait > 0) {
      s.wait -= dt;
      ss[m++] = s;
      continue;
    }
    s.age += dt;
    if (s.age >= s.dur) continue;
    s.tick?.(clamp01(s.age / s.dur), dt, w);
    ss[m++] = s;
  }
  ss.length = m;
  if (w.flash) {
    w.flash.left -= dt;
    if (w.flash.left <= 0) w.flash = null;
  }
  if (w.shake) {
    w.shake.left -= dt;
    if (w.shake.left <= 0) w.shake = null;
  }
  w.dim += (w.dimTo - w.dim) * Math.min(1, dt * 6);
}

/** Where the screen is pushed by the shake now (px). */
export function shakeOffset(w: FxWorld): Pt {
  if (!w.shake) return { x: 0, y: 0 };
  const k = w.shake.mag * (w.shake.left / w.shake.dur);
  return { x: (w.rand() * 2 - 1) * k, y: (w.rand() * 2 - 1) * k * 0.6 };
}

export const busy = (w: FxWorld) => w.particles.length > 0 || w.shapes.length > 0 || w.flash !== null || w.shake !== null || w.dim > 0.01 || w.dimTo > 0;
