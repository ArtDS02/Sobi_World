// The puppet runtime (decision 050): clips, warping onto a beat, determinism, crossfades, springs — and the rigs themselves, checked
// against the acceptance bar of docs/animation/rig/ACCEPTANCE.md (§A, the parts a test can measure).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../../public/assets/manifest/assets.json';
import { REQUIRED_CLIPS, rigProblems, type ClipData, type RigData } from '../../content/schemas/anim/rig';
import { buildSkin, clipTime, deformSkin, Performer, RIGS, sampleFaces, sampleTrack, solve, waveBend, type Frame, type World } from '../../src/systems/animation';
import { fadeWeight, poseFadeMs, warpTime } from '../../src/systems/animation';

const rigs = [...RIGS.values()];
const clip = (len: number, extra: Partial<ClipData> = {}): ClipData => ({ len, loop: false, fade: 120, marks: {}, tracks: {}, faces: {}, life: 1, waves: {}, ...extra });

/** Runs a performer frame by frame (60 fps) from `from` to `to` ms with one want, returning the last frame. */
function run(p: Performer, from: number, to: number, action: string, timing?: (t: number) => { t: number; marks?: Record<string, number> }): Frame {
  let f: Frame | null = null;
  for (let t = from; t <= to; t += 1000 / 60) f = p.update(t, { action, key: 'k', timing: timing?.(t - from) });
  return f!;
}

/** Where a bone is this frame (a skinned rig draws no picture on its body bones: the bone still moves the skin). */
const partAt = (f: Frame, bone: string) => f.worlds.get(bone);
const whole = (f: Frame) => JSON.stringify({ drawn: f.drawn, worlds: [...f.worlds], chains: [...f.chains] });

describe('clips and warping', () => {
  it('a change of drawing eases in, and takes the own fade of the clip right after it starts', () => {
    expect(fadeWeight(0, 60)).toBe(0);
    expect(fadeWeight(30, 60)).toBeCloseTo(0.5);
    expect(fadeWeight(10, 60)).toBeLessThan(10 / 60); // slow start
    expect(fadeWeight(50, 60)).toBeGreaterThan(50 / 60); // soft landing
    expect(fadeWeight(5, 0)).toBe(1);
    const hawk = RIGS.get('enemy_cliff_hawk')!;
    expect(poseFadeMs(hawk, 'move', 0)).toBe(hawk.clips.move!.fade); // stand → fly: the clip's crossfade
    expect(poseFadeMs(hawk, 'move', 300)).toBe(hawk.clips.move!.poseFade); // inside the wingbeat: short
    expect(poseFadeMs(hawk, 'attack', 600)).toBe(hawk.skin!.poseFade);
  });

  it('a track eases between keys and holds outside them; loops wrap, one-shots hold their end', () => {
    expect(sampleTrack([[0, 0], [100, 10, 'linear'], [200, 0]], 50)).toBeCloseTo(5);
    expect(sampleTrack([[100, 4], [200, 8]], 0)).toBe(4);
    expect(sampleTrack([[0, 0, 'hold'], [100, 9]], 99)).toBe(0);
    expect(clipTime({ len: 1000, loop: true }, 2300)).toBe(300);
    expect(clipTime({ len: 1000, loop: false }, 2300)).toBe(1000);
  });

  it('a beat lines the clip up: its release, contact and end land on the beat’s, however long the battle made it', () => {
    const c = clip(980, { marks: { windup: 250, release: 340, contact: 560, recover: 760 } });
    const marks = { release: 220, contact: 330, end: 650 };
    expect(warpTime(c, { t: 0, marks })).toBe(0);
    expect(warpTime(c, { t: 220, marks })).toBeCloseTo(340);
    expect(warpTime(c, { t: 330, marks })).toBeCloseTo(560);
    expect(warpTime(c, { t: 650, marks })).toBeCloseTo(980);
    // Monotonic: the clip never plays backwards inside a beat.
    let last = -1;
    for (let t = 0; t <= 700; t += 10) {
      const v = warpTime(c, { t, marks });
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
    // No marks: the clip plays at its own pace, faster for a quick species.
    expect(warpTime(c, { t: 100 }, 1.5)).toBe(150);
  });
});

describe('every rig (content/anim/rigs)', () => {
  it('loads, passes its own checks and has every clip of the prototype bar', () => {
    // The four body-plan prototypes, plus every fighter skinned from them (R2b).
    expect(rigs.map((r) => r.id)).toEqual(expect.arrayContaining(['fish_betta', 'octopus', 'pig_boar', 'pig_turtle']));
    expect(rigs.length).toBeGreaterThanOrEqual(22);
    for (const r of rigs) {
      expect(rigProblems(r)).toEqual([]);
      for (const c of REQUIRED_CLIPS) expect(r.clips[c], `${r.id}.${c}`).toBeDefined();
    }
  });

  it('every part picture is a manifest row with a file', () => {
    const rows = new Map(manifest.props.map((p) => [p.id, p as { id: string; asset?: string }]));
    for (const r of rigs)
      for (const [name, part] of Object.entries(r.parts)) {
        const row = rows.get(part.img);
        expect(row, `${r.id}.${name}`).toBeDefined();
        expect(existsSync(join('public/assets', row!.asset!)), part.img).toBe(true);
      }
  });

  // Pose to pose (decision 050, 2026-11-06 (5)): an action shows the creature's own approved drawing at the moment that matters.
  const posed = rigs.filter((r) => r.skin && Object.keys(r.skin.poses).length > 0);
  const poseAt = (r: RigData, clipName: string, t: number) => sampleFaces(r.clips[clipName]!, t).get('pose') ?? 'rest';

  it('every fighter and enemy with key poses is posed, and every action shows its own drawing at its moment', () => {
    expect(posed.length).toBeGreaterThanOrEqual(40);
    for (const r of posed) {
      const a = r.clips.attack!;
      expect(poseAt(r, 'attack', a.marks.contact!), `${r.id} attack at contact`).toBe('attack');
      expect(poseAt(r, 'attack', 0), `${r.id} attack starts at rest`).toBe('rest');
      expect(poseAt(r, 'attack', a.len), `${r.id} attack ends at rest`).toBe('rest');
      const c = r.clips.cast!;
      expect(poseAt(r, 'cast', c.marks.release!), `${r.id} cast at release`).toBe('cast');
      expect(poseAt(r, 'hurt', 0), `${r.id} hurt`).toBe('hurt');
      expect(poseAt(r, 'victory', 100), `${r.id} victory`).toBe('victory');
      expect(poseAt(r, 'ko', r.clips.ko!.len), `${r.id} ko`).toBe('ko');
      expect(Object.keys(r.clips).some((k) => k.startsWith('idle_')), `${r.id} fidget`).toBe(true);
    }
  });

  it('a creature with an approved windup drawing winds up on it, then strikes on the attack drawing', () => {
    const wound = posed.filter((r) => r.skin!.poses.windup);
    expect(wound.map((r) => r.id).sort()).toEqual(['enemy_ancient_guardian', 'pig_thienlong']); // pilot batch rig-02-windup
    for (const r of wound) {
      const a = r.clips.attack!;
      expect(poseAt(r, 'attack', a.marks.windup!), `${r.id} windup drawing at windup`).toBe('windup');
      expect(poseAt(r, 'attack', a.marks.release!), `${r.id} attack drawing at release`).toBe('attack');
      expect(poseAt(r, 'attack', a.marks.contact!), `${r.id} attack drawing at contact`).toBe('attack');
    }
    for (const r of posed.filter((x) => !x.skin!.poses.windup)) {
      const a = r.clips.attack!;
      expect(poseAt(r, 'attack', a.marks.windup!), `${r.id} no windup drawing: rest until the strike`).toBe('rest');
    }
  });

  it('a creature with approved move drawings cycles them 1 → 2 → 3 → 2 with a short eased fade and a body that keeps moving; the others move on their rest drawing', () => {
    const moving = posed.filter((r) => r.skin!.poses.move1 && r.skin!.poses.move2 && r.skin!.poses.move3);
    expect(moving.map((r) => r.id).sort()).toEqual(['enemy_cliff_hawk', 'fish_betta']); // pilot batch rig-03-move
    for (const r of moving) {
      const m = r.clips.move!;
      expect(m.loop, `${r.id} move loops`).toBe(true);
      const q = m.len / 4;
      expect([0, q, 2 * q, 3 * q].map((t) => poseAt(r, 'move', t + 10)), `${r.id} move cycle`).toEqual(['move1', 'move2', 'move3', 'move2']);
      // A drawing holds a quarter of the loop: the fade between two of them stays under half of it, and the body never stands still.
      expect(m.poseFade!, `${r.id} move fade`).toBeLessThanOrEqual(q / 2);
      const moving = (bone: string, ch: 'y' | 'rot') => { const k = m.tracks[bone]?.[ch]; return k ? Math.abs(sampleTrack(k, 10) - sampleTrack(k, q / 2)) : 0; };
      expect(Math.max(moving('root', 'y'), moving('body', 'y'), moving('root', 'rot'), moving('body', 'rot')), `${r.id} moves during a hold`).toBeGreaterThan(0.3);
    }
    for (const r of posed.filter((x) => !moving.includes(x))) expect(poseAt(r, 'move', 10), `${r.id} move`).toBe('rest');
  });

  it('a drawing stored shifted to fit the canvas is put back by its offset', () => {
    const hawk = RIGS.get('enemy_cliff_hawk')!;
    const [ox, oy] = hawk.skin!.offsets.move3!;
    const a = buildSkin(hawk, 1400, 'move3')!;
    const box = hawk.parts[hawk.skin!.poses.move3!]!.box;
    expect([a.rest[0], a.rest[1]]).toEqual([box[0] + ox, box[1] + oy]);
  });

  it('a strike is prepared: squash and lean back before the release, the stretch on it', () => {
    for (const r of posed) {
      const a = r.clips.attack!;
      const sy = (t: number) => sampleTrack(a.tracks.body!.sy!, t);
      const rot = (t: number) => sampleTrack(a.tracks.body!.rot!, t);
      expect(sy(a.marks.windup!), `${r.id} squash`).toBeLessThan(0.97);
      expect(rot(a.marks.windup!), `${r.id} lean back`).toBeLessThan(0);
      expect(sy(a.marks.release! + 30), `${r.id} stretch`).toBeGreaterThan(1);
    }
  });

  it('attacks and casts have anticipation, a contact / release and a recovery, in that order', () => {
    for (const r of rigs) {
      const a = r.clips.attack!;
      expect(a.marks.windup! < a.marks.release! && a.marks.release! < a.marks.contact! && a.marks.contact! < a.len, `${r.id} attack marks`).toBe(true);
      const c = r.clips.cast!;
      expect(c.marks.windup! < c.marks.release! && c.marks.release! < c.len, `${r.id} cast marks`).toBe(true);
    }
  });

  it('skill gestures and ultimates prepare, then let go on a drawing of their own (windup < release, contact when they land)', () => {
    for (const r of rigs)
      for (const [name, c] of Object.entries(r.clips)) {
        if (!name.startsWith('g_') && name !== 'ultimate') continue;
        expect(c.marks.windup! < c.marks.release! && c.marks.release! < c.len, `${r.id}.${name}`).toBe(true);
        if (c.marks.contact !== undefined) expect(c.marks.contact > c.marks.release!, `${r.id}.${name} contact`).toBe(true);
        if (posed.includes(r) && name !== 'g_brace') expect(poseAt(r, name, c.marks.release! + 20), `${r.id}.${name} drawing`).not.toBe('rest');
      }
  });

  it('species differ in tempo and weight: the turtle is slower and heavier than the boar, the fish the lightest', () => {
    const by = (id: string) => RIGS.get(id)!.feel;
    expect(by('pig_turtle').tempo).toBeLessThan(by('pig_boar').tempo);
    expect(by('pig_turtle').weight).toBeGreaterThan(by('pig_boar').weight);
    expect(by('fish_betta').weight).toBeLessThan(by('pig_turtle').weight);
  });
});

describe('the performer', () => {
  const boar = RIGS.get('pig_boar') as RigData;

  it('is deterministic: the same unit, the same calls, the same frames', () => {
    const a = run(new Performer(boar, 'u1'), 0, 4000, 'idle');
    const b = run(new Performer(boar, 'u1'), 0, 4000, 'idle');
    expect(whole(a)).toBe(whole(b));
  });

  it('two units of one species are never in step (own breath phase and blinks)', () => {
    const a = run(new Performer(boar, 'u1'), 0, 1500, 'idle');
    const b = run(new Performer(boar, 'u2'), 0, 1500, 'idle');
    expect(whole(a)).not.toBe(whole(b));
  });

  it('blinks on its own rhythm, and a long idle slips in a fidget', () => {
    const p = new Performer(boar, 'u3');
    const eyes = new Set<string>();
    const clips = new Set<string>();
    for (let t = 0; t < 20_000; t += 1000 / 30) {
      const f = p.update(t, { action: 'idle' });
      clips.add(f.clip);
      const e = f.drawn.find((d) => d.kind === 'part' && d.bone === 'eyes');
      if (e && e.kind === 'part') eyes.add(e.part);
    }
    // A posed rig has no blink (no closed-eye drawing is approved): it shows its drawn faces only.
    if (boar.feel.blink) expect(eyes.has('eyes_closed')).toBe(true);
    expect([...clips].some((c) => c.startsWith('idle_'))).toBe(true);
  });

  it('crossfades: the first frame of a new action starts where the body was (no pop)', () => {
    const p = new Performer(boar, 'u4');
    const before = run(p, 0, 1200, 'idle');
    const after = p.update(1200 + 16, { action: 'attack', key: 'a1', timing: { t: 400, marks: { release: 220, contact: 330, end: 650 } } });
    for (const bone of ['head', 'body']) {
      const x0 = partAt(before, bone)!;
      const x1 = partAt(after, bone)!;
      expect(Math.abs(x1.x - x0.x) + Math.abs(x1.y - x0.y), bone).toBeLessThan(6);
    }
  });

  it('an action whose clip the rig lacks falls back (a heal → buff → victory chain ends in a clip that exists)', () => {
    const p = new Performer(boar, 'u5');
    expect(p.clipName('hurt_crit')).toBe('hurt_heavy');
    expect(p.clipName('ultimate')).toBe('ultimate');
    expect(p.clipName('support')).toBe('cast');
    expect(p.clipName('nothing_like_it')).toBe('idle');
  });

  it('springs give overlap: a dash swings the head back, and it settles once the body stops', () => {
    const p = new Performer(boar, 'u6');
    run(p, 0, 500, 'idle');
    const rest = p.update(516, { action: 'idle' });
    const restRot = partAt(rest, 'head')!.rot - partAt(rest, 'body')!.rot;
    // The whole body accelerates to the right (a dash): fed to the springs as root motion.
    let f = rest;
    for (let i = 1; i <= 8; i++) {
      p.nudgeRoot(4 * i, 0);
      f = p.update(516 + i * 16, { action: 'idle' });
    }
    const swung = partAt(f, 'head')!.rot - partAt(f, 'body')!.rot;
    expect(swung).toBeLessThan(restRot - 0.02);
    f = run(p, 700, 3500, 'idle');
    const settled = partAt(f, 'head')!.rot - partAt(f, 'body')!.rot;
    expect(Math.abs(settled - restRot)).toBeLessThan(0.05);
  });

  it('chains bend: an octopus arm is curled, not a straight stick', () => {
    const f = run(new Performer(RIGS.get('octopus')!, 'u7'), 0, 400, 'idle');
    const arm = f.chains.get('arm_f1')!;
    expect(arm.length).toBeGreaterThan(3);
    const dir = (i: number) => Math.atan2(arm[i + 1]!.y - arm[i]!.y, arm[i + 1]!.x - arm[i]!.x);
    expect(Math.abs(dir(arm.length - 2) - dir(0))).toBeGreaterThan(0.5);
  });
});

describe('skins (the accepted picture bent by the rig)', () => {
  const skinned = rigs.filter((r) => r.skin);

  it('every rig is skinned, and each band of the grid fits one draw call', () => {
    expect(skinned.length).toBe(rigs.length);
    for (const r of skinned) for (const s of buildSkin(r)!.strips) expect(s.length, r.id).toBeLessThanOrEqual(1536);
  });

  it('at rest the picture lies exactly as drawn (no point moved)', () => {
    for (const r of skinned) {
      const mesh = buildSkin(r)!;
      const worlds = new Map<string, World>();
      const chains = new Map<string, { x: number; y: number }[]>();
      solve(r, new Map(), new Map(), (c, i) => waveBend(c, i, 0, { amp: 0, speed: 0, curl: c.curl }), worlds, chains);
      const pos = deformSkin(mesh, worlds, chains, new Float32Array(mesh.rest.length));
      let worst = 0;
      for (let i = 0; i < pos.length; i++) worst = Math.max(worst, Math.abs(pos[i]! - mesh.rest[i]!));
      expect(worst, r.id).toBeLessThan(0.01);
    }
  });

  it('a turning head bends the face, not the feet', () => {
    const boar = RIGS.get('pig_boar')!;
    const mesh = buildSkin(boar)!;
    const worlds = new Map<string, World>();
    const chains = new Map<string, { x: number; y: number }[]>();
    solve(boar, new Map([['head', { rot: 12, x: 0, y: 0, sx: 1, sy: 1 }]]), new Map(), () => 0, worlds, chains);
    const pos = deformSkin(mesh, worlds, chains, new Float32Array(mesh.rest.length));
    const moved = (x: number, y: number) => {
      let best = 0;
      let d = Infinity;
      for (let i = 0; i < mesh.rest.length; i += 2) {
        const e = Math.hypot(mesh.rest[i]! - x, mesh.rest[i + 1]! - y);
        if (e < d) [d, best] = [e, i];
      }
      return Math.hypot(pos[best]! - mesh.rest[best]!, pos[best + 1]! - mesh.rest[best + 1]!);
    };
    const eyes = boar.bones.find((b) => b.id === 'eyes')!.at;
    expect(moved(eyes[0], eyes[1])).toBeGreaterThan(5);
    expect(moved(-80, -10)).toBeLessThan(0.5);
  });
});
