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
  prop_feed_trough_empty: { width: 384, height: 256 },
  prop_feed_trough_half: { width: 384, height: 256 },
  prop_feed_trough_full: { width: 384, height: 256 },
  prop_order_board: { width: 256, height: 384 },
  env_sky: { width: 1600, height: 500 },
  env_cloud_1: { width: 384, height: 160 },
  env_cloud_2: { width: 384, height: 160 },
  env_hills_far: { width: 1600, height: 300 },
  env_trees_mid: { width: 1600, height: 260 },
  env_ground_grass: sq(512),
  prop_pig_house: { width: 512, height: 448 },
  prop_hay_shed: sq(384),
  prop_water_well: { width: 256, height: 384 },
  prop_shop_stall: sq(384),
  prop_water_pump: { width: 256, height: 320 },
  prop_windmill: { width: 384, height: 512 },
  prop_fence_section: { width: 256, height: 160 },
  prop_water_bowl: { width: 192, height: 128 },
  prop_mud_puddle: { width: 256, height: 160 },
  prop_food_sack: { width: 192, height: 224 },
  prop_apple_crate: sq(256),
  prop_hay_bale: sq(192),
  prop_wheelbarrow: { width: 256, height: 192 },
  prop_barrel: { width: 160, height: 192 },
  prop_signpost: { width: 160, height: 256 },
  prop_bush: { width: 192, height: 128 },
  prop_rock: { width: 160, height: 112 },
  prop_sunflower: { width: 192, height: 256 },
  prop_mushroom: { width: 96, height: 112 },
};

type Row = AssetManifest[ManifestSection][number];

/** Size the standard requires for one file of a row, or null when the standard sets none. */
export function requiredSize(section: ManifestSection, row: Row, key: string): Size | null {
  if (key === 'anchors') return null;
  switch (section) {
    case 'pigs':
      return sq(512);
    case 'cosmetics':
      return sq(256);
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
