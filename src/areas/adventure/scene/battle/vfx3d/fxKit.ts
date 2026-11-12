// Emitters the 3D effects share (decision 059), on top of quads.ts: a burst thrown from a point, a fountain along a path, drifting
// motes, a gathering swirl. Each is a pure function of the seconds since it began: the particles' randomness is a hash of their index.
import * as THREE from 'three';
import type { Frame } from './atlas';
import { clamp, smooth } from './effectParts';
import type { Quads } from './quads';

/** A fixed pseudo-random number 0..1 for particle `i`, channel `k` of the emitter `seed`. */
export const h = (i: number, k: number, seed = 0) => {
  const x = Math.sin(i * 12.9898 + k * 78.233 + seed * 37.719) * 43758.5453;
  return x - Math.floor(x);
};
export type Rgb = readonly [number, number, number];
/** Mixes two colours. */
export const mix3 = (a: Rgb, b: Rgb, t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export interface BurstOpts {
  /** Seconds since the burst (before 0 nothing shows). */
  sec: number;
  at: THREE.Vector3;
  /** Seconds a particle lives (each a little less, by its hash). */
  life: number;
  /** Outward speed and upward speed, world units / s (each particle takes 35–100 % of them). */
  speed: number;
  up: number;
  /** Gravity, world units / s² (default 9); 0 for sparks of light that float. */
  grav?: number;
  /** Air drag 0..6: how fast the outward speed dies (default 1.5). */
  drag?: number;
  size: number;
  /** Colour at birth and at death. */
  color: Rgb;
  to?: Rgb;
  frame: Frame;
  /** Seconds of velocity the quad is stretched by (0.03 turns a drop into a dash); 0 = round, tumbling. */
  stretch?: number;
  /** Depth share of the outward spread (the stage is seen from the front: 0.6 keeps a burst from looking too deep). */
  flat?: number;
  /** Births are spread over this many seconds. */
  spread?: number;
  /** Overall brightness / alpha. */
  alpha?: number;
  /** Cone: 1 = all round, 0.3 = mostly upward. */
  wide?: number;
  /** Size at death as a share of the size at birth (default 0.3). */
  shrink?: number;
}

/** Poses particles `from .. from + count - 1` of `q` as a burst. */
export function burst(q: Quads, from: number, count: number, seed: number, o: BurstOpts) {
  const g = o.grav ?? 9;
  const drag = o.drag ?? 1.5;
  const flat = o.flat ?? 0.6;
  const to = o.to ?? o.color;
  for (let k = 0; k < count; k++) {
    const i = from + k;
    const t = o.sec - h(k, 0, seed) * (o.spread ?? 0);
    const life = o.life * (0.6 + 0.4 * h(k, 1, seed));
    if (t <= 0 || t >= life) {
      q.hide(i);
      continue;
    }
    const a = h(k, 2, seed) * 6.2832;
    const vh = o.speed * (0.35 + 0.65 * h(k, 3, seed)) * (o.wide ?? 1);
    const vy = o.up * (0.35 + 0.65 * h(k, 4, seed));
    // Outward travel with drag: the integral of v·e^(-drag·t).
    const run = drag > 0.01 ? (1 - Math.exp(-drag * t)) / drag : t;
    const vx = Math.cos(a) * vh;
    const vz = Math.sin(a) * vh * flat;
    const y = o.at.y + vy * t - 0.5 * g * t * t;
    const l = t / life;
    const s = o.size * (0.6 + 0.8 * h(k, 5, seed)) * (1 - (1 - (o.shrink ?? 0.3)) * l);
    const c = mix3(o.color, to, l);
    q.put(i, o.at.x + vx * run, Math.max(0.02, y), o.at.z + vz * run, s, c[0], c[1], c[2], (o.alpha ?? 1) * smooth(0, 0.08, l) * (1 - smooth(0.6, 1, l)));
    if (o.stretch) {
      const e = Math.exp(-drag * t) * o.stretch;
      q.stretch(i, vx * e, (vy - g * t) * o.stretch, vz * e);
      q.look(i, o.frame, 0, 0.55);
    } else q.look(i, o.frame, h(k, 6, seed) * 6.2832 + t * (h(k, 7, seed) - 0.5) * 8);
  }
}

export interface RiseOpts {
  sec: number;
  /** Seconds the emitter runs, and a particle's life. */
  dur: number;
  life: number;
  at: (born: number, k: number) => THREE.Vector3;
  /** Upward drift (world units / s) and sideways jitter (world units). */
  rise: number;
  jitter: number;
  size: number;
  color: Rgb;
  to?: Rgb;
  frame: Frame;
  alpha?: number;
  /** Size at death relative to birth: above 1 a puff swells (smoke), below it dies to a point (ember). */
  grow?: number;
  /** Sideways sway of a mote while it rises, world units. */
  sway?: number;
}

/** Particles born all along `dur` at `at(born)`, each rising and fading for `life`: flames off a moving thing, smoke, embers, mist. */
export function rise(q: Quads, from: number, count: number, seed: number, o: RiseOpts) {
  const to = o.to ?? o.color;
  const tmp = new THREE.Vector3();
  for (let k = 0; k < count; k++) {
    const i = from + k;
    const born = h(k, 0, seed) * o.dur;
    const t = o.sec - born;
    if (t <= 0 || t >= o.life) {
      q.hide(i);
      continue;
    }
    const l = t / o.life;
    tmp.copy(o.at(born, k));
    const sway = (o.sway ?? 0) * Math.sin(t * 5 + h(k, 5, seed) * 6.28);
    const c = mix3(o.color, to, l);
    const s = o.size * (0.6 + 0.8 * h(k, 4, seed)) * (1 + ((o.grow ?? 0.4) - 1) * l);
    q.put(i, tmp.x + (h(k, 1, seed) - 0.5) * o.jitter + sway, tmp.y + (h(k, 2, seed) - 0.5) * o.jitter * 0.6 + o.rise * t * (0.6 + 0.8 * h(k, 6, seed)), tmp.z + (h(k, 3, seed) - 0.5) * o.jitter * 0.6, s, c[0], c[1], c[2], (o.alpha ?? 1) * smooth(0, 0.12, l) * (1 - smooth(0.5, 1, l)));
    q.look(i, o.frame, (h(k, 7, seed) - 0.5) * 1.2 + sway * 0.6);
  }
}

export interface GatherOpts {
  /** 0..1: how far the gathering has come (particles arrive one after the other). */
  k: number;
  to: THREE.Vector3;
  /** Radius they start from and the turns they make on the way in. */
  radius: number;
  turns?: number;
  size: number;
  color: Rgb;
  frame: Frame;
  alpha?: number;
  /** Height spread at the start, world units. */
  tall?: number;
}

/** Particles spiralling in to a point (power being gathered); each is stretched along its path. */
export function gather(q: Quads, from: number, count: number, seed: number, o: GatherOpts) {
  for (let n = 0; n < count; n++) {
    const i = from + n;
    const u = clamp(o.k * 1.6 - h(n, 0, seed) * 0.6);
    if (u <= 0 || u >= 1) {
      q.hide(i);
      continue;
    }
    const pos = (uu: number, out: THREE.Vector3) => {
      const e = 1 - (1 - uu) * (1 - uu);
      const r = o.radius * (0.5 + 0.5 * h(n, 1, seed)) * (1 - e);
      const a = h(n, 2, seed) * 6.2832 + e * (o.turns ?? 1.5) * 6.2832;
      return out.set(o.to.x + Math.cos(a) * r, o.to.y + (h(n, 3, seed) - 0.5) * (o.tall ?? o.radius) * (1 - e), o.to.z + Math.sin(a) * r * 0.6);
    };
    const p = pos(u, A);
    const p0 = pos(Math.max(0, u - 0.06), B);
    q.put(i, p.x, p.y, p.z, o.size * (0.5 + h(n, 4, seed)), o.color[0], o.color[1], o.color[2], (o.alpha ?? 1) * smooth(0, 0.15, u) * (1 - smooth(0.85, 1, u)));
    q.stretch(i, p.x - p0.x, p.y - p0.y, p.z - p0.z);
    q.look(i, o.frame, 0, 0.5);
  }
}
const A = new THREE.Vector3();
const B = new THREE.Vector3();

/** An attack-decay envelope: 0 before `t0`, up to 1 within `attack` ms, then falling with time constant `decay` ms. */
export const pulse = (ms: number, t0: number, attack: number, decay: number) => (ms < t0 ? 0 : smooth(0, attack, ms - t0) * Math.exp(-Math.max(0, ms - t0 - attack) / decay));
