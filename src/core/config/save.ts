// Persistence constants (spec §5, §9).
export const SAVE = {
  SCHEMA_VERSION: 2,
  IDB_NAME: 'un-in-homemade',
  IDB_STORE: 'saves',
  IDB_KEY: 'current',
  MIRROR_KEY: 'un-in-homemade:save:mirror',
  BACKUP_KEY: 'un-in-homemade:save:backup',
  TRANSACTIONS_MAX: 200, // newest first, oldest dropped
  BREEDING_RECORDS_MAX: 100,
  EXPORT_REMINDER_DAYS: 7,
  EXPORT_FILE_PREFIX: 'un-in-save-',

  // Runtime loop (§7.1, §9.1, §9.4)
  TICK_MS: 1000, // one global interval while visible
  AUTOSAVE_MS: 30_000,
  TAB_CHANNEL: 'un-in-homemade:tabs',
  /** Backoff after a failed write (§9.2); the last step repeats until a write succeeds. */
  SAVE_RETRY_MS: [1000, 5000, 30_000],
  TAB_HANDSHAKE_MS: 150, // wait for an existing tab to answer before allowing writes
} as const;
