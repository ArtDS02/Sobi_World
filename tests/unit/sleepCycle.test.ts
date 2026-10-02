import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { parseManifest, type AssetManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import { DAY_PHASES, PIG_SLEEP } from '../../src/core/config/dayNight';
import { pigVisualState } from '../../src/game/state/pigVisualState';
import {
  initialRest,
  isAwake,
  isSleepPhase,
  onDayNight,
  onTransitionEnd,
  restFrame,
  staggerMs,
  type PigRestState,
} from '../../src/game/state/sleepCycle';
import { frameLook } from '../../src/game/view/pigView';

function manifest(): AssetManifest {
  const r = parseManifest(structuredClone(manifestJson));
  if (!r.ok) throw new Error(r.message);
  return r.manifest;
}

const ALL: PigRestState[] = ['IDLE', 'WALKING', 'FALLING_ASLEEP', 'SLEEPING', 'WAKING_UP'];

describe('global pig sleep cycle (DECISIONS PS-1)', () => {
  it('sleeps through the night phase only', () => {
    expect(DAY_PHASES.filter(isSleepPhase)).toEqual(['night']);
  });

  it('day → night: every awake or waking pig falls asleep; asleep pigs stay asleep', () => {
    expect(onDayNight('IDLE', true)).toBe('FALLING_ASLEEP');
    expect(onDayNight('WALKING', true)).toBe('FALLING_ASLEEP');
    expect(onDayNight('WAKING_UP', true)).toBe('FALLING_ASLEEP');
    expect(onDayNight('FALLING_ASLEEP', true)).toBe('FALLING_ASLEEP');
    expect(onDayNight('SLEEPING', true)).toBe('SLEEPING');
  });

  it('night → day: sleeping / dozing pigs wake up; awake pigs keep strolling', () => {
    expect(onDayNight('SLEEPING', false)).toBe('WAKING_UP');
    expect(onDayNight('FALLING_ASLEEP', false)).toBe('WAKING_UP');
    expect(onDayNight('IDLE', false)).toBe('IDLE');
    expect(onDayNight('WALKING', false)).toBe('WALKING');
  });

  it('transitions end in SLEEPING by night and IDLE by day, whatever the start', () => {
    for (const night of [true, false]) {
      for (const start of ALL) {
        let s = onDayNight(start, night);
        for (let i = 0; i < 4 && !(s === 'SLEEPING' || isAwake(s)); i++)
          s = onTransitionEnd(s, night);
        expect(s).toBe(night ? 'SLEEPING' : start === 'WALKING' ? 'WALKING' : 'IDLE');
      }
    }
  });

  it('a pig spawned or loaded at night is asleep, by day it stands', () => {
    expect(initialRest(true)).toBe('SLEEPING');
    expect(initialRest(false)).toBe('IDLE');
    expect(isAwake(initialRest(true))).toBe(false);
  });

  it('frames: heavy lids in transitions, closed lids asleep', () => {
    expect(ALL.map(restFrame)).toEqual(['idle', 'idle', 'wake', 'sleep', 'wake']);
  });

  it('stagger stays inside the window', () => {
    for (const h of [0, 1, 999, 123456789]) {
      expect(staggerMs(h)).toBeGreaterThanOrEqual(0);
      expect(staggerMs(h)).toBeLessThanOrEqual(PIG_SLEEP.staggerMs);
    }
  });

  it('night rest wins over sick / pregnant / walking; a feedback state still plays', () => {
    const preg = {
      startedAt: 0,
      endsAt: 1,
      fatherId: 'f',
      childBreed: BREED_IDS[0]!,
      childGender: 'MALE' as const,
    };
    expect(pigVisualState({ isSick: true, pregnancy: preg }, 0, null, 'sleep')).toBe('sleep');
    expect(pigVisualState({ isSick: true, pregnancy: null }, 0, null, 'drowsy')).toBe('drowsy');
    expect(
      pigVisualState({ isSick: false, pregnancy: null }, 0, { state: 'eat', until: 9 }, 'sleep'),
    ).toBe('eat');
  });

  it('frameLook: wake frame while drowsy, sleep frame + zzz at night, idle fallback', () => {
    const view = { textureId: 'i', sleepTextureId: 's', wakeTextureId: 'w', overlays: [] };
    const all = () => true;
    expect(frameLook(view, 'drowsy', all, false).textureId).toBe('w');
    expect(frameLook(view, 'sleep', all, true)).toEqual({ textureId: 's', overlays: ['fx_zzz'] });
    expect(frameLook(view, 'sleep', all, false)).toEqual({ textureId: 's', overlays: [] });
    expect(frameLook(view, 'drowsy', () => false, false).textureId).toBe('i');
    expect(frameLook({ ...view, sleepTextureId: null }, 'sleep', all, false).overlays).toEqual([
      'fx_zzz',
    ]);
    expect(frameLook(view, 'walk', all, false).textureId).toBe('i');
  });
});

describe('sleep / wake frames cover every species (PS-1)', () => {
  const m = manifest();
  const assets = createAssetRegistry(m);
  it('every species art row has a sleep and a wake frame on disk', () => {
    const missing: string[] = [];
    for (const id of BREED_IDS) {
      for (const frame of ['sleep', 'wake'] as const) {
        const url = assets.pigFrame(id, frame);
        const file = url && join('public', url);
        if (!file || !existsSync(file)) missing.push(`${id} (${BREEDS[id].artId}) ${frame}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
