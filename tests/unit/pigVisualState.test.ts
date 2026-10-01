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
import { facesLeft, restMs, walkMs, wanderTarget } from '../../src/game/state/wander';

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

describe('wandering (spec §11, art §2.4) — visual only, inside walkArea', () => {
  const { width, height } = layout.designSize;
  const a = layout.walkArea;
  const home = { x: (a.x + a.width / 2) * width, y: (a.y + a.height / 2) * height };

  it('targets stay inside the walk area and near home, deterministically', () => {
    for (let step = 0; step < 200; step += 1) {
      for (const h of [home, { x: a.x * width, y: a.y * height }]) {
        const t = wanderTarget('pig-1', step, h, layout);
        expect(t.x).toBeGreaterThanOrEqual(a.x * width - 1e-6);
        expect(t.x).toBeLessThanOrEqual((a.x + a.width) * width + 1e-6);
        expect(t.y).toBeGreaterThanOrEqual(a.y * height - 1e-6);
        expect(t.y).toBeLessThanOrEqual((a.y + a.height) * height + 1e-6);
        expect(Math.abs(t.x - h.x)).toBeLessThanOrEqual(FARM_VIEW.WANDER.radius * width + 1e-6);
      }
    }
    expect(wanderTarget('pig-1', 3, home, layout)).toEqual(wanderTarget('pig-1', 3, home, layout));
    expect(wanderTarget('pig-1', 3, home, layout)).not.toEqual(
      wanderTarget('pig-2', 3, home, layout),
    );
  });

  it('rest and walk times are bounded; facing follows the walk direction', () => {
    for (let s = 0; s < 50; s += 1) {
      const r = restMs('pig-1', s);
      expect(r).toBeGreaterThanOrEqual(FARM_VIEW.WANDER.restMinMs);
      expect(r).toBeLessThanOrEqual(FARM_VIEW.WANDER.restMaxMs);
    }
    expect(walkMs(0)).toBe(FARM_VIEW.WANDER.minWalkMs);
    expect(walkMs(FARM_VIEW.WANDER.speedPx * 10)).toBe(10_000);
    expect(facesLeft(100, 50, false)).toBe(true);
    expect(facesLeft(100, 150, true)).toBe(false);
    expect(facesLeft(100, 100, true)).toBe(true);
  });
});
