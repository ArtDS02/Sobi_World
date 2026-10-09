import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';
import { SAVE } from '../../src/core/config/save';
import { importSave } from '../../src/core/save/exportImport';
import { createSaveStorage, type KeyValueStore } from '../../src/platform/web/idbSaveStorage';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';
import { parseWorldSave, world } from './worldKit';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { WORLD_SAVE_VERSION } from '../../src/core/save/world';

class MemoryStore implements KeyValueStore {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
}

let local: MemoryStore;
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  local = new MemoryStore();
});

const storage = () => createSaveStorage({ local, parseSave: parseWorldSave });
async function writePrimary(value: unknown) {
  const db = await openDB(SAVE.IDB_NAME, 1, {
    upgrade: (d) => void d.createObjectStore(SAVE.IDB_STORE),
  });
  await db.put(SAVE.IDB_STORE, value, SAVE.IDB_KEY);
  db.close();
}
async function readPrimary(): Promise<unknown> {
  const db = await openDB(SAVE.IDB_NAME, 1, {
    upgrade: (d) => void d.createObjectStore(SAVE.IDB_STORE),
  });
  const v: unknown = await db.get(SAVE.IDB_STORE, SAVE.IDB_KEY);
  db.close();
  return v;
}

const A = world(makeState([makePig()], 3));
const B = { ...A, wallet: { ...A.wallet, coins: 1234 } };
const C = { ...A, wallet: { ...A.wallet, coins: 99 } };

describe('storage (§9.1, §9.2, §14.6)', () => {
  it('first launch is empty', async () => {
    expect(await storage().load()).toEqual({ kind: 'empty' });
  });

  it('round-trip equality; mirror holds the same JSON string', async () => {
    const s = storage();
    await s.save(A);
    expect(await storage().load()).toEqual({ kind: 'ok', save: A, source: 'primary', fromVersion: 8 });
    expect(local.getItem(SAVE.MIRROR_KEY)).toBe(JSON.stringify(A));
    expect(await readPrimary()).toBe(JSON.stringify(A));
  });

  it('copies the previous good save to the backup key before overwriting', async () => {
    const s = storage();
    await s.save(A);
    expect(local.getItem(SAVE.BACKUP_KEY)).toBeNull();
    await s.save(B);
    expect(local.getItem(SAVE.BACKUP_KEY)).toBe(JSON.stringify(A));
    expect(await storage().load()).toMatchObject({ kind: 'ok', save: B, source: 'primary' });
  });

  it('corrupt primary → mirror', async () => {
    local.setItem(SAVE.MIRROR_KEY, JSON.stringify(B));
    local.setItem(SAVE.BACKUP_KEY, JSON.stringify(A));
    await writePrimary('{broken');
    expect(await storage().load()).toEqual({ kind: 'ok', save: B, source: 'mirror', fromVersion: 8 });
  });

  it('IndexedDB wiped (no primary) → mirror', async () => {
    local.setItem(SAVE.MIRROR_KEY, JSON.stringify(B));
    expect(await storage().load()).toEqual({ kind: 'ok', save: B, source: 'mirror', fromVersion: 8 });
  });

  it('corrupt primary and mirror → backup', async () => {
    await writePrimary(JSON.stringify({ ...A, wallet: { ...A.wallet, coins: -5 } }));
    local.setItem(SAVE.MIRROR_KEY, 'nope');
    local.setItem(SAVE.BACKUP_KEY, JSON.stringify(A));
    expect(await storage().load()).toEqual({ kind: 'ok', save: A, source: 'backup', fromVersion: 8 });
  });

  it('everything corrupt → recovery, nothing deleted or rewritten', async () => {
    await writePrimary('{broken');
    local.setItem(SAVE.MIRROR_KEY, 'nope');
    local.setItem(SAVE.BACKUP_KEY, '[]');
    expect(await storage().load()).toEqual({ kind: 'recovery' });
    expect(await readPrimary()).toBe('{broken');
    expect(local.getItem(SAVE.MIRROR_KEY)).toBe('nope');
    expect(local.getItem(SAVE.BACKUP_KEY)).toBe('[]');
  });

  it('future schemaVersion is refused and never overwritten', async () => {
    const future = JSON.stringify({ ...A, schemaVersion: WORLD_SAVE_VERSION + 1 });
    await writePrimary(future);
    local.setItem(SAVE.MIRROR_KEY, JSON.stringify(A));
    const s = storage();
    expect(await s.load()).toEqual({ kind: 'tooNew', source: 'primary' });
    await expect(s.save(A)).rejects.toThrow(/SAVE_TOO_NEW/);
    expect(await readPrimary()).toBe(future);
  });

  it('a failed import leaves the existing save untouched', async () => {
    const s = storage();
    await s.save(A);
    await s.save(C);
    const before = [
      await readPrimary(),
      local.getItem(SAVE.MIRROR_KEY),
      local.getItem(SAVE.BACKUP_KEY),
    ];
    expect(importSave('{bad', SAVE_CODEC).ok).toBe(false);
    expect(importSave(JSON.stringify({ schemaVersion: 2 }), SAVE_CODEC).ok).toBe(false);
    const after = [
      await readPrimary(),
      local.getItem(SAVE.MIRROR_KEY),
      local.getItem(SAVE.BACKUP_KEY),
    ];
    expect(after).toEqual(before);
    expect(await storage().load()).toMatchObject({ kind: 'ok', save: C });
  });
});
