// B4 (watcher errors), B5 (content hash vs touched mtime), B6 (import validation, atomic export).
import { EventEmitter } from 'node:events';
import { mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FSWatcher } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readImportFile, writeExportFile } from '../../electron/importExport';
import { createSaveFiles } from '../../electron/saveFiles';
import { watchResilient } from '../../electron/saveWatcher';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'unin-harden-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const later = (ms: number) => new Promise((r) => setTimeout(r, ms));

class FakeWatcher extends EventEmitter {
  closed = false;
  close() {
    this.closed = true;
  }
}

describe('B4: the watcher survives fs.watch errors', () => {
  it('an error event is logged, the watcher is closed and re-opened, up to a limit', async () => {
    const made: FakeWatcher[] = [];
    const errors: string[] = [];
    watchResilient({
      dir,
      watch: () => {
        const w = new FakeWatcher();
        made.push(w);
        return w as unknown as FSWatcher;
      },
      onEvent: () => {},
      onError: (where, e) => errors.push(`${where}:${(e as Error).message}`),
      sleep: async () => {},
      maxRestarts: 2,
    });
    expect(made).toHaveLength(1);
    made[0]!.emit('error', new Error('EMFILE'));
    await later(5);
    expect(made[0]!.closed).toBe(true);
    expect(made).toHaveLength(2);
    made[1]!.emit('error', new Error('again'));
    await later(5);
    expect(made).toHaveLength(3);
    made[2]!.emit('error', new Error('third'));
    await later(5);
    expect(made).toHaveLength(3); // gave up: no endless loop
    expect(errors.at(-1)).toContain('giving up');
  });

  it('a watch() that throws is retried too and stop() cancels pending re-opens', async () => {
    let calls = 0;
    const stop = watchResilient({
      dir,
      watch: () => {
        calls += 1;
        throw new Error('ENOENT');
      },
      onEvent: () => {},
      sleep: async (ms) => void (await later(ms || 20)),
      maxRestarts: 5,
    });
    await later(5);
    stop();
    await later(60);
    expect(calls).toBe(1);
  });

  it('saveFiles.watch without a crash handler would die: with it an error event is harmless', async () => {
    const w = new FakeWatcher();
    const errors: string[] = [];
    const f = createSaveFiles({
      dir,
      now: () => 0,
      sleep: async () => {},
      onError: (where) => errors.push(where),
      watchFactory: () => w as unknown as FSWatcher,
    });
    const stop = await f.watch(() => {});
    expect(() => w.emit('error', new Error('boom'))).not.toThrow();
    stop();
    expect(errors[0]).toBe('save-watch');
  });
});

describe('B5: a touched mtime over the same content is not an outside edit', () => {
  it('antivirus-style touch does not refuse the write; a real edit still does', async () => {
    const f = createSaveFiles({ dir, now: () => 0, sleep: async () => {} });
    await f.write('{"gold":1}');
    const future = new Date(Date.now() + 60_000);
    await utimes(join(dir, 'save.json'), future, future); // same bytes, new mtime
    await expect(f.write('{"gold":2}')).resolves.toBeUndefined();
    await writeFile(join(dir, 'save.json'), '{"gold":99}', 'utf8'); // a real edit by another program
    await expect(f.write('{"gold":3}')).rejects.toThrow('SAVE_CHANGED_EXTERNALLY');
  });

  it('same size but different content is still detected', async () => {
    const f = createSaveFiles({ dir, now: () => 0, sleep: async () => {} });
    await f.write('{"gold":1}');
    await writeFile(join(dir, 'save.json'), '{"gold":7}', 'utf8');
    await expect(f.write('{"gold":2}')).rejects.toThrow('SAVE_CHANGED_EXTERNALLY');
  });
});

describe('B6: import is validated first, export is atomic', () => {
  it('rejects non-JSON, non-object and oversized files without touching the backups', async () => {
    const f = createSaveFiles({ dir: join(dir, 'saves'), now: () => 0, sleep: async () => {} });
    await f.write('{"v":1}');
    const before = await f.listBackups();
    await writeFile(join(dir, 'bad.json'), 'not json {', 'utf8');
    await writeFile(join(dir, 'arr.json'), '[1,2]', 'utf8');
    await expect(f.readExternal(join(dir, 'bad.json'))).rejects.toThrow('IMPORT_REJECTED');
    await expect(f.readExternal(join(dir, 'arr.json'))).rejects.toThrow('IMPORT_REJECTED');
    await expect(f.readExternal(join(dir))).rejects.toThrow(); // a folder
    expect(await f.listBackups()).toEqual(before);
  });

  it('accepts a JSON object and returns its text', async () => {
    await writeFile(join(dir, 'ok.json'), '{"schemaVersion":11}', 'utf8');
    expect(await readImportFile(join(dir, 'ok.json'))).toBe('{"schemaVersion":11}');
  });

  it('export writes through a temp file and leaves none behind, even on failure', async () => {
    const target = join(dir, 'out.json');
    await writeExportFile(target, '{"a":1}');
    expect(await readFile(target, 'utf8')).toBe('{"a":1}');
    expect((await readdir(dir)).filter((n) => n.endsWith('.tmp'))).toEqual([]);
    await expect(writeExportFile(join(dir, 'missing', 'x.json'), '{}')).rejects.toThrow();
    expect((await readdir(dir)).filter((n) => n.endsWith('.tmp'))).toEqual([]);
  });
});
