// How a fish of the Aquarium swims (GĐ14): its body bends in a wave that beats its tail (fishBody.ts), its velocity follows where it wants to go (so it speeds up, slows down
// near the spot and swims curves instead of sliding), its tail beats faster the faster it goes, its body tilts with
// the climb, it narrows and flips to turn round, rests with a little bob, darts now and then and lets out a bubble.
// A hungry fish keeps near the surface, a sick one near the bottom. The maths are pure (steer, nextLeg); Swimmer
// carries one fish's picture. Each species moves in its own way (swimStyles.ts, decision 035): an eel ripples, a jellyfish
// pulses, an octopus jets, a turtle paddles, a ray flaps, a seahorse floats upright, a dolphin porpoises.
// Presentation only: none of it is state.
import type { Rng } from '../../../core/rng';
import { AQUARIUM_VIEW, type Box } from './aquariumView';
import type { FishBody } from './fishBody';
import { bendAt, KIND_PERIOD_MS, kindFrame, pulseAt, swimStyleOf, type SwimStyle } from './swimStyles';

export interface Motion {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** One frame of motion towards (tx, ty) at up to `max` px/s: the velocity eases towards the wish, which slows inside `arrive`. */
export function steer(m: Motion, tx: number, ty: number, max: number, dtSec: number): Motion {
  const { steer: rate, arrive } = AQUARIUM_VIEW.swim;
  const dx = tx - m.x;
  const dy = ty - m.y;
  const dist = Math.hypot(dx, dy);
  const want = dist < 0.5 ? 0 : dist < arrive ? (max * dist) / arrive : max;
  const wx = dist < 0.5 ? 0 : (dx / dist) * want;
  const wy = dist < 0.5 ? 0 : (dy / dist) * want;
  const k = Math.min(1, rate * dtSec);
  const vx = m.vx + (wx - m.vx) * k;
  const vy = m.vy + (wy - m.vy) * k;
  return { x: m.x + vx * dtSec, y: m.y + vy * dtSec, vx, vy };
}

/** Bend of the body at `u` (0 = tail end, 1 = nose), as a share of the sprite's height. Pure, for the test. */
export const bodyWave = (u: number, phase: number, amount: number): number => bendAt('tail', u, phase, amount);

export type Mood = 'calm' | 'hungry' | 'sick';

/**
 * The next spot to swim to: anywhere across, but only `climb` up or down; a hungry fish stays in the top third, a sick
 * one (and a bottom dweller, `low`) in the bottom half.
 */
export function nextLeg(rng: Rng, at: { y: number }, box: Box, mood: Mood, low = false): { x: number; y: number } {
  const { climb } = AQUARIUM_VIEW.swim;
  const top = box.top + 30;
  const bottom = box.bottom - 30;
  const h = bottom - top;
  const [lo, hi] = mood === 'hungry' ? [top, top + h / 3] : mood === 'sick' || low ? [top + h / 2, bottom] : [top, bottom];
  // A hungry fish goes up to the surface now and then, to nibble at it.
  if (mood === 'hungry' && rng.next() < 0.35) return { x: box.left + 60 + rng.next() * (box.right - box.left - 120), y: box.top + 14 };
  const y = Math.min(hi, Math.max(lo, at.y + (rng.next() * 2 - 1) * climb));
  return { x: box.left + 60 + rng.next() * (box.right - box.left - 120), y };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** What a swimmer asks of the scene: a bubble at its mouth. */
export interface SwimHooks {
  bubble(x: number, y: number): void;
}

export class Swimmer {
  m: Motion;
  tx: number;
  ty: number;
  restUntil = 0;
  facing: 1 | -1 = 1;
  /** 0 while not turning, else how far the turn is (0..1). */
  private turn = 0;
  private phase: number;
  private readonly seed: number;
  private boostUntil = 0;
  private boost = 1;
  private gulpAt = -Infinity;
  private bubbleAt: number;
  /** Size of the fish (from its growth); the picture is drawn at this times the beat. */
  base = 1;
  mood: Mood = 'calm';
  /** Last meal seen by the scene (a new one drops food). */
  fedAt: number | null = null;
  /** Pellets this fish is still to eat after a meal. */
  appetite = 0;
  /** Its Bond hearts (hearts float up when it is clicked). */
  hearts = 0;
  /** When it may nibble at the surface again. */
  nibbleAt = 0;
  private styleOf = '';
  private styleCache: SwimStyle = swimStyleOf('');

  /** How this species moves (swimStyles.ts). */
  get style(): SwimStyle {
    if (this.styleOf !== this.species) {
      this.styleOf = this.species;
      this.styleCache = swimStyleOf(this.species);
    }
    return this.styleCache;
  }

  /** This frame's extra of the species' own motion (pulse, jet, stroke, flap…). */
  private kind(time: number) {
    const k = this.style.kind;
    return kindFrame(k, pulseAt(time, KIND_PERIOD_MS[k], this.seed / (Math.PI * 2)), time, this.seed);
  }

  constructor(
    readonly img: FishBody,
    readonly icon: Phaser.GameObjects.Text,
    readonly rng: Rng,
    public species: string,
  ) {
    this.m = { x: img.obj.x, y: img.obj.y, vx: 0, vy: 0 };
    this.tx = img.obj.x;
    this.ty = img.obj.y;
    this.seed = rng.next() * Math.PI * 2;
    this.phase = this.seed;
    this.bubbleAt = rng.next() * 4000;
  }

  /** Puts the fish somewhere at rest (a new place). */
  place(x: number, y: number) {
    this.m = { x, y, vx: 0, vy: 0 };
    this.tx = x;
    this.ty = y;
    this.appetite = 0;
  }

  /** Swim faster for a while (a dart, the joy of clean water, the rush to food). */
  hurry(time: number, factor: number, ms: number) {
    this.boost = factor;
    this.boostUntil = time + ms;
  }

  gulp(time: number) {
    this.gulpAt = time;
  }

  private topSpeed(time: number, chase: number): number {
    const { speed, sickFactor } = AQUARIUM_VIEW.swim;
    const sick = this.mood === 'sick' ? sickFactor : 1;
    return speed * this.style.speed * this.kind(time).speed * this.base * sick * Math.max(chase, time < this.boostUntil ? this.boost : 1);
  }

  /**
   * One frame. `food` is the pellet it is going for (it chases at `chase` times its speed), or null to wander the
   * water: at its spot it rests, then picks the next leg.
   */
  update(time: number, delta: number, box: Box, food: { x: number; y: number } | null, chase: number, hooks: SwimHooks) {
    const s = AQUARIUM_VIEW.swim;
    const dt = Math.min(delta, 50) / 1000;
    const max = this.topSpeed(time, food ? chase : 1);
    const tx = food ? food.x : this.tx;
    // Food still in the air: wait just under the surface.
    const ty = food ? Math.max(food.y, box.top + 12) : this.ty;
    this.m = steer(this.m, tx, ty, max, dt);
    // Its own up-and-down: a jellyfish rises on a pulse and sinks, a dolphin porpoises, a seahorse bobs.
    const drift = food ? 0 : this.kind(time).drift;
    if (drift !== 0) this.m = { ...this.m, y: Math.min(box.bottom - 20, Math.max(box.top + 16, this.m.y + drift * dt)) };
    if (!food && Math.hypot(this.tx - this.m.x, this.ty - this.m.y) < 8 && time >= this.restUntil) {
      if (this.restUntil > 0) {
        const leg = nextLeg(this.rng, this.m, box, this.mood, this.style.low);
        this.tx = leg.x;
        this.ty = leg.y;
        if (this.mood !== 'sick' && this.rng.next() < s.dart.chance * this.style.dart) this.hurry(time, s.dart.factor, s.dart.ms);
      }
      this.restUntil = time + (s.pauseMs[0] + this.rng.next() * (s.pauseMs[1] - s.pauseMs[0])) * this.style.rest;
    }
    this.draw(time, dt, hooks);
  }

  private draw(time: number, dt: number, hooks: SwimHooks) {
    const s = AQUARIUM_VIEW.swim;
    const st = this.style;
    const k = this.kind(time);
    const speed = Math.hypot(this.m.vx, this.m.vy);
    const effort = Math.min(1, speed / Math.max(1, s.speed * this.base));
    // Turning round: the body narrows to a sliver, flips, and widens again.
    const wants: 1 | -1 = this.m.vx > 6 ? 1 : this.m.vx < -6 ? -1 : this.facing;
    if (this.turn === 0 && wants !== this.facing) this.turn = 0.001;
    if (this.turn > 0) {
      const before = this.turn;
      this.turn = Math.min(1, this.turn + (dt * 1000) / s.turnMs);
      if (before < 0.5 && this.turn >= 0.5) this.facing = this.facing === 1 ? -1 : 1;
      if (this.turn >= 1) this.turn = 0;
    }
    // A round body (jellyfish, turtle, boxfish…) does not show a flat side: it only squeezes a little as it turns.
    const narrow = this.turn > 0 ? (st.narrowTurn ? Math.max(0.12, Math.abs(Math.cos(Math.PI * this.turn))) : 0.85 + 0.15 * Math.abs(Math.cos(Math.PI * this.turn))) : 1;
    // The tail beat: quicker and wider with speed (and while turning); a resting fish just fans. The body bends in a
    // wave and the whole fish rocks a little against its tail.
    const push = Math.max(effort, this.turn > 0 ? 0.8 : 0);
    this.phase += dt * Math.PI * 2 * lerp(s.wagHz[0], s.wagHz[1], push) * st.beat;
    // Only a body that bends rocks against its tail; stiff ones get their own rock (kindFrame).
    const wag = st.bend === 'tail' || st.bend === 'body' ? -Math.sin(this.phase) * lerp(s.wagRad[0], s.wagRad[1], push) * this.facing : 0;
    const bend = lerp(s.bend[0], s.bend[1], push) * st.bendMul;
    const tiltMax = s.tiltMax * st.tilt;
    const tilt = Math.max(-tiltMax, Math.min(tiltMax, Math.atan2(this.m.vy, Math.abs(this.m.vx) + 4) * st.tilt)) * this.facing;
    const beat = st.bend === 'none' ? 0 : Math.sin(this.phase * 2) * s.squash;
    const gulpT = (time - this.gulpAt) / AQUARIUM_VIEW.feed.gulpMs;
    const gulp = gulpT >= 0 && gulpT < 1 ? 1 + 0.16 * Math.sin(Math.PI * gulpT) : 1;
    const bob = Math.sin(time / 700 + this.seed) * s.bobPx * (1 - effort * 0.7);
    const sx = this.base * (1 + beat) * narrow * gulp * k.sx;
    this.img.pose(this.m.x, this.m.y + bob, this.facing === -1, tilt * 0.8 + wag + k.rot * this.facing, sx, this.base * (1 - beat * 0.7) * gulp * k.sy, this.phase, bend, st.bend);
    this.icon.setPosition(this.m.x, this.m.y + bob - this.img.displayHeight * 0.6);
    if (time >= this.bubbleAt) {
      this.bubbleAt = time + s.bubbleMs[0] + this.rng.next() * (s.bubbleMs[1] - s.bubbleMs[0]);
      hooks.bubble(this.m.x + this.facing * this.img.displayWidth * 0.42, this.m.y - this.img.displayHeight * 0.1);
    }
  }

  /** Holds still where it is (reduced motion). */
  still() {
    this.img.pose(this.m.x, this.m.y, this.facing === -1, 0, this.base, this.base, 0, 0, 'none');
    this.icon.setPosition(this.m.x, this.m.y - this.img.displayHeight * 0.6);
  }
}

/** Where a fish at `m` flees from a poke at `at`: straight away from it by `dist` px, kept inside `box`. */
export function fleeFrom(m: { x: number; y: number }, at: { x: number; y: number }, box: Box, dist: number): { x: number; y: number } {
  const dx = m.x - at.x;
  const dy = m.y - at.y;
  const len = Math.hypot(dx, dy);
  // Poked right on its nose: it bolts sideways, the way it faces away from the middle of the water.
  const [ux, uy] = len < 1 ? [m.x < (box.left + box.right) / 2 ? -1 : 1, 0] : [dx / len, dy / len];
  return {
    x: Math.min(box.right - 30, Math.max(box.left + 30, m.x + ux * dist)),
    y: Math.min(box.bottom - 30, Math.max(box.top + 30, m.y + uy * dist * 0.6)),
  };
}

/** A poke in the water at `at` (a click on empty water): the fish within reach dart away. Returns how many fled. */
export function scatterFrom(swimmers: Iterable<Swimmer>, at: { x: number; y: number }, box: Box, time: number): number {
  const t = AQUARIUM_VIEW.moments.tease;
  let fled = 0;
  for (const s of swimmers) {
    if (Math.hypot(s.m.x - at.x, s.m.y - at.y) > t.radius) continue;
    const to = fleeFrom(s.m, at, box, t.flee);
    s.tx = to.x;
    s.ty = to.y;
    s.restUntil = 0;
    s.hurry(time, t.factor, t.ms);
    fled += 1;
  }
  return fled;
}
