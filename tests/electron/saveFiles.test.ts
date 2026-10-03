import { mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_KEEP,
  BACKUP_SPACING_MS,
  createSaveFiles,
  type SaveFilesOptions,
} from '../../electron/saveFiles';

const MIN = 60 * 1000;
const T0 = new Date(2026, 9, 1, 12, 0, 0).getTime();
let dir: string;
let t: number;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'unin-saves-'));
  t = T0;
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const files = (extra: Partial<SaveFilesOptions> = {}) =>
  createSaveFiles({ dir, now: () => t, sleep: async () => {}, ...extra });
const read = (name: string) => readFile(join(dir, name), 'utf8');
const readBackup = (name: string) => readFile(join(dir, 'backups', name), 'utf8');
const backups = async () => (await readdir(join(dir, 'backups')).catch(() => [])).sort();

describe('saveFiles', () => {
  it('write replaces save.json atomically; no tmp file left behind', async () => {
    const f = files();
    await f.write('{"v":1}');
    await f.write('{"v":2}');
    expect(await read('save.json')).toBe('{"v":2}');
    expect(await readdir(dir)).not.toContain('save.json.tmp');
  });

  it('a crash before the rename leaves the previous save.json intact', async () => {
    await files().write('{"v":1}');
    const crashing = files({
      fs: {
        rename: async () => {
          throw Object.assign(new Error('power cut'), { code: 'EIO' });
        },
      },
    });
    await expect(crashing.write('{"v":2}')).rejects.toThrow('power cut');
    expect(await read('save.json')).toBe('{"v":1}');
    const c = await files().readCandidates();
    expect(c[0]).toEqual({ source: 'save', json: '{"v":1}' }); // the stray .tmp is ignored
  });

  it('a crash while writing the tmp file leaves the previous save.json intact', async () => {
    await files().write('{"v":1}');
    const crashing = files({
      fs: {
        writeFile: async (path) => {
          await writeFile(path, '{"v":2'); // half written
          throw new Error('crash');
        },
      },
    });
    await expect(crashing.write('{"v":2}')).rejects.toThrow('crash');
    expect(await read('save.json')).toBe('{"v":1}');
  });

  it('retries a rename that Windows reports as busy', async () => {
    let fails = 2;
    const f = files({
      fs: {
        rename: async (a, b) => {
          if (fails-- > 0) throw Object.assign(new Error('busy'), { code: 'EBUSY' });
          await rename(a, b);
        },
      },
    });
    await f.write('{"v":1}');
    expect(await read('save.json')).toBe('{"v":1}');
  });

  it('backs up the previous save before the first write of a session, then every 15 min', async () => {
    await files().write('{"v":0}'); // earlier session, nothing to back up yet
    expect(await backups()).toEqual([]);

    const f = files(); // new session
    await f.write('{"v":1}');
    expect(await backups()).toHaveLength(1);
    expect(await readBackup((await backups())[0]!)).toBe('{"v":0}');

    for (let i = 0; i < 14; i++) {
      t += MIN;
      await f.write(`{"v":${i + 2}}`);
    }
    expect(await backups()).toHaveLength(1); // 14 min later: still one
    t += MIN;
    await f.write('{"v":99}');
    expect(await backups()).toHaveLength(2);
  });

  it(`rotation keeps the newest ${BACKUP_KEEP}`, async () => {
    const f = files();
    for (let i = 0; i < 15; i++) {
      await f.write(`{"v":${i}}`);
      t += BACKUP_SPACING_MS;
    }
    const names = await backups();
    expect(names).toHaveLength(BACKUP_KEEP);
    const listed = await f.listBackups();
    expect(listed.map((b) => b.name)).toEqual([...names].reverse()); // newest first
    expect(await readBackup(listed[0]!.name)).toBe('{"v":13}');
  });

  it('readCandidates: save.json first, then backups newest first', async () => {
    const f = files();
    for (let i = 0; i < 3; i++) {
      await f.write(`{"v":${i}}`);
      t += BACKUP_SPACING_MS;
    }
    await f.write('{"v":3}');
    const c = await f.readCandidates();
    expect(c.map((x) => x.json)).toEqual(['{"v":3}', '{"v":2}', '{"v":1}', '{"v":0}']);
    expect(c[0]!.source).toBe('save');
    expect(c[1]!.source).toMatch(/^backup:save-\d{8}-\d{6}\.json$/);
  });

  it('markCorrupt renames to save.corrupt-YYYYMMDD-HHmmss.json and never deletes', async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'save.json'), '{broken');
    const f = files();
    await f.markCorrupt('save');
    const names = await readdir(dir);
    expect(names).not.toContain('save.json');
    const corrupt = names.find((n) => /^save\.corrupt-\d{8}-\d{6}\.json$/.test(n));
    expect(corrupt).toBeDefined();
    expect(await read(corrupt!)).toBe('{broken');
    // The corrupt file left the chain, so the first write does not back it up.
    await f.write('{"v":1}');
    expect(await backups()).toEqual([]);
  });

  it('markCorrupt refuses a source outside backups/', async () => {
    await expect(files().markCorrupt('backup:../../evil.json')).rejects.toThrow();
  });

  it('restoreBackup backs up the current save, then copies the backup over save.json', async () => {
    const f = files();
    await f.write('{"v":1}');
    t += BACKUP_SPACING_MS;
    await f.write('{"v":2}');
    const [newest] = await f.listBackups();
    expect(await readBackup(newest!.name)).toBe('{"v":1}');
    t += MIN;
    await f.restoreBackup(newest!.name);
    expect(await read('save.json')).toBe('{"v":1}');
    const all = await f.listBackups();
    expect(await readBackup(all[0]!.name)).toBe('{"v":2}');
  });

  it('backupBeforeReset keeps a restorable backup and a permanent copy outside rotation', async () => {
    const f = files();
    await f.backupBeforeReset(); // nothing to keep yet
    expect(await backups()).toEqual([]);
    await f.write('{"farm":"old"}');
    t += MIN;
    await f.backupBeforeReset();
    const [newest] = await f.listBackups();
    expect(await readBackup(newest!.name)).toBe('{"farm":"old"}');
    const kept = (await readdir(dir)).filter((n) => n.startsWith('before-reset-'));
    expect(kept).toHaveLength(1);
    expect(await read(kept[0]!)).toBe('{"farm":"old"}');
    // Many later backups never remove the permanent copy.
    for (let i = 0; i < BACKUP_KEEP + 2; i++) {
      t += BACKUP_SPACING_MS;
      await f.write(`{"v":${i}}`);
    }
    expect((await readdir(dir)).filter((n) => n.startsWith('before-reset-'))).toHaveLength(1);
  });
});

describe('saveFiles: save.json replaced by another program (AM-1)', () => {
  const later = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it('a write after an outside edit is refused; the edit survives', async () => {
    const game = files();
    await game.write('{"gold":1}');
    await later(20); // a different mtime even on coarse file systems
    await writeFile(join(dir, 'save.json'), '{"gold":99999}', 'utf8'); // admin dashboard
    await expect(game.write('{"gold":2}')).rejects.toThrow('SAVE_CHANGED_EXTERNALLY');
    expect(await read('save.json')).toBe('{"gold":99999}');
  });

  it('after re-reading, the game writes again', async () => {
    const game = files();
    await game.write('{"gold":1}');
    await later(20);
    await writeFile(join(dir, 'save.json'), '{"gold":7}', 'utf8');
    expect((await game.readCandidates())[0]!.json).toBe('{"gold":7}');
    await game.write('{"gold":8}');
    expect(await read('save.json')).toBe('{"gold":8}');
  });

  it('an outside edit created before the first write is also caught', async () => {
    const game = files();
    expect(await game.readCandidates()).toEqual([]); // first launch: no file
    await writeFile(join(dir, 'save.json'), '{"gold":5}', 'utf8');
    await expect(game.write('{"gold":0}')).rejects.toThrow('SAVE_CHANGED_EXTERNALLY');
  });

  it('a new instance (no read yet) never refuses', async () => {
    await writeFile(join(dir, 'save.json'), '{"gold":5}', 'utf8');
    await files().write('{"gold":6}');
    expect(await read('save.json')).toBe('{"gold":6}');
  });

  it('watch fires for an outside edit, not for its own writes', async () => {
    const game = files();
    await game.write('{"gold":1}');
    let fired = 0;
    const stop = await game.watch(() => fired++);
    await game.write('{"gold":2}');
    await later(600);
    expect(fired).toBe(0);
    await writeFile(join(dir, 'save.json'), '{"gold":3}', 'utf8');
    await later(600);
    stop();
    expect(fired).toBeGreaterThanOrEqual(1);
  });
});
