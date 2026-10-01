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
} as const;
