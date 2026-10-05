import { existsSync } from 'node:fs';
import { pigFrame } from '../../src/areas/farm/scene/view/farmArt';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { parseManifest, type AssetManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { BREED_IDS, BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { DAY_PHASES } from '../../src/core/config/dayNight';
import { pigVisualState } from '../../src/areas/farm/scene/state/pigVisualState';
import {
  initialRest,
  isAwake,
  isSleepPhase,
  restFrame,
  type PigRestState,
} from '../../src/areas/farm/scene/state/sleepCycle';
import { frameLook } from '../../src/areas/farm/scene/view/pigView';

function manifest(): AssetManifest {
  const r = parseManifest(structuredClone(manifestJson));
  if (!r.ok) throw new Error(r.message);
  return r.manifest;
}

const ALL: PigRestState[] = ['IDLE', 'WALKING', 'FALLING_ASLEEP', 'SLEEPING', 'WAKING_UP'];

describe('pig rest states (DECISIONS PS-1, PL-1)', () => {
  it('sleeps through the night phase only', () => {
    expect(DAY_PHASES.filter(isSleepPhase)).toEqual(['night']);
  });

  it('a pig spawned or loaded at night is asleep, by day it stands', () => {
    expect(initialRest(true)).toBe('SLEEPING');
    expect(initialRest(false)).toBe('IDLE');
    expect(isAwake(initialRest(true))).toBe(false);
  });

  it('frames: heavy lids in transitions, closed lids asleep', () => {
    expect(ALL.map(restFrame)).toEqual(['idle', 'idle', 'wake', 'sleep', 'wake']);
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
        const url = pigFrame(assets, id, frame);
        const file = url && join('public', url);
        if (!file || !existsSync(file)) missing.push(`${id} (${BREEDS[id].artId}) ${frame}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
