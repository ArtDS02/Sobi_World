// Sobi Farm save history (spec §9.2): the farm document's version (v7, the FarmGame shape) and the
// refunds its migrations applied. Frozen: these describe saves that already exist.
import type { BreedId } from '../config/ids';

/** Version of the Sobi Farm save document (the farm's working state keeps this shape). */
export const FARM_DOC_VERSION = 7;

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
