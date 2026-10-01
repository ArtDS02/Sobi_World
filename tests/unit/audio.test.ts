import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { setSetting } from '../../src/core/actions/setSetting';
import { parseManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { AUDIO_KEYS, type AudioKey } from '../../src/core/config/assetIds';
import type { GameEvent } from '../../src/core/events';
import {
  AudioManager,
  audioTracks,
  type AudioClip,
  type AudioTrack,
} from '../../src/game/audio/AudioManager';
import { tapSound } from '../../src/game/audio/tapSound';
import { feedbackPlan } from '../../src/game/feedback/feedbackPlan';
import { REJECT_ROW } from '../../src/game/feedback/feedbackTable';
import { ctx, expectError, expectOk, farm } from './actionKit';

const parsed = parseManifest(structuredClone(manifestJson));
if (!parsed.ok) throw new Error(parsed.message);
const reg = createAssetRegistry(parsed.manifest);

describe('audio keys (spec §12)', () => {
  it('exactly the 12 canonical keys, word for word', () => {
    expect([...AUDIO_KEYS]).toEqual([
      'music_farm',
      'ui_click',
      'ui_error',
      'pig_oink_happy',
      'pig_oink_hungry',
      'feed_munch',
      'water_splash',
      'coin_collect',
      'breed_chime',
      'birth_fanfare',
      'level_up',
      'notify',
    ]);
  });

  it('every key resolves through manifest.audio with its volume and loop', () => {
    const tracks = audioTracks(reg);
    expect([...tracks.keys()].sort()).toEqual([...AUDIO_KEYS].sort());
    expect(tracks.get('music_farm')).toMatchObject({ loop: true, volume: 0.6, kind: 'music' });
    expect(tracks.get('ui_click')?.url).toMatch(/^assets\/audio\//);
  });

  it('event → key follows the §11.3 table; rejection → ui_error', () => {
    const cases: [GameEvent, AudioKey][] = [
      [{ type: 'PIG_FED', pigId: 'p' }, 'feed_munch'],
      [{ type: 'TROUGH_FILLED', units: 1, fromInventory: 0, gold: -25 }, 'feed_munch'],
      [{ type: 'PIG_CLEANED', pigIds: ['p'] }, 'water_splash'],
      [{ type: 'PIG_TREATED', pigId: 'p' }, 'ui_click'],
      [{ type: 'PIG_SOLD', pigId: 'p', gold: 900 }, 'coin_collect'],
      [{ type: 'BREEDING_STARTED', motherId: 'm', fatherId: 'f', endsAt: 1 }, 'breed_chime'],
      [
        { type: 'BIRTH', motherId: 'm', childId: 'c', childBreed: 'PIG_EARTH_PINK' },
        'birth_fanfare',
      ],
      [{ type: 'PIG_BECAME_ADULT', pigId: 'p' }, 'level_up'],
      [{ type: 'LEVEL_UP', level: 2 }, 'level_up'],
      [{ type: 'PIG_BECAME_SICK', pigId: 'p' }, 'notify'],
      [{ type: 'TROUGH_EMPTY', at: 0 }, 'notify'],
      [{ type: 'ORDER_NEW', orderId: 'o' }, 'notify'],
      [{ type: 'ORDER_FULFILLED', orderId: 'o', gold: 800 }, 'coin_collect'],
      [{ type: 'DISCOVERY', kind: 'BREED', id: 'PIG_EARTH_PINK', gold: 500 }, 'coin_collect'],
      [{ type: 'SKIN_BOUGHT', skinId: 's', gold: -2000 }, 'ui_click'],
      [{ type: 'SKIN_EQUIPPED', pigId: 'p', skinId: 's' }, 'ui_click'],
      [{ type: 'SLOT_BOUGHT', slots: 5, gold: -2000 }, 'ui_click'],
      [{ type: 'ITEM_BOUGHT', itemId: 'FOOD_BASIC', quantity: 1, gold: -25 }, 'ui_click'],
      [{ type: 'PIG_RENAMED', pigId: 'p' }, 'ui_click'],
    ];
    for (const [event, key] of cases) {
      expect(feedbackPlan(event, 'action', false).sound, event.type).toBe(key);
      expect(feedbackPlan(event, 'action', true).sound, `${event.type} reduceMotion`).toBe(key);
    }
    expect(REJECT_ROW.sound).toBe('ui_error');
    expect(feedbackPlan(cases[0]![0], 'catchup', false).sound).toBeNull();
  });

  it('pig tap: hunger < 30 → hungry oink, happiness >= 50 → happy oink, else quiet', () => {
    expect(tapSound({ hunger: 10, cleanliness: 100, isSick: false })).toBe('pig_oink_hungry');
    expect(tapSound({ hunger: 80, cleanliness: 80, isSick: false })).toBe('pig_oink_happy');
    expect(tapSound({ hunger: 40, cleanliness: 10, isSick: false })).toBeNull();
  });
});

/** Fake clips that record what played. */
function rig(opts: { musicOn?: boolean; sfxOn?: boolean; unlocked?: boolean } = {}) {
  const log: string[] = [];
  const settings = { musicOn: opts.musicOn ?? true, sfxOn: opts.sfxOn ?? true };
  const warnings: string[] = [];
  const createClip = (url: string): AudioClip => ({
    loop: false,
    volume: 1,
    play: () => void log.push(`play:${url}`),
    pause: () => void log.push(`pause:${url}`),
  });
  const tracks = new Map<AudioKey, AudioTrack>([
    ['music_farm', { url: 'm', volume: 0.6, loop: true, kind: 'music' }],
    ['ui_click', { url: 'c', volume: 0.8, loop: false, kind: 'sfx' }],
  ]);
  const audio = new AudioManager(tracks, {
    createClip,
    settings: () => settings,
    unlocked: opts.unlocked ?? true,
    warn: (m) => warnings.push(m),
  });
  return { audio, log, settings, warnings };
}

describe('AudioManager', () => {
  it('a key without a file is silence, not an error (warned once)', () => {
    const { audio, log, warnings } = rig();
    expect(() => audio.play('birth_fanfare')).not.toThrow();
    audio.play('birth_fanfare');
    expect(log).toEqual([]);
    expect(warnings).toHaveLength(1);
  });

  it('failing clips (constructor or play) never throw', async () => {
    const tracks = new Map<AudioKey, AudioTrack>([
      ['ui_click', { url: 'c', volume: 1, loop: false, kind: 'sfx' }],
      ['notify', { url: 'n', volume: 1, loop: false, kind: 'sfx' }],
    ]);
    const audio = new AudioManager(tracks, {
      createClip: (url) => {
        if (url === 'n') throw new Error('no audio');
        return {
          loop: false,
          volume: 1,
          play: () => Promise.reject(new Error('blocked')),
          pause() {},
        };
      },
      settings: () => ({ musicOn: true, sfxOn: true }),
      unlocked: true,
    });
    expect(() => audio.play('ui_click')).not.toThrow();
    expect(() => audio.play('notify')).not.toThrow();
    await Promise.resolve();
  });

  it('sfxOn off → effects are silent', () => {
    const { audio, log } = rig({ sfxOn: false });
    audio.play('ui_click');
    expect(log).toEqual([]);
  });

  it('music follows musicOn at once; the browser build waits for the first gesture', () => {
    const { audio, log, settings } = rig({ unlocked: false });
    audio.sync();
    audio.play('ui_click');
    expect(log).toEqual([]);
    audio.unlock();
    expect(log).toEqual(['play:m']);
    settings.musicOn = false;
    audio.sync();
    expect(log.at(-1)).toBe('pause:m');
    settings.musicOn = true;
    audio.sync();
    audio.sync();
    expect(log.filter((l) => l === 'play:m')).toHaveLength(2);
  });

  it('the desktop build plays at launch', () => {
    const { audio, log } = rig({ unlocked: true });
    audio.sync();
    expect(log).toEqual(['play:m']);
  });
});

describe('setSetting (musicOn / sfxOn in the save)', () => {
  it('flips the toggle and emits SETTING_CHANGED', () => {
    const r = expectOk(setSetting(farm(), { key: 'musicOn', value: false }, ctx()));
    expect(r.state.settings.musicOn).toBe(false);
    expect(r.events).toContainEqual({ type: 'SETTING_CHANGED', key: 'musicOn', value: false });
  });

  it('rejects unknown keys and non-boolean values', () => {
    const bad = { key: 'lastExportAt', value: true } as unknown as Parameters<typeof setSetting>[1];
    expectError((s) => setSetting(s, bad, ctx()), farm(), 'INVALID_REQUEST');
    const nonBool = { key: 'sfxOn', value: 1 } as unknown as Parameters<typeof setSetting>[1];
    expectError((s) => setSetting(s, nonBool, ctx()), farm(), 'INVALID_REQUEST');
  });
});
