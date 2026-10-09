// Shape of `window.unin` (spec §13.1), shared by electron/preload.ts and src/platform/desktop.
// Types only: no runtime code, no DOM or Node types.

/** `save` = saves/save.json, `backup:<file>` = saves/backups/<file>. */
export type SaveCandidateSource = 'save' | `backup:${string}`;

export interface SaveCandidate {
  source: SaveCandidateSource;
  json: string;
}

export interface BackupInfo {
  /** File name inside saves/backups/, e.g. save-20261001-153000.json. */
  name: string;
  /** Epoch ms parsed from the name (local time). */
  at: number;
}

export interface UninBridge {
  save: {
    /** Candidates in read-chain order: save.json, then backups newest first. Main never validates. */
    load(): Promise<SaveCandidate[]>;
    /**
     * Atomic write of the whole save (tmp → flush → rename) plus backup rotation. Rejects on failure,
     * with SAVE_CHANGED_EXTERNALLY in the message when another program replaced save.json (AM-1).
     */
    write(json: string): Promise<void>;
    /** Renames a candidate that failed to parse to save.corrupt-*.json; never deletes (§9.2). */
    markCorrupt(source: SaveCandidateSource): Promise<void>;
    listBackups(): Promise<BackupInfo[]>;
    /** Copies a backup over save.json (the current save is backed up first). */
    restoreBackup(name: string): Promise<void>;
    /** Before "play again": a rotated backup plus a permanent saves/before-reset-*.json copy. */
    backupBeforeReset(): Promise<void>;
    /** Before the first write of a migrated save: a permanent saves/before-migration-v<N>-*.json copy. */
    backupBeforeMigration(fromVersion: number): Promise<void>;
    /** Native save dialog; false when cancelled. */
    exportTo(json: string, suggestedName: string): Promise<boolean>;
    /** Native open dialog; backs up the current save, returns the file text or null when cancelled. */
    importFrom(): Promise<string | null>;
    openFolder(): Promise<void>;
    /** save.json was replaced by another program while the game runs (AM-1). */
    onExternalChange(fn: () => void): void;
  };
  settings: {
    /** settings.json next to the saves folder; null when there is none yet. */
    load(): Promise<string | null>;
    /** Atomic write of the whole file (tmp → flush → rename). Rejects on failure. */
    write(json: string): Promise<void>;
  };
  app: {
    version: string;
    /** Main asks for a flush before the window closes; it waits at most 3 s for the promise. */
    onFlushRequest(flush: () => Promise<void>): void;
  };
}

/**
 * IPC channel names. A type, not a constant: the sandboxed preload cannot load shared modules,
 * so main and preload each write the literals and the compiler checks them against this union.
 */
export type IpcChannel =
  | 'unin:save:load'
  | 'unin:save:write'
  | 'unin:save:markCorrupt'
  | 'unin:save:listBackups'
  | 'unin:save:restoreBackup'
  | 'unin:save:backupBeforeReset'
  | 'unin:save:backupBeforeMigration'
  | 'unin:save:exportTo'
  | 'unin:save:importFrom'
  | 'unin:save:openFolder'
  | 'unin:save:changed'
  | 'unin:settings:load'
  | 'unin:settings:write'
  | 'unin:app:version'
  | 'unin:app:flushRequest'
  | 'unin:app:flushDone';
