// The rod's mini-game (decision 035), three beats instead of one tap:
//   1. cast — a power bar swings; where it stops is how far the line lands (near shore, mid-lake, far out: further =
//      rarer fish, castLine `depth`, and a harder fight);
//   2. bite — the bobber floats and the fish's shadow circles, then swims in (so the bite can be seen coming), nibbles,
//      and bites: pull within the window for the best reaction. A pull too early only startles the fish (it comes back a
//      little later); the third early pull scares it off. No pull at all is not a miss: the fish hooks itself, with no
//      reaction to its score;
//   3. fight — hold to lift the catch zone and keep the fish's icon inside it until the line is reeled in.
// A shadow under the water says how big the fish is (a golden one is rare and worth a lot). The score sent to castLine
// mixes the reaction, the fight and the fish's size, plus a little for a streak of catches. Pure: time and randomness
// come in as numbers; the dialog (fishingDialog.ts) draws it.
import type { CastDepth } from '../logic/fishing';

export const ROD = {
  powerPeriodMs: 2000,
  /** Power shares where mid-lake and far out begin. */
  depthAt: [0.4, 0.75] as const,
  /** The real bite comes this long after the line lands; nibbles may come before it. */
  biteMs: [2000, 4200] as const,
  nibbleMs: 320,
  /** The shadow leaves its circle and swims in to the bobber this long before the bite. */
  approachMs: 1400,
  /** How long the bobber stays down at the real bite; past it the fish hooks itself (reaction 0). */
  biteWindowMs: 2200,
  /** A pull this quick after the bite reacts best. */
  quickMs: 350,
  /** Early pulls forgiven (the fish only startles); one more scares it off. */
  earlyGrace: 2,
  /** A startled fish comes back to bite this long after the early pull. */
  startleMs: [1300, 2400] as const,
  fight: {
    /** Catch zone height (share of the bar) by depth. */
    zone: [0.42, 0.36, 0.3] as const,
    /** Lift while held, fall when let go (share of the bar per s²), and the most speed either way. */
    lift: 2.2,
    gravity: 1.6,
    maxSpeed: 0.95,
    /** Line reeled in per second while the fish is inside, lost per second while outside. */
    gain: 0.24,
    loss: 0.14,
    start: 0.35,
    /** The fish darts to a new height this often (ms, shorter for bigger fish and further out). */
    moveMs: [1300, 600] as const,
    /** How far (share of the bar) and how fast the fish swims to a new height, before its size. */
    reach: 0.3,
    swim: 2.4,
    /** Most seconds a fight may last. */
    limitSec: 24,
  },
} as const;

export type ShadowSize = 'small' | 'medium' | 'big' | 'golden';

/** Power 0..1 `elapsed` ms after the swing started (a triangle wave). */
export function powerAt(elapsedMs: number): number {
  const p = (((elapsedMs / ROD.powerPeriodMs) % 1) + 1) % 1;
  return p < 0.5 ? p * 2 : 2 - p * 2;
}

export const depthOf = (power: number): CastDepth => (power >= ROD.depthAt[1] ? 2 : power >= ROD.depthAt[0] ? 1 : 0);

/**
 * The shadow on the line, drawn from a roll 0..1: further out the fish are bigger; a golden one is rare (more so near
 * the shore).
 */
export function shadowOf(roll: number, depth: CastDepth): ShadowSize {
  const golden = [0.02, 0.04, 0.07][depth]!;
  if (roll < golden) return 'golden';
  const big = golden + [0.12, 0.25, 0.4][depth]!;
  if (roll < big) return 'big';
  const medium = big + [0.4, 0.4, 0.35][depth]!;
  return roll < medium ? 'medium' : 'small';
}

/** When the nibbles and the real bite come, from two rolls 0..1 (ms after the line lands). */
export function biteTimes(rollA: number, rollB: number): { bite: number; nibbles: number[] } {
  const bite = ROD.biteMs[0] + rollA * (ROD.biteMs[1] - ROD.biteMs[0]);
  const count = rollB < 0.35 ? 0 : rollB < 0.75 ? 1 : 2;
  const nibbles = Array.from({ length: count }, (_, i) => bite * ((i + 1) / (count + 1)) * (0.85 + rollB * 0.1));
  return { bite, nibbles };
}

/**
 * How far the shadow is from the bobber, `toBite` ms before the bite: 1 while it circles, then down to 0 (under the
 * bobber) over ROD.approachMs. A nibble brings it halfway in.
 */
export const shadowGap = (toBite: number, nibbling: boolean): number => {
  const gap = Math.max(0, Math.min(1, toBite / ROD.approachMs));
  return nibbling ? gap / 2 : gap;
};

/** 0..1: how much of the bite window is left `sinceBite` ms after the bite (the pull button's countdown). */
export const biteLeft = (sinceBite: number): number => Math.max(0, Math.min(1, 1 - sinceBite / ROD.biteWindowMs));

/** 0..1: how quick the pull was after the bite (1 within ROD.quickMs, 0 at the end of the window). */
export const reactionOf = (ms: number): number => Math.max(0, Math.min(1, 1 - (ms - ROD.quickMs) / (ROD.biteWindowMs - ROD.quickMs)));

/**
 * A pull before the bite, the `early`-th one (1 = the first). Within the grace the fish only startles: the bite moves to
 * `startleMs` after the pull (`roll` 0..1 picks where) and the nibbles still to come are dropped. Past it the fish is gone.
 */
export function earlyPull(sinceMs: number, early: number, roll: number): { bite: number } | 'gone' {
  if (early > ROD.earlyGrace) return 'gone';
  return { bite: sinceMs + ROD.startleMs[0] + roll * (ROD.startleMs[1] - ROD.startleMs[0]) };
}

/** Size factor of a shadow: how hard the fish pulls, and what it adds to the score once landed. */
export const SHADOW = {
  small: { pull: 0.75, bonus: 0 },
  medium: { pull: 1, bonus: 0.06 },
  big: { pull: 1.3, bonus: 0.14 },
  golden: { pull: 1.5, bonus: 0.35 },
} as const satisfies Record<ShadowSize, { pull: number; bonus: number }>;

export interface Fight {
  /** Catch zone bottom (0 = bottom of the bar) and its speed. */
  zone: number;
  zoneV: number;
  /** The fish's height, where it is heading and when it moves next. */
  fish: number;
  fishTarget: number;
  nextMoveAt: number;
  /** 0..1 line reeled in; 1 = landed, 0 = got away. */
  progress: number;
  /** Seconds in total and inside the zone (the accuracy). */
  time: number;
  inside: number;
}

/** The fight starts with the fish in the middle of the catch zone, so the first second is not already lost. */
export const startFight = (depth: CastDepth = 0): Fight => ({
  zone: 0.5 - ROD.fight.zone[depth] / 2,
  zoneV: 0,
  fish: 0.5,
  fishTarget: 0.5,
  nextMoveAt: 1,
  progress: ROD.fight.start,
  time: 0,
  inside: 0,
});

/** One step of `dt` s. `roll` (0..1) picks the fish's next height when it is time to move. */
export function stepFight(f: Fight, dt: number, holding: boolean, depth: CastDepth, size: ShadowSize, roll: number): Fight {
  const c = ROD.fight;
  const zoneH = c.zone[depth];
  const accel = holding ? c.lift : -c.gravity;
  let zoneV = Math.max(-c.maxSpeed, Math.min(c.maxSpeed, f.zoneV + accel * dt));
  let zone = f.zone + zoneV * dt;
  if (zone < 0 || zone > 1 - zoneH) {
    zone = Math.max(0, Math.min(1 - zoneH, zone));
    zoneV = 0;
  }
  const pull = SHADOW[size].pull * (1 + depth * 0.15);
  let { fishTarget, nextMoveAt } = f;
  const time = f.time + dt;
  if (time >= nextMoveAt) {
    // A bigger fish jumps further and more often.
    const reach = Math.min(1, c.reach * pull);
    fishTarget = Math.max(0.04, Math.min(0.96, f.fish + (roll * 2 - 1) * reach));
    const gap = c.moveMs[0] - (c.moveMs[0] - c.moveMs[1]) * Math.min(1, (pull - 0.75) / 1.05);
    nextMoveAt = time + gap / 1000;
  }
  const fish = f.fish + (fishTarget - f.fish) * Math.min(1, dt * c.swim * pull);
  const isIn = fish >= zone && fish <= zone + zoneH;
  const progress = Math.max(0, Math.min(1, f.progress + (isIn ? c.gain / Math.sqrt(pull) : -c.loss) * dt));
  return { zone, zoneV, fish, fishTarget, nextMoveAt, progress, time, inside: f.inside + (isIn ? dt : 0) };
}

export const fightOver = (f: Fight): 'landed' | 'escaped' | null => (f.progress >= 1 ? 'landed' : f.progress <= 0 || f.time >= ROD.fight.limitSec ? 'escaped' : null);

/**
 * The score castLine gets (0..1). An escaped fish scores 0 (castLine's miss). A landed one: the fight's accuracy
 * and the reaction, plus the size's bonus and a little per catch of the streak (up to 5).
 */
export function rodScore(outcome: 'landed' | 'escaped', reaction: number, f: Fight, size: ShadowSize, streak: number): number {
  if (outcome === 'escaped') return 0;
  const accuracy = f.time > 0 ? f.inside / f.time : 0;
  const base = 0.3 + 0.35 * accuracy + 0.2 * reaction;
  return Math.max(0, Math.min(1, base + SHADOW[size].bonus + Math.min(5, streak) * 0.03));
}
