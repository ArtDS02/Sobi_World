// IndexedDB primary + localStorage mirror + backup (spec §9.1, §9.2).
// The only file in src/core allowed to touch browser APIs (DECISIONS A1).
import { openDB, type IDBPDatabase } from 'idb';
import { SAVE } from '../config/save';
import type { SaveGame } from '../types';
import { parseSave } from './migrate';

/** The subset of localStorage this module uses; injectable for tests. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type LoadSource = 'primary' | 'mirror' | 'backup';

export type LoadResult =
  | { kind: 'ok'; save: SaveGame; source: LoadSource }
  | { kind: 'empty' } // first launch: caller creates newGame
  | { kind: 'tooNew'; source: LoadSource } // SAVE_TOO_NEW: never overwrite
  | { kind: 'recovery' }; // all copies invalid: recovery screen, nothing deleted

export interface SaveStorage {
  /** Read chain: primary → mirror → backup → recovery. Never writes or deletes. */
  load(): Promise<LoadResult>;
  /** Backup previous good save, write IndexedDB, then mirror the same JSON string. */
  save(save: SaveGame): Promise<void>;
}

export interface StorageOptions {
  local?: KeyValueStore;
  dbName?: string;
}

export function createSaveStorage(opts: StorageOptions = {}): SaveStorage {
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
          return { kind: 'ok', save: parsed.save, source };
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

/** §9.4: ask the browser not to evict our data. Call after the first successful action. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await globalThis.navigator?.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
