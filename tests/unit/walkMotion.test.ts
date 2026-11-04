import { describe, expect, it } from 'vitest';
import {
  FACING_HOLD_MS, FPS_MAX, FPS_MIN, approachVelocity, followerBob, followerFlip, frameRate, leaderBob, pickFace, snapToPixel, stepLift, unitOf, type FaceState,
} from '../../src/areas/adventure/logic/walkMotion';

const run = (target: { x: number; y: number }, from = { x: 0, y: 0 }, ms = 0, dt = 16) => {
  let v = from;
  for (let t = 0; t < ms; t += dt) v = approachVelocity(v, target, dt);
  return v;
};

describe('walk velocity (ANIM-090)', () => {
  it('speeds up over ~0.1 s instead of jumping to full speed', () => {
    expect(run({ x: 1, y: 0 }, { x: 0, y: 0 }, 16).x).toBeLessThan(0.3);
    const at120 = run({ x: 1, y: 0 }, { x: 0, y: 0 }, 128).x;
    expect(at120).toBeGreaterThan(0.7);
    expect(at120).toBeLessThan(1);
  });
  it('slows down over ~0.1 s and comes to rest', () => {
    const at64 = run({ x: 0, y: 0 }, { x: 1, y: 0 }, 64).x;
    expect(at64).toBeGreaterThan(0.1);
    expect(at64).toBeLessThan(0.5);
    expect(run({ x: 0, y: 0 }, { x: 1, y: 0 }, 600)).toEqual({ x: 0, y: 0 });
  });
  it('a diagonal is not faster', () => {
    expect(Math.hypot(unitOf({ x: 1, y: 1 }).x, unitOf({ x: 1, y: 1 }).y)).toBeCloseTo(1);
    expect(unitOf({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
  it('snaps to whole screen pixels', () => {
    expect(snapToPixel(10.4, 1)).toBe(10);
    expect(snapToPixel(10.3, 2)).toBe(10.5);
  });
});

describe('step cycle (ANIM-091)', () => {
  it('steps faster the faster it walks, within bounds', () => {
    expect(frameRate(260)).toBeCloseTo(8.67, 1);
    expect(frameRate(100)).toBeGreaterThan(FPS_MIN - 1e-9);
    expect(frameRate(10)).toBe(FPS_MIN);
    expect(frameRate(5000)).toBe(FPS_MAX);
    expect(frameRate(130)).toBeLessThan(frameRate(260));
  });
  it('a foot is down at whole steps and the body is highest between them', () => {
    expect(stepLift(0)).toBeCloseTo(0);
    expect(stepLift(1)).toBeCloseTo(0);
    expect(stepLift(0.5)).toBeCloseTo(1);
    const top = leaderBob(0.5, false);
    expect(top.lift).toBeCloseTo(5);
    expect(top.sy).toBeCloseTo(1);
    expect(leaderBob(1, false).sy).toBeCloseTo(0.96);
  });
  it('walking up or down sways more than walking sideways', () => {
    expect(Math.abs(leaderBob(0.5, true).rot)).toBeGreaterThan(Math.abs(leaderBob(0.5, false).rot));
  });
});

describe('facing (ANIM-092)', () => {
  const st: FaceState = { shown: 'down', pending: null, pendingMs: 0 };
  it('a straight move turns the face at once', () => {
    expect(pickFace({ x: 1, y: 0 }, st, 16).shown).toBe('right');
    expect(pickFace({ x: 0, y: -1 }, st, 16).shown).toBe('up');
  });
  it('a diagonal turns the face only after it has held', () => {
    let f: FaceState = { shown: 'down', pending: null, pendingMs: 0 };
    const d = { x: 1, y: -0.2 };
    f = pickFace(d, f, 16);
    expect(f.shown).toBe('down');
    for (let t = 0; t < FACING_HOLD_MS; t += 16) f = pickFace(d, f, 16);
    expect(f.shown).toBe('right');
  });
  it('an even diagonal keeps the face that is one of its axes', () => {
    expect(pickFace({ x: 1, y: 1 }, { shown: 'down', pending: null, pendingMs: 0 }, 16).shown).toBe('down');
    expect(pickFace({ x: 1, y: 1 }, { shown: 'right', pending: null, pendingMs: 0 }, 16).shown).toBe('right');
  });
  it('keeps the face when no key is held', () => {
    expect(pickFace({ x: 0, y: 0 }, { shown: 'left', pending: null, pendingMs: 0 }, 16).shown).toBe('left');
  });
});

describe('followers (ANIM-093)', () => {
  it('bob in step with the leader, a little behind each one before', () => {
    expect(followerBob(0.5, 0, 1, 0).lift).toBeCloseTo(6);
    expect(followerBob(0.5, 1, 1, 0).lift).not.toBeCloseTo(followerBob(0.5, 0, 1, 0).lift);
  });
  it('stop bobbing when the party stops and breathe instead', () => {
    expect(followerBob(0.5, 0, 0, 0).lift).toBe(0);
    const s = Array.from({ length: 20 }, (_, i) => followerBob(0, 0, 0, i * 110).sy);
    expect(Math.max(...s)).toBeGreaterThan(1.005);
    expect(Math.max(...s)).toBeLessThanOrEqual(1.021);
  });
  it('face the way they are heading and keep it when hardly moving', () => {
    expect(followerFlip({ x: 100, y: 0 }, { x: 90, y: 0 }, false)).toBe(true);
    expect(followerFlip({ x: 100, y: 0 }, { x: 110, y: 0 }, true)).toBe(false);
    expect(followerFlip({ x: 100, y: 0 }, { x: 100.2, y: 0 }, true)).toBe(true);
  });
});
