import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { parseManifest } from '../../src/core/assets/manifestSchema';
import { FARM_VIEW } from '../../src/core/config/farmView';
import { FEEDBACK_TABLE } from '../../src/game/feedback/feedbackTable';
import {
  FEEDBACK_STATE,
  canWander,
  pigVisualState,
  type ActiveFeedback,
} from '../../src/game/state/pigVisualState';
import {
  clampToEllipse,
  facesLeft,
  separation,
  walkDistance,
  walkEllipse,
  walkMs,
  wanderTarget,
} from '../../src/game/state/wander';

const parsed = parseManifest(structuredClone(manifestJson));
if (!parsed.ok) throw new Error(parsed.message);
const layout = parsed.manifest.layout;

const healthy = { isSick: false, pregnancy: null };
const sick = { isSick: true, pregnancy: null };
const pregnancy = {
  startedAt: 0,
  endsAt: 1,
  fatherId: 'f',
  childBreed: 'PIG_EARTH_PINK' as const,
  childGender: 'MALE' as const,
};
const pregnant = { isSick: false, pregnancy };
const eating: ActiveFeedback = { state: 'eat', until: 1000 };

describe('pigVisualState (spec §11)', () => {
  it('priority: feedback > sick > pregnant > sleep > walk > idle', () => {
    expect(pigVisualState({ isSick: true, pregnancy }, 500, eating, 'nap')).toBe('eat');
    expect(pigVisualState({ isSick: true, pregnancy }, 500, null, 'nap')).toBe('sick');
    expect(pigVisualState(pregnant, 500, null, 'nap')).toBe('pregnant');
    expect(pigVisualState(healthy, 500, eating, 'nap')).toBe('eat');
    expect(pigVisualState(healthy, 500, null, 'nap')).toBe('sleep');
    expect(pigVisualState(healthy, 500, null, 'walk')).toBe('walk');
    expect(pigVisualState(healthy, 500, null)).toBe('idle');
  });

  it('a feedback state ends at `until`', () => {
    expect(pigVisualState(healthy, 999, eating)).toBe('eat');
    expect(pigVisualState(healthy, 1000, eating)).toBe('idle');
  });

  it('sleep only comes from a nap (DECISIONS R09B-1)', () => {
    for (const care of [healthy, sick, pregnant])
      for (const motion of ['still', 'walk'] as const)
        expect(pigVisualState(care, 0, null, motion)).not.toBe('sleep');
  });

  it('feedback table animations map to eat / clean / happy', () => {
    expect(FEEDBACK_STATE[FEEDBACK_TABLE.PIG_FED.animation!]).toBe('eat');
    expect(FEEDBACK_STATE[FEEDBACK_TABLE.PIG_CLEANED.animation!]).toBe('clean');
    expect(FEEDBACK_STATE[FEEDBACK_TABLE.PIG_TREATED.animation!]).toBe('happy');
    expect(FEEDBACK_STATE[FEEDBACK_TABLE.BREEDING_STARTED.animation!]).toBe('happy');
    expect(FEEDBACK_STATE.popIn).toBeUndefined();
  });

  it('wandering pauses while selected, interacting, sick or pregnant', () => {
    expect(canWander(healthy, 0, null, false)).toBe(true);
    expect(canWander(healthy, 0, null, true)).toBe(false);
    expect(canWander(healthy, 500, eating, false)).toBe(false);
    expect(canWander(healthy, 1000, eating, false)).toBe(true);
    expect(canWander(sick, 0, null, false)).toBe(false);
    expect(canWander(pregnant, 0, null, false)).toBe(false);
  });
});

describe('wandering (spec §11, art §2.4) — visual only, inside the walk ellipse', () => {
  const e = walkEllipse(layout);
  const inside = (p: { x: number; y: number }) =>
    ((p.x - e.cx) / e.rx) ** 2 + ((p.y - e.cy) / e.ry) ** 2 <= 1 + 1e-9;

  it('targets stay inside the walk ellipse, deterministically', () => {
    for (let step = 0; step < 200; step += 1) {
      expect(inside(wanderTarget('pig-1', step, layout))).toBe(true);
    }
    expect(wanderTarget('pig-1', 3, layout)).toEqual(wanderTarget('pig-1', 3, layout));
    expect(wanderTarget('pig-1', 3, layout)).not.toEqual(wanderTarget('pig-2', 3, layout));
  });

  it('targets keep clear of the other pigs when there is room', () => {
    const others = [
      { x: e.cx, y: e.cy },
      { x: e.cx - e.rx / 2, y: e.cy },
    ];
    for (let step = 0; step < 50; step += 1) {
      const t = wanderTarget('pig-1', step, layout, others);
      const gap = Math.min(...others.map((o) => Math.hypot(o.x - t.x, o.y - t.y)));
      expect(gap).toBeGreaterThanOrEqual(FARM_VIEW.WANDER.minGapPx);
    }
  });

  it('walk times are bounded; facing follows the walk direction', () => {
    expect(walkDistance(0, 80)).toBeCloseTo(80 / FARM_VIEW.WANDER.ySpeed);
    expect(walkMs(0)).toBe(FARM_VIEW.WANDER.minWalkMs);
    expect(walkMs(FARM_VIEW.WANDER.speedPx * 10)).toBe(10_000);
    expect(facesLeft(100, 50, false)).toBe(true);
    expect(facesLeft(100, 150, true)).toBe(false);
    expect(facesLeft(100, 100, true)).toBe(true);
  });
});

describe('separation (farm layout rework) — crowded pigs drift apart', () => {
  it('pushes a close pair apart symmetrically, leaves distant pigs alone', () => {
    const push = separation(
      [
        { id: 'a', x: 500, y: 500 },
        { id: 'b', x: 540, y: 500 },
        { id: 'c', x: 900, y: 500 },
      ],
      5,
    );
    expect(push.get('a')!.dx).toBeCloseTo(-5);
    expect(push.get('b')!.dx).toBeCloseTo(5);
    expect(push.has('c')).toBe(false);
  });

  it('splits pigs standing on the same spot', () => {
    const push = separation(
      [
        { id: 'a', x: 500, y: 500 },
        { id: 'b', x: 500, y: 500 },
      ],
      5,
    );
    expect(Math.hypot(push.get('a')!.dx, push.get('a')!.dy)).toBeCloseTo(5);
  });

  it('clampToEllipse keeps a pushed pig inside the walk area', () => {
    const e = walkEllipse(layout);
    const p = clampToEllipse(layout, { x: e.cx + e.rx * 2, y: e.cy });
    expect(p.x).toBeCloseTo(e.cx + e.rx);
  });
});
