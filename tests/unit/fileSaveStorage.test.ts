import { describe, expect, it } from 'vitest';
import { SAVE } from '../../src/core/config/save';
import type { SaveCandidate, UninBridge } from '../../src/platform/desktop/bridge';
import { createFileSaveStorage } from '../../src/platform/desktop/fileSaveStorage';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

/** In-memory window.unin.save. */
function fakeBridge(candidates: SaveCandidate[], failWrites = false) {
  const writes: string[] = [];
  const corrupt: string[] = [];
  const bridge: UninBridge['save'] = {
    load: async () => candidates,
    write: async (json) => {
      if (failWrites) throw new Error('EACCES');
      writes.push(json);
    },
    markCorrupt: async (source) => void corrupt.push(source),
    listBackups: async () => [],
    restoreBackup: async () => {},
    backupBeforeReset: async () => {},
    exportTo: async () => true,
    importFrom: async () => null,
    openFolder: async () => {},
  };
  return { bridge, writes, corrupt };
}

const good = (gold: number) => {
  const s = makeState([makePig()]);
  return JSON.stringify({ ...s, player: { ...s.player, gold } });
};
const future = JSON.stringify({ schemaVersion: SAVE.SCHEMA_VERSION + 1 });
const B1 = 'backup:save-20261001-120000.json' as const;
const B2 = 'backup:save-20261001-110000.json' as const;

describe('FileSaveStorage', () => {
  it('no files → empty', async () => {
    expect(await createFileSaveStorage(fakeBridge([]).bridge).load()).toEqual({ kind: 'empty' });
  });

  it('valid save.json → ok from primary', async () => {
    const f = fakeBridge([{ source: 'save', json: good(7) }]);
    const r = await createFileSaveStorage(f.bridge).load();
    expect(r).toMatchObject({ kind: 'ok', source: 'primary' });
    expect(r.kind === 'ok' && r.save.player.gold).toBe(7);
  });

  it('corrupt save.json falls back to the newest valid backup; bad files are marked corrupt', async () => {
    const f = fakeBridge([
      { source: 'save', json: '{broken' },
      { source: B1, json: '{"nope":1}' },
      { source: B2, json: good(42) },
    ]);
    const r = await createFileSaveStorage(f.bridge).load();
    expect(r).toMatchObject({ kind: 'ok', source: 'backup' });
    expect(r.kind === 'ok' && r.save.player.gold).toBe(42);
    expect(f.corrupt).toEqual(['save', B1]);
  });

  it('all copies invalid → recovery, every file renamed, nothing written', async () => {
    const f = fakeBridge([
      { source: 'save', json: '{broken' },
      { source: B1, json: '[]' },
    ]);
    expect(await createFileSaveStorage(f.bridge).load()).toEqual({ kind: 'recovery' });
    expect(f.corrupt).toHaveLength(2);
    expect(f.writes).toEqual([]);
  });

  it('too-new stops the chain (no older fallback) and refuses every write', async () => {
    const f = fakeBridge([
      { source: 'save', json: future },
      { source: B1, json: good(1) },
    ]);
    const storage = createFileSaveStorage(f.bridge);
    expect(await storage.load()).toEqual({ kind: 'tooNew', source: 'primary' });
    expect(f.corrupt).toEqual([]); // a newer save is not corrupt
    await expect(storage.save(makeState())).rejects.toThrow('SAVE_TOO_NEW');
    expect(f.writes).toEqual([]);
  });

  it('a failed write rejects so the store can surface saveError', async () => {
    const storage = createFileSaveStorage(fakeBridge([], true).bridge);
    await expect(storage.save(makeState())).rejects.toThrow('EACCES');
  });

  it('save writes the JSON string unchanged', async () => {
    const f = fakeBridge([]);
    const s = makeState([makePig()]);
    await createFileSaveStorage(f.bridge).save(s);
    expect(f.writes).toEqual([JSON.stringify(s)]);
  });
});
