// Canvas sizes. Standard categories (art standard §4) are enforced by assets:check; catalogue sizes
// (environment catalogue §1–§3) only shape the generated placeholders.
import type { AssetManifest, ManifestSection } from '../../src/core/assets/manifestSchema';

export interface Size {
  width: number;
  height: number;
}

const sq = (n: number): Size => ({ width: n, height: n });

/** Environment catalogue sizes by file stem (without extension). */
export const CATALOGUE_SIZES: Record<string, Size> = {
  // Buildings and props are cut at one world scale from asset/building/ (A4, scripts/cut-buildings).
  prop_feed_trough_empty: { width: 296, height: 200 },
  prop_feed_trough_half: { width: 296, height: 200 },
  prop_feed_trough_full: { width: 296, height: 200 },
  prop_order_board: { width: 200, height: 272 },
  prop_gift_box: sq(192),
  env_sky: { width: 1600, height: 500 },
  env_cloud_1: { width: 384, height: 160 },
  env_cloud_2: { width: 384, height: 160 },
  env_hills_far: { width: 1600, height: 300 },
  env_trees_mid: { width: 1600, height: 260 },
  env_ground_grass: sq(512),
  prop_pig_house: { width: 384, height: 304 },
  prop_hay_shed: { width: 424, height: 336 },
  prop_water_well: { width: 304, height: 280 },
  prop_shop_stall: { width: 328, height: 344 },
  prop_windmill: { width: 272, height: 328 },
  prop_fence_section: { width: 208, height: 128 },
  prop_water_bowl: { width: 192, height: 136 },
  prop_mud_puddle: { width: 256, height: 128 },
  prop_food_sack: { width: 176, height: 184 },
  prop_apple_crate: { width: 200, height: 152 },
  prop_veggie_patch: { width: 232, height: 136 },
  prop_bush: { width: 176, height: 128 },
  prop_rock: { width: 152, height: 96 },
  prop_red_tree: { width: 144, height: 160 },
  prop_wheelbarrow: { width: 200, height: 120 },
  prop_hay_bale: { width: 176, height: 128 },
  prop_sunflower: { width: 160, height: 152 },
  prop_mushroom: { width: 88, height: 100 },
};

type Row = AssetManifest[ManifestSection][number];

/** Size the standard requires for one file of a row, or null when the standard sets none. */
export function requiredSize(section: ManifestSection, row: Row, key: string): Size | null {
  if (key === 'anchors') return null;
  switch (section) {
    case 'pigs':
      return sq(512);
    case 'ui':
      return sq(128);
    case 'fx': {
      const fx = row as AssetManifest['fx'][number];
      if (fx.frames) return { width: fx.frames.width * fx.frames.count, height: fx.frames.height };
      return fx.particle ? sq(64) : sq(256);
    }
    default:
      return null;
  }
}

/** Placeholder size: the standard first, then the catalogue, else 256². */
export function placeholderSize(
  section: ManifestSection,
  row: Row,
  key: string,
  path: string,
): Size {
  const stem = path
    .split('/')
    .pop()!
    .replace(/\.\w+$/, '');
  return requiredSize(section, row, key) ?? CATALOGUE_SIZES[stem] ?? sq(256);
}
