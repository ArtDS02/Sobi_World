// R09B: sleep / sick / pregnant rendering rules, reduceMotion seeding, and proof that the visual
// layer (pigView, visual state, wandering) never touches the save.
import { FARM_LAYOUT } from '../../src/areas/farm/scene/config/layout';
import { createFarmGameStore, world } from './worldKit';
import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import type { Anchors } from '../../src/core/assets/anchors';
import { parseManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { fakeClock } from '../../src/core/clock';
import { mulberry32 } from '../../src/core/rng';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import type { InstanceGuard, LoadResult, SaveStorage } from '../../src/core/save/port';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { pigVisualState } from '../../src/areas/farm/scene/state/pigVisualState';
import { wanderTarget } from '../../src/areas/farm/scene/state/wander';
import { overlayLayout } from '../../src/areas/farm/scene/view/overlayLayout';
import { pigView, sleepLook } from '../../src/areas/farm/scene/view/pigView';
import { makePig } from './pigFactory';

const parsed = parseManifest(structuredClone(manifestJson));
if (!parsed.ok) throw new Error(parsed.message);
// Fixture: the classic art with its own sleep frame (art cut from the reference sheets has none).
parsed.manifest.pigs.find((p) => p.id === 'pig_classic')!.sleepAsset =
  'pigs/base/pig_classic_sleep.png';
const reg = createAssetRegistry(parsed.manifest);
const layout = FARM_LAYOUT;

describe('sleep look (spec §11.4, DECISIONS Q5)', () => {
  const classic = pigView(makePig(), 0, layout, reg);
  const all = () => true;

  it('uses the _sleep frame when the manifest has one and it loaded', () => {
    expect(classic.sleepTextureId).toBe('pig_classic_sleep');
    expect(sleepLook(classic, all)).toEqual({ textureId: 'pig_classic_sleep', overlay: null });
  });

  it('falls back to idle + fx_zzz when the frame failed to load', () => {
    expect(sleepLook(classic, (k) => k !== 'pig_classic_sleep')).toEqual({
      textureId: classic.textureId,
      overlay: 'fx_zzz',
    });
  });

  it('falls back to idle + fx_zzz when the manifest row has no sleep frame', () => {
    const m = structuredClone(parsed.manifest);
    delete m.pigs.find((p) => p.id === 'pig_classic')!.sleepAsset;
    const v = pigView(makePig(), 0, layout, createAssetRegistry(m));
    expect(v.sleepTextureId).toBeNull();
    expect(sleepLook(v, all)).toEqual({ textureId: 'pig_classic', overlay: 'fx_zzz' });
  });
});

describe('sick / pregnant overlays (spec §11 table)', () => {
  it('both overlays show; sick wins the state name', () => {
    const pregnancy = {
      startedAt: 0,
      endsAt: 1,
      fatherId: 'f',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    const v = pigView(makePig({ isSick: true, pregnancy }), 0, layout, reg);
    expect(v.overlays).toEqual(['fx_sick', 'fx_pregnant']);
    expect(v.visualState).toBe('sick');
    expect(pigVisualState(v.care, 0, null, 'nap')).toBe('sick');
  });

  it('overlay positions mirror with the facing (x′ = 1 − x, R05A)', () => {
    const anchors = { fx_above: { x: 0.7, y: 0.1 } } as unknown as Anchors;
    const frame = {
      fx: ['fx_sick'] as const,
      anchors,
      anchorOf: () => 'fx_above' as const,
      scale: 1,
      displayW: 200,
      displayH: 200,
      x: 500,
      y: 600,
    };
    const right = overlayLayout({ ...frame, flipX: false })[0]!;
    const left = overlayLayout({ ...frame, flipX: true })[0]!;
    expect(right.x - 500).toBeCloseTo(-(left.x - 500));
    expect(right.y).toBe(left.y);
    expect(right.x).toBeGreaterThan(500);
  });
});

/** In-memory platform: counts writes. */
function memoryPlatform(initial: FarmGame | null) {
  let stored = initial && world(initial);
  const writes = { count: 0 };
  const storage: SaveStorage = {
    load: async (): Promise<LoadResult> =>
      stored ? { kind: 'ok', save: stored, source: 'primary', fromVersion: 8 } : { kind: 'empty' },
    save: async (s) => {
      writes.count += 1;
      stored = s;
    },
  };
  const instanceGuard: InstanceGuard = {
    start: async () => true,
    isReadOnly: () => false,
    close: () => {},
  };
  return { storage, instanceGuard, writes };
}

const storeDeps = { every: () => 0, cancel: () => {}, sleep: async () => {}, page: null };

describe('settings.reduceMotion (spec §11.3)', () => {
  for (const prefers of [true, false]) {
    it(`a new game takes prefers-reduced-motion = ${prefers}`, async () => {
      const p = memoryPlatform(null);
      const store = createFarmGameStore({
        ...p,
        ...storeDeps,
        clock: fakeClock(0),
        rng: mulberry32(1),
        prefersReducedMotion: () => prefers,
      });
      await store.init();
      expect(store.getSnapshot().save?.settings.reduceMotion).toBe(prefers);
    });
  }
});

describe('the visual layer never writes the save', () => {
  it('rendering, visual states and wandering over time leave updatedAt alone', async () => {
    const T0 = 1_790_000_000_000;
    const clock = fakeClock(T0);
    const start = buyPig(
      newGame({ now: T0, rng: mulberry32(9) }),
      { breed: 'PIG_EARTH_PINK', gender: 'MALE' },
      { now: T0, rng: mulberry32(2) },
    );
    if (!start.ok) throw new Error(start.error);
    const p = memoryPlatform(start.state);
    const store = createFarmGameStore({
      ...p,
      ...storeDeps,
      clock,
      rng: mulberry32(3),
      prefersReducedMotion: () => false,
    });
    await store.init();
    const updatedAt = store.getSnapshot().save!.updatedAt;
    // What the farm scene does every frame, for 10 minutes of play without any action.
    for (let s = 0; s < 600; s += 1) {
      clock.advance(1000);
      store.tick();
      const save = store.getSnapshot().save!;
      for (const pig of save.pigs) {
        const v = pigView(pig, clock.now(), layout, reg);
        pigVisualState(v.care, clock.now(), null, s % 3 === 0 ? 'nap' : 'walk');
        wanderTarget(pig.id, s, layout, [{ x: v.x, y: v.y }]);
        sleepLook(v, () => s % 2 === 0);
      }
    }
    expect(store.getSnapshot().save!.updatedAt).toBe(updatedAt);
  });
});
