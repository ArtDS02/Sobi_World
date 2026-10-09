// settings.json on desktop: atomic write, missing file = null, and the browser twin in localStorage.
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSettingsFile } from '../../electron/settingsFile';
import { createLocalSettings, SETTINGS_KEY } from '../../src/platform/web/localSettings';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'sobi-settings-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('createSettingsFile', () => {
  it('reads null before the first write', async () => {
    expect(await createSettingsFile(join(dir, 'settings.json')).read()).toBeNull();
  });

  it('writes the whole file and leaves no temp file behind', async () => {
    const file = createSettingsFile(join(dir, 'sub', 'settings.json'));
    await file.write('{"a":1}');
    await file.write('{"a":2}');
    expect(await file.read()).toBe('{"a":2}');
    expect(await readdir(join(dir, 'sub'))).toEqual(['settings.json']);
  });

  it('a stale temp file from a crash does not matter', async () => {
    await writeFile(join(dir, 'settings.json.tmp'), 'half');
    const file = createSettingsFile(join(dir, 'settings.json'));
    await file.write('{"ok":true}');
    expect(await readFile(join(dir, 'settings.json'), 'utf8')).toBe('{"ok":true}');
  });
});

describe('createLocalSettings', () => {
  it('stores under one key and rejects when the browser refuses', async () => {
    const items = new Map<string, string>();
    const ok = createLocalSettings({ getItem: (k) => items.get(k) ?? null, setItem: (k, v) => void items.set(k, v) });
    expect(await ok.load()).toBeNull();
    await ok.save('x');
    expect(items.get(SETTINGS_KEY)).toBe('x');
    const full = createLocalSettings({
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    await expect(full.save('x')).rejects.toThrow('quota');
  });
});
