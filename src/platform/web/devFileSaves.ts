// `npm run dev` in a browser plays the dev save FILE, the same farm as `npm run dev:desktop` and the
// one the admin dashboard edits (DECISIONS AM-1). Talks to the dev-only Vite plugin
// (scripts/dev/saveApi.ts); the shipped desktop game uses window.unin instead.
import { SAVE_CHANGED_EXTERNALLY, type BackupStore, type SaveStorage } from '../../core/save/port';
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

/**
 * The dev save file; when it does not exist yet, a farm left in this browser's IndexedDB (dev
 * before AM-1) is carried over once instead of starting a new one.
 */
export function createDevFileSaveStorage(legacy: SaveStorage): SaveStorage {
  const files = createFileSaveStorage(bridge);
  return {
    ...files,
    async load() {
      const r = await files.load();
      if (r.kind !== 'empty') return r;
      const old = await legacy.load();
      if (old.kind !== 'ok') return r;
      await files.save(old.save);
      return { ...old, source: 'primary' };
    },
  };
}
