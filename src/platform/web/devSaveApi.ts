// Contract of the `npm run dev` save API (DECISIONS AM-1), shared by the Vite plugin
// (scripts/dev/saveApi.ts) and the browser adapter (devFileSaves.ts). Constants only.

/**
 * Route prefix: GET load · POST write {json} · POST markCorrupt {source} · GET backups ·
 * POST restore {name} · POST backupBeforeReset · POST backupBeforeMigration {fromVersion}.
 */
export const DEV_SAVE_ROUTE = '/__unin/save/';
/** Vite HMR custom event: save.json was replaced by another program (admin dashboard). */
export const DEV_SAVE_EVENT = 'unin:save-changed';
/** <meta name> the plugin injects into index.html: the API is there, use the file save. */
export const DEV_SAVE_META = 'unin-dev-saves';
