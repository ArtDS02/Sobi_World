// Persistence constants (spec §5, §9).
import type { BreedId } from './ids';

export const SAVE = {
  SCHEMA_VERSION: 5,
  IDB_NAME: 'un-in-homemade',
  IDB_STORE: 'saves',
  IDB_KEY: 'current',
  MIRROR_KEY: 'un-in-homemade:save:mirror',
  BACKUP_KEY: 'un-in-homemade:save:backup',
  TRANSACTIONS_MAX: 200, // newest first, oldest dropped
  BREEDING_RECORDS_MAX: 100,
  EXPORT_REMINDER_DAYS: 7,
  /** The away summary opens when the catch-up covers at least this long (§9.5). */
  AWAY_SUMMARY_MIN_MS: 10 * 60 * 1000,
  EXPORT_FILE_PREFIX: 'un-in-save-',

  // Runtime loop (§7.1, §9.1, §9.4)
  TICK_MS: 1000, // one global interval while visible
  AUTOSAVE_MS: 30_000,
  TAB_CHANNEL: 'un-in-homemade:tabs',
  /** Backoff after a failed write (§9.2); the last step repeats until a write succeeds. */
  SAVE_RETRY_MS: [1000, 5000, 30_000],
  TAB_HANDSHAKE_MS: 150, // wait for an existing tab to answer before allowing writes
} as const;

/**
 * Save v2 -> v3 (DECISIONS U00-1 D3): these skins were sold for gold but are really species.
 * A pink pig wearing one becomes that species; one owned and worn by nobody is refunded.
 */
export const V3_SPECIES_SKINS: Record<string, BreedId> = {
  pig_white: 'PIG_WHITE',
  pig_black: 'PIG_BLACK',
  pig_brown: 'PIG_BROWN',
  pig_spotted: 'PIG_SPOTTED',
};
export const V3_SKIN_REFUND_GOLD = 2000; // their shop price in save v2

/**
 * Save v4 -> v5 (DECISIONS A2-1): outfits are gone. Each outfit a save owned is refunded at its
 * shop price, except the two that were really bodies: a pink pig wearing one becomes that species.
 */
export const V5_OUTFIT_PRICES: Record<string, number> = {
  pig_farmer: 2000,
  pig_chef: 2000,
  pig_nerd: 2000,
  pig_knight: 2000,
  pig_wizard: 2000,
  pig_cowboy: 2000,
  pig_detective: 2000,
  pig_ghost: 2000,
  pig_christmas: 2000,
  pig_tet: 2000,
  pig_pilot: 2000,
  pig_pirate: 6000,
  pig_ninja: 6000,
  pig_robot: 6000,
  pig_unicorn: 6000,
};
export const V5_BODY_OUTFITS: Record<string, BreedId> = {
  pig_robot: 'PIG_ROBOT',
  pig_unicorn: 'PIG_UNICORN',
};
