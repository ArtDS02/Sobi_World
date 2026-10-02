// Ports between the store and the platform (spec §4, §9.1–9.4). Types only: adapters live in
// src/platform/{web,desktop}/ and move JSON; parsing, validation and migration stay in core.
import type { SaveGame } from '../types';

export type LoadSource = 'primary' | 'mirror' | 'backup';

export type LoadResult =
  | { kind: 'ok'; save: SaveGame; source: LoadSource }
  | { kind: 'empty' } // first launch: caller creates newGame
  | { kind: 'tooNew'; source: LoadSource } // SAVE_TOO_NEW: never overwrite
  | { kind: 'recovery' }; // all copies invalid: recovery screen, nothing deleted

export interface SaveStorage {
  /** Read chain (§9.2). Never writes or deletes. */
  load(): Promise<LoadResult>;
  /** Writes the whole save. Rejects on failure; the store surfaces it as `saveError`. */
  save(save: SaveGame): Promise<void>;
}

export interface FileDialogs {
  /** Saves `json` to a file the player picks; false when cancelled. */
  exportSave(json: string, suggestedName: string): Promise<boolean>;
  /** Text of the file the player picks, or null when cancelled. */
  importSave(): Promise<string | null>;
  /** Opens the save folder; null where the platform has no folder (browser). */
  openSaveFolder(): Promise<void> | null;
}

/** A rotated backup of the save (desktop: saves/backups/<name>). */
export interface BackupInfo {
  name: string;
  /** Epoch ms of the backup (from its name). */
  at: number;
}

/** Backups the player can pick in settings or on the recovery screen (§9.2). */
export interface BackupStore {
  /** Newest first. */
  list(): Promise<BackupInfo[]>;
  /** Puts a backup back as the save (the current save is backed up first). */
  restore(name: string): Promise<void>;
  /** Before "play again" (PG-4): the current save is kept as a backup the player can restore. */
  backupBeforeReset(): Promise<void>;
}

/** One writer per save (§9.4): tab guard in the browser, single-instance lock on desktop. */
export interface InstanceGuard {
  /** Claims the save; resolves true when this instance may write. `onReadOnly` fires once. */
  start(onReadOnly: () => void): Promise<boolean>;
  isReadOnly(): boolean;
  close(): void;
}
