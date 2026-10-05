// Dev browser adapter (spec §9.1, §9.2): IndexedDB primary + localStorage mirror + backup.
import { openDB, type IDBPDatabase } from 'idb';
import { SAVE } from '../../core/config/save';
import type { MigrateResult } from '../../core/save/migrate';
import type { LoadSource, SaveStorage } from '../../core/save/port';

export type { LoadResult, LoadSource, SaveStorage } from '../../core/save/port';

/** The subset of localStorage this module uses; injectable for tests. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StorageOptions {
  /** JSON text → migrated, validated world save (core parseSave + the build's codec). */
  parseSave: (json: string) => MigrateResult;
  local?: KeyValueStore;
  dbName?: string;
}

export function createSaveStorage(opts: StorageOptions): SaveStorage {
  const { parseSave } = opts;
  const local = opts.local ?? globalThis.localStorage;
  const dbName = opts.dbName ?? SAVE.IDB_NAME;
  let dbPromise: Promise<IDBPDatabase> | null = null;
  let lastGoodJson: string | null = null;
  let locked = false; // a newer-version save exists somewhere in the chain

  const db = () =>
    (dbPromise ??= openDB(dbName, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(SAVE.IDB_STORE)) d.createObjectStore(SAVE.IDB_STORE);
      },
    }));

  async function readPrimary(): Promise<string | null> {
    try {
      const value: unknown = await (await db()).get(SAVE.IDB_STORE, SAVE.IDB_KEY);
      return typeof value === 'string' ? value : value === undefined ? null : JSON.stringify(value);
    } catch {
      return null; // IndexedDB unavailable: fall through to the mirror
    }
  }

  const readLocal = (key: string): string | null => {
    try {
      return local.getItem(key);
    } catch {
      return null;
    }
  };

  return {
    async load() {
      const candidates: [LoadSource, string | null][] = [
        ['primary', await readPrimary()],
        ['mirror', readLocal(SAVE.MIRROR_KEY)],
        ['backup', readLocal(SAVE.BACKUP_KEY)],
      ];
      if (candidates.every(([, json]) => json === null)) return { kind: 'empty' };

      for (const [source, json] of candidates) {
        if (json === null) continue;
        const parsed = parseSave(json);
        if (parsed.ok) {
          lastGoodJson = JSON.stringify(parsed.save);
          return { kind: 'ok', save: parsed.save, source, fromVersion: parsed.fromVersion };
        }
        if (parsed.error === 'SAVE_TOO_NEW') {
          locked = true; // an older copy would silently lose the newer progress
          return { kind: 'tooNew', source };
        }
      }
      return { kind: 'recovery' };
    },

    async save(save) {
      if (locked) throw new Error('SAVE_TOO_NEW: refusing to overwrite a newer save');
      const json = JSON.stringify(save);
      if (lastGoodJson !== null && lastGoodJson !== json)
        local.setItem(SAVE.BACKUP_KEY, lastGoodJson);
      await (await db()).put(SAVE.IDB_STORE, json, SAVE.IDB_KEY);
      local.setItem(SAVE.MIRROR_KEY, json);
      lastGoodJson = json;
    },
  };
}
