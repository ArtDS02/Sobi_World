// `npm run dev` in a browser plays the dev save FILE, the same farm as `npm run dev:desktop` and the
// one the admin dashboard edits (DECISIONS AM-1). Talks to the dev-only Vite plugin
// (scripts/dev/saveApi.ts); the shipped desktop game uses window.unin instead.
import { SAVE_CHANGED_EXTERNALLY, type BackupStore, type SaveStorage } from '../../core/save/port';
import type { SaveGame } from '../../core/types';
import type { BackupInfo, SaveCandidate } from '../desktop/bridge';
import { createFileSaveStorage, type SaveFileBridge } from '../desktop/fileSaveStorage';
import { DEV_SAVE_EVENT, DEV_SAVE_META, DEV_SAVE_ROUTE } from './devSaveApi';

/** True when index.html came from the dev server with the save API. */
export const hasDevSaveApi = () => document.querySelector(`meta[name="${DEV_SAVE_META}"]`) !== null;

async function call<T>(path: string, payload?: unknown): Promise<T> {
  const res = await fetch(DEV_SAVE_ROUTE + path, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const body = (await res.json()) as T & { error?: string };
  if (res.status === 409) throw new Error(SAVE_CHANGED_EXTERNALLY);
  if (!res.ok) throw new Error(body?.error ?? `dev save API ${res.status}`);
  return body;
}

const bridge: SaveFileBridge = {
  load: () => call<SaveCandidate[]>('load'),
  write: (json) => call<void>('write', { json }),
  markCorrupt: (source) => call<void>('markCorrupt', { source }),
  onExternalChange: (fn) => import.meta.hot?.on(DEV_SAVE_EVENT, fn),
};

export const devBackups: BackupStore = {
  list: () => call<BackupInfo[]>('backups'),
  restore: (name) => call<void>('restore', { name }),
  backupBeforeReset: () => call<void>('backupBeforeReset', {}),
};

/** Last action or last world tick (the trough is resolved on every tick). */
const lastPlayed = (s: SaveGame) => Math.max(s.updatedAt, s.trough.lastResolvedAt);

const MIGRATED_KEY = 'unin:dev-file-save-migrated';
const flag = {
  get: () => {
    try {
      return localStorage.getItem(MIGRATED_KEY) !== null;
    } catch {
      return false;
    }
  },
  set: () => {
    try {
      localStorage.setItem(MIGRATED_KEY, '1');
    } catch {
      /* storage blocked: the check simply runs again next time */
    }
  },
};

/**
 * The dev save file. Once per browser, a farm left in IndexedDB (`npm run dev` before AM-1) is
 * carried over when it is newer than the file (or there is no file); the file copy it replaces is
 * kept in saves/backups/ by the first write of the session. Nothing is deleted.
 */
export function createDevFileSaveStorage(legacy: SaveStorage, migrated = flag): SaveStorage {
  const files = createFileSaveStorage(bridge);
  return {
    ...files,
    async load() {
      const r = await files.load();
      if (migrated.get() || r.kind === 'tooNew') return r;
      const old = await legacy.load();
      migrated.set();
      if (old.kind !== 'ok' || (r.kind === 'ok' && lastPlayed(r.save) >= lastPlayed(old.save))) return r;
      await files.save(old.save);
      return { ...old, source: 'primary' };
    },
  };
}
