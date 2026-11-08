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

describe('createSettingsFile: queue and retry (B3)', () => {
  it('concurrent writes run in order: the last one wins and no temp file is left', async () => {
    const file = createSettingsFile(join(dir, 'settings.json'));
    await Promise.all(Array.from({ length: 12 }, (_, i) => file.write(`{"n":${i}}`)));
    expect(await file.read()).toBe('{"n":11}');
    expect(await readdir(dir)).toEqual(['settings.json']);
  });

  it('a rename held by another program (EPERM) is retried', async () => {
    let fails = 2;
    const { rename } = await import('node:fs/promises');
    const file = createSettingsFile(join(dir, 'settings.json'), {
      sleep: async () => {},
      rename: async (a, b) => {
        if (fails-- > 0) throw Object.assign(new Error('locked'), { code: 'EPERM' });
        await rename(a, b);
      },
    });
    await file.write('{"ok":1}');
    expect(await file.read()).toBe('{"ok":1}');
  });

  it('a lasting failure rejects, cleans its temp file, and the next write still works', async () => {
    let broken = true;
    const { rename } = await import('node:fs/promises');
    const file = createSettingsFile(join(dir, 'settings.json'), {
      sleep: async () => {},
      rename: async (a, b) => {
        if (broken) throw Object.assign(new Error('locked'), { code: 'EBUSY' });
        await rename(a, b);
      },
    });
    await expect(file.write('{"bad":1}')).rejects.toThrow('locked');
    expect(await readdir(dir)).toEqual([]);
    broken = false;
    await file.write('{"good":1}');
    expect(await file.read()).toBe('{"good":1}');
  });

  it('a non-retryable error is not retried', async () => {
    let calls = 0;
    const file = createSettingsFile(join(dir, 'settings.json'), {
      sleep: async () => {},
      rename: async () => {
        calls += 1;
        throw Object.assign(new Error('nope'), { code: 'ENOSPC' });
      },
    });
    await expect(file.write('x')).rejects.toThrow('nope');
    expect(calls).toBe(1);
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
