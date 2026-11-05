// A creature's performer (decision 050): the state machine of one puppet. Every frame the caller says which action it wants (idle,
// move, attack, cast, hurt…) and, when a battle times it, how far into it it is and when its marks fall; the performer picks the clip
// (with fallbacks), lines it up with the beat (warp.ts), crossfades from whatever the body was doing, slips a fidget into a long idle,
// lays the life (breath, blink, chain waves, springs) under it and solves the skeleton. Holds only the state of one unit; all time is
// passed in, so the same calls give the same frames.
import type { ChainData, ClipData, RigData } from '../../../content/schemas/anim/rig';
import { clipTime, EASE, mixPose, sampleClip, sampleFaces, type LocalPose } from './clip';
import { blinkAt, breathe, hashOf, noise, stepSprings, type SpringState } from './life';
import { solve, waveBend, type Drawn, type World } from './skeleton';
import { warpTime, type ActionTiming } from './warp';

/** What the caller wants the body to do now. `key` changes when the same action starts again (a second attack). */
export interface Want {
  action: string;
  /** Clips tried first, in order, before `action` and its fallbacks (a skill's own clip `skill_<id>`, its gesture `g_<gesture>`). */
  alt?: readonly string[] | undefined;
  key?: string | undefined;
  timing?: ActionTiming | undefined;
}

/** Where an action falls back when a rig has no clip of that name (the last resort is always `idle`). */
export const FALLBACK: Readonly<Record<string, string>> = {
  hurt_heavy: 'hurt',
  hurt_crit: 'hurt_heavy',
  ko: 'hurt',
  dodge: 'move',
  buff: 'victory',
  heal: 'buff',
  debuff: 'hurt',
  guard: 'idle',
  stunned: 'hurt',
  charge: 'cast',
  enter: 'move',
  support: 'cast',
  ultimate: 'cast',
};

export interface Frame {
  drawn: Drawn[];
  worlds: ReadonlyMap<string, World>;
  /** The clip playing and its time (ms) — for the lab and the tests. */
  clip: string;
  t: number;
}

interface Playing {
  name: string;
  key: string;
  clip: ClipData;
  /** Real ms when it started (own clock, when the caller gives no timing). */
  since: number;
}

export class Performer {
  readonly seed: number;
  private cur: Playing | null = null;
  private from: LocalPose = new Map();
  private fadeFrom = 0;
  private fadeLen = 0;
  private pose: LocalPose = new Map();
  private scratch: LocalPose = new Map();
  private worlds = new Map<string, World>();
  private springs = new Map<string, SpringState>();
  private idleSince = 0;
  private fidget: { name: string; at: number } | null = null;
  private fidgets: string[];
  private last = -1;

  constructor(
    readonly rig: RigData,
    unitId: string,
  ) {
    this.seed = hashOf(unitId);
    this.fidgets = Object.keys(rig.clips).filter((k) => k.startsWith('idle_'));
  }

  /** The clip an action plays on this rig (fallbacks followed, `idle` last). */
  clipName(action: string, alt: readonly string[] = []): string {
    for (const c of alt) if (this.rig.clips[c]) return c;
    let a: string | undefined = action;
    for (let i = 0; i < 6 && a; i++) {
      if (this.rig.clips[a]) return a;
      a = FALLBACK[a];
    }
    return 'idle';
  }

  private switchTo(name: string, key: string, now: number) {
    // The body crossfades from exactly where it is (the pose of the last frame, springs included).
    this.from = new Map([...this.pose].map(([k, v]) => [k, { ...v }]));
    const clip = this.rig.clips[name]!;
    this.fadeFrom = now;
    this.fadeLen = this.cur ? clip.fade / this.rig.feel.tempo : 0;
    this.cur = { name, key, clip, since: now };
    if (name === 'idle') this.idleSince = now;
  }

  /** One frame: `dtMs` real ms since the last one, `now` the page clock (ms). */
  update(now: number, want: Want): Frame {
    const dt = this.last < 0 ? 16 : now - this.last;
    this.last = now;
    const wanted = this.clipName(want.action, want.alt);
    let name = wanted;
    let key = `${name}:${want.key ?? ''}`;
    // A long idle now and then plays one of the rig's fidgets (idle_*), then goes back to idling.
    if (name === 'idle' && !want.timing && this.fidgets.length > 0) {
      const f = this.fidget;
      if (f && now - f.at < this.rig.clips[f.name]!.len / this.rig.feel.tempo) [name, key] = [f.name, `fidget:${f.at}`];
      else if (this.cur?.name === 'idle' && now - this.idleSince > 5200 + noise(this.seed, Math.floor(this.idleSince)) * 5200) {
        const pick = this.fidgets[Math.floor(noise(this.seed, Math.floor(now / 997)) * this.fidgets.length)]!;
        this.fidget = { name: pick, at: now };
        [name, key] = [pick, `fidget:${now}`];
      } else this.fidget = null;
    }
    if (!this.cur || this.cur.key !== key) {
      // A one-shot that is over hands back to idle: an idle that follows it keeps its start (no restart of the breath).
      if (name === 'idle' && this.cur?.name === 'idle') this.cur.key = key;
      else this.switchTo(name, key, now);
    }
    const cur = this.cur!;
    const clip = cur.clip;
    const tempo = this.rig.feel.tempo;
    const raw = want.timing && name === wanted ? warpTime(clip, want.timing, tempo) : (now - cur.since) * tempo;
    const t = clipTime(clip, raw);
    if (cur.name !== 'idle' && !clip.loop && !want.timing && raw > clip.len + 60 && want.action !== cur.name) this.switchTo('idle', 'idle:', now);
    sampleClip(clip, t, this.scratch);
    // Crossfade from where the body was.
    const fk = this.fadeLen > 0 ? Math.min(1, (now - this.fadeFrom) / this.fadeLen) : 1;
    if (fk < 1) mixPose(this.from, this.scratch, EASE.inOut(fk), this.pose);
    else {
      this.pose.clear();
      for (const [k2, v] of this.scratch) this.pose.set(k2, { ...v });
    }
    const life = clip.life;
    breathe(this.rig, this.pose, now, this.seed, life);
    stepSprings(this.rig, this.springs, this.worlds, dt, this.pose);
    const faces = sampleFaces(clip, t);
    const eyes = this.rig.feel.blink;
    if (eyes && life > 0.3 && !faces.has(eyes.slot)) {
      const b = blinkAt(this.rig, now, this.seed);
      if (b) faces.set(eyes.slot, b);
    }
    const timeS = now / 1000 + noise(this.seed, 3) * 10;
    const bend = (c: ChainData, i: number) => {
      const own = clip.waves[c.id];
      const wave = own ?? c.wave;
      const k = own ? 1 : Math.max(0.15, life);
      // A chain's `sy` in the clip scales its curl (a tentacle coiling before a lash), its `sx` its length (solve()).
      const coil = this.pose.get(c.id)?.sy ?? 1;
      return waveBend(c, i, timeS, { amp: wave.amp * k, speed: wave.speed, phase: wave.phase, curl: (own?.curl ?? c.curl) * coil });
    };
    const drawn = solve(this.rig, this.pose, faces, bend, this.worlds);
    return { drawn, worlds: this.worlds, clip: cur.name, t };
  }

  /** Feeds the root's motion (canvas px) to the springs: a dash or a knock-back of the whole body swings the ears too. */
  nudgeRoot(dx: number, dy: number) {
    for (const st of this.springs.values()) {
      st.lastX -= dx;
      st.lastY -= dy;
    }
  }
}
