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
  prop_pig_house: { width: 384, height: 355 },
  prop_hay_shed: { width: 424, height: 336 },
  prop_water_well: { width: 304, height: 280 },
  prop_shop_stall: { width: 328, height: 344 },
  prop_windmill: { width: 272, height: 328 },
  // The plaza (GĐ3): doors to the Areas that have no art yet, the farm's exit sign, the character.
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

// Sobi Garden (GĐ5): a plot, a crop on it (feet at the bottom), the sprinkler and the two workshops.
for (const plot of ['plot_soil', 'plot_soil_wet', 'plot_locked']) CATALOGUE_SIZES[plot] = { width: 152, height: 108 };
for (const crop of ['grass', 'wheat', 'corn', 'potato', 'carrot']) {
  for (const stage of ['sprout', 'grow', 'ripe', 'wilt']) CATALOGUE_SIZES[`crop_${crop}_${stage}`] = { width: 152, height: 132 };
}
CATALOGUE_SIZES.bld_sprinkler = { width: 120, height: 200 };
CATALOGUE_SIZES.bld_feed_mill = { width: 260, height: 260 };
CATALOGUE_SIZES.bld_composter = { width: 220, height: 200 };
// GĐ14 Garden scene on the owner's mock-up: the painted field (sheet E of garden-01-scene, ×1.25 like bg_cloud).
CATALOGUE_SIZES.bg_garden = { width: 1812, height: 900 };

// Sobi Aquarium (GĐ8): the fish swimming (facing right), the tank, the dock and the sea backdrop.
for (const fish of ['goldfish', 'perch', 'carp', 'clownfish', 'pufferfish', 'angelfish', 'glowfish', 'betta', 'lanternfish', 'seahorse', 'dragon_koi', 'moonfish']) {
  CATALOGUE_SIZES[`fish_${fish}`] = { width: 192, height: 120 };
}
CATALOGUE_SIZES.bld_fish_tank = { width: 640, height: 400 };
CATALOGUE_SIZES.bld_fish_dock = { width: 520, height: 300 };
CATALOGUE_SIZES.bg_aquarium = { width: 1600, height: 900 };

// Sobi Cloud (GĐ9): a flower on its plot (feet at the bottom), the cloud plot, the spring, the cauldron and the sky backdrop.
for (const flower of ['cloud_daisy', 'dandelion', 'rainbow_rose', 'star_orchid', 'moon_lily', 'dream_bell']) {
  for (const stage of ['sprout', 'grow', 'ripe', 'wilt']) CATALOGUE_SIZES[`flower_${flower}_${stage}`] = { width: 152, height: 132 };
}
CATALOGUE_SIZES.plot_cloud = { width: 152, height: 108 };
CATALOGUE_SIZES.bld_cloud_spring = { width: 220, height: 240 };
CATALOGUE_SIZES.bld_cauldron = { width: 220, height: 220 };
// The backdrop is as wide as the owner's mock-up (≈ 2:1, decision 023) so wide screens show no edge; 16:9 crops its sides.
CATALOGUE_SIZES.bg_cloud = { width: 1816, height: 900 };
// GĐ14 Cloud scene dressing (decision 023): label plank, tier title banner, the ambient bird, the alchemist owl.
CATALOGUE_SIZES.prop_sign_plank = { width: 300, height: 110 };
CATALOGUE_SIZES.prop_title_banner = { width: 520, height: 198 };
CATALOGUE_SIZES.prop_cloud_bird = { width: 180, height: 150 };
CATALOGUE_SIZES.prop_npc_alchemist = { width: 240, height: 300 };

// GĐ14 plaza on the owner's mock-up (decision 024, batch world-01-scene). The backdrop has the mock-up's own shape
// (1837 × 856 → 1932 × 900) and is the plaza's design frame; the doors are redrawn at the mock-up's scale.
CATALOGUE_SIZES.bg_plaza = { width: 1932, height: 900 };
CATALOGUE_SIZES.prop_portal_gate = { width: 400, height: 320 };
CATALOGUE_SIZES.prop_sea_dock = { width: 280, height: 300 };
CATALOGUE_SIZES.prop_fountain = { width: 220, height: 240 };
CATALOGUE_SIZES.prop_main_house = { width: 360, height: 350 };
CATALOGUE_SIZES.prop_sky_tree = { width: 300, height: 460 };
CATALOGUE_SIZES.prop_garden_gate = { width: 620, height: 320 };
CATALOGUE_SIZES.prop_farm_yard = { width: 760, height: 460 };
CATALOGUE_SIZES.prop_plaza_tree_round = { width: 260, height: 300 };
CATALOGUE_SIZES.prop_plaza_tree_pine = { width: 220, height: 300 };
CATALOGUE_SIZES.prop_plaza_bush = { width: 200, height: 140 };
CATALOGUE_SIZES.prop_plaza_flowerbed = { width: 200, height: 120 };
CATALOGUE_SIZES.prop_plaza_lamp = { width: 90, height: 260 };
CATALOGUE_SIZES.prop_plaza_bench = { width: 200, height: 140 };
CATALOGUE_SIZES.prop_plaza_planter = { width: 200, height: 150 };
CATALOGUE_SIZES.prop_plaza_rock = { width: 180, height: 130 };
CATALOGUE_SIZES.prop_plaza_sign = { width: 320, height: 250 };
CATALOGUE_SIZES.prop_world_logo = { width: 560, height: 220 };
CATALOGUE_SIZES.prop_sobi_mascot = { width: 256, height: 256 };

// Sobi Adventure (GĐ10): the enemies (facing left) and the forest backdrop.
for (const enemy of ['mossling', 'thorn_sprout', 'gale_sparrow', 'ember_fox', 'dew_frog', 'forest_wolf', 'bramble_boar']) CATALOGUE_SIZES[`enemy_${enemy}`] = { width: 192, height: 192 };
CATALOGUE_SIZES.enemy_old_treant = { width: 320, height: 360 };
CATALOGUE_SIZES.bg_adventure_forest = { width: 1600, height: 900 };

// Sobi Adventure (GĐ11): the mountain and the ruins.
for (const enemy of ['rock_beetle', 'cliff_hawk', 'lava_newt', 'snow_goat', 'stone_sentinel', 'rune_wisp', 'tide_wraith', 'ember_idol']) CATALOGUE_SIZES[`enemy_${enemy}`] = { width: 192, height: 192 };
for (const enemy of ['ore_golem']) CATALOGUE_SIZES[`enemy_${enemy}`] = { width: 240, height: 240 };
for (const enemy of ['magma_drake', 'ancient_guardian']) CATALOGUE_SIZES[`enemy_${enemy}`] = { width: 320, height: 360 };
CATALOGUE_SIZES.bg_adventure_mountain = { width: 1600, height: 900 };
CATALOGUE_SIZES.bg_adventure_ruins = { width: 1600, height: 900 };

for (const who of ['so', 'bi']) {
  for (const facing of ['down', 'up', 'left', 'right']) {
    for (const frame of ['idle', 'walk1', 'walk2']) {
      CATALOGUE_SIZES[`chr_${who}_${facing}_${frame}`] = { width: 96, height: 144 };
    }
  }
}

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
