// core/settings: key bindings (conflicts, reserved keys, clearing), the settings file (damaged input
// falls back to defaults) and the store (a change is written, a failed write is reported).
import { describe, expect, it } from 'vitest';
import {
  CONTROLS,
  DEFAULT_KEYS,
  clearSlot,
  controlOf,
  keyLabel,
  pressedControls,
  rebind,
  validKeys,
} from '../../src/core/settings/keys';
import type { SettingsStorage } from '../../src/core/settings/port';
import { createSettingsStore, parseSettings, serializeSettings } from '../../src/core/settings/settings';

function memoryStorage(initial: string | null = null) {
  const s = { text: initial, writes: 0, fail: false };
  const storage: SettingsStorage = {
    load: () => Promise.resolve(s.text),
    save(json) {
      if (s.fail) return Promise.reject(new Error('disk full'));
      s.text = json;
      s.writes += 1;
      return Promise.resolve();
    },
  };
  return { s, storage };
}

describe('key bindings', () => {
  it('defaults follow the spec and are valid', () => {
    expect(DEFAULT_KEYS.moveUp).toEqual(['KeyW', 'ArrowUp']);
    expect(DEFAULT_KEYS.interact[0]).toBe('KeyE');
    expect(DEFAULT_KEYS.inventory[0]).toBe('KeyI');
    expect(DEFAULT_KEYS.codex[0]).toBe('KeyC');
    expect(DEFAULT_KEYS.menu[0]).toBe('Escape');
    expect(validKeys(DEFAULT_KEYS)).toBe(true);
  });

  it('rebinds a free key', () => {
    const r = rebind(DEFAULT_KEYS, 'interact', 0, 'KeyF');
    expect(r.ok && r.keys.interact).toEqual(['KeyF', null]);
    expect(r.ok && validKeys(r.keys)).toBe(true);
  });

  it('refuses a key another control uses and says which', () => {
    const r = rebind(DEFAULT_KEYS, 'interact', 0, 'KeyI');
    expect(r).toEqual({ ok: false, error: 'KEY_TAKEN', with: 'inventory' });
  });

  it('accepts the key a slot already has (no conflict with itself)', () => {
    expect(rebind(DEFAULT_KEYS, 'interact', 0, 'KeyE').ok).toBe(true);
  });

  it('refuses reserved keys, bad slots and empty codes', () => {
    expect(rebind(DEFAULT_KEYS, 'interact', 0, 'F5')).toEqual({ ok: false, error: 'KEY_RESERVED' });
    expect(rebind(DEFAULT_KEYS, 'interact', 2, 'KeyF')).toEqual({ ok: false, error: 'KEY_INVALID' });
    expect(rebind(DEFAULT_KEYS, 'interact', 0, '')).toEqual({ ok: false, error: 'KEY_INVALID' });
  });

  it('clears a second key but never the last one', () => {
    const cleared = clearSlot(DEFAULT_KEYS, 'moveUp', 1);
    expect(cleared.ok && cleared.keys.moveUp).toEqual(['KeyW', null]);
    expect(clearSlot(DEFAULT_KEYS, 'interact', 0)).toEqual({ ok: false, error: 'KEY_INVALID' });
  });

  it('finds the control of a key and the controls held down', () => {
    expect(controlOf(DEFAULT_KEYS, 'ArrowLeft')).toBe('moveLeft');
    expect(controlOf(DEFAULT_KEYS, 'KeyZ')).toBeNull();
    expect([...pressedControls(DEFAULT_KEYS, new Set(['KeyW', 'ArrowRight', 'KeyQ']))].sort()).toEqual([
      'moveRight',
      'moveUp',
    ]);
  });

  it('labels keys for hints', () => {
    expect(keyLabel('KeyE')).toBe('E');
    expect(keyLabel('ArrowUp')).toBe('↑');
    expect(keyLabel('Escape')).toBe('Esc');
    expect(keyLabel('Digit3')).toBe('3');
  });
});

describe('settings file', () => {
  it('first launch (no file) = defaults', () => {
    expect(parseSettings(null).keys).toEqual(DEFAULT_KEYS);
  });

  it('round-trips a rebinding', () => {
    const r = rebind(DEFAULT_KEYS, 'inventory', 0, 'KeyB');
    if (!r.ok) throw new Error('rebind failed');
    const text = serializeSettings({ version: 1, keys: r.keys, character: 'so' });
    expect(parseSettings(text).keys.inventory).toEqual(['KeyB', null]);
  });

  it('keeps the chosen character, and falls back to So on a bad value', () => {
    expect(parseSettings(null).character).toBe('so');
    expect(parseSettings(JSON.stringify({ character: 'bi' })).character).toBe('bi');
    expect(parseSettings(JSON.stringify({ character: 'nobody' })).character).toBe('so');
  });

  it.each([
    ['not json', '{oops'],
    ['wrong shape', '{"keys": 3}'],
    ['clashing keys', JSON.stringify({ keys: { interact: ['KeyI', null] } })],
    ['control without keys', JSON.stringify({ keys: { interact: [null, null] } })],
    ['reserved key', JSON.stringify({ keys: { interact: ['F5', null] } })],
  ])('falls back to defaults on %s', (_name, text) => {
    expect(parseSettings(text).keys).toEqual(DEFAULT_KEYS);
  });

  it('keeps defaults for controls the file lacks and ignores unknown ones', () => {
    const keys = parseSettings(JSON.stringify({ keys: { interact: ['KeyF', null], dance: ['KeyQ', null] } })).keys;
    expect(keys.interact).toEqual(['KeyF', null]);
    expect(keys.menu).toEqual(DEFAULT_KEYS.menu);
    expect(Object.keys(keys).sort()).toEqual([...CONTROLS].sort());
  });
});

describe('settings store', () => {
  it('loads the file, saves a change and reads it back after a restart', async () => {
    const { s, storage } = memoryStorage();
    const store = createSettingsStore(storage);
    await store.init();
    const r = rebind(store.getSnapshot().settings.keys, 'interact', 0, 'KeyF');
    if (!r.ok) throw new Error('rebind failed');
    await store.setKeys(r.keys);
    expect(s.writes).toBe(1);

    const again = createSettingsStore(memoryStorage(s.text).storage);
    await again.init();
    expect(again.getSnapshot().settings.keys.interact).toEqual(['KeyF', null]);
  });

  it('reports a failed write and clears the error after a good one', async () => {
    const { s, storage } = memoryStorage();
    const store = createSettingsStore(storage);
    await store.init();
    s.fail = true;
    await store.resetKeys();
    expect(store.getSnapshot().saveError).toBe(true);
    s.fail = false;
    await store.resetKeys();
    expect(store.getSnapshot().saveError).toBe(false);
  });

  it('ignores bindings that clash', async () => {
    const { s, storage } = memoryStorage();
    const store = createSettingsStore(storage);
    await store.init();
    await store.setKeys({ ...DEFAULT_KEYS, interact: ['KeyI', null] });
    expect(s.writes).toBe(0);
    expect(store.getSnapshot().settings.keys).toEqual(DEFAULT_KEYS);
  });

  it('a read failure leaves the defaults', async () => {
    const store = createSettingsStore({ load: () => Promise.reject(new Error('locked')), save: () => Promise.resolve() });
    await store.init();
    expect(store.getSnapshot().settings.keys).toEqual(DEFAULT_KEYS);
  });
});
