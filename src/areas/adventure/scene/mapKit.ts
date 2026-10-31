// The map kit of decision 045 (batches adventure-14-map-v2 / adventure-14b-map-v2-redo, `adv_map_*`): which kit picture draws which
// part of an area. Every id is a manifest id; a picture the manifest lacks falls back to the older art (the callers check). Pure.

/** Ground tiles of a zone drawn from the kit, by tile character (the other zones keep their `adv_tile_*`). */
const KIT_TILES: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  coast: {
    '.': ['adv_map_coast_tile_sand_a'],
    ',': ['adv_map_coast_tile_sand_a'],
    '=': ['adv_map_coast_tile_boardwalk'],
    '#': ['adv_map_coast_tile_tideflat'],
    '~': ['adv_map_coast_tile_sea'],
    '^': ['adv_map_coast_tile_dune'],
    s: ['adv_map_coast_tile_boardwalk'],
    c: ['adv_map_coast_tile_sand_b'],
    F: ['adv_map_coast_tile_tideflat'],
    w: ['adv_map_coast_tile_sea_deep'],
  },
};

/** A tint per tile character over a kit tile: the trodden path darker than the sand, the cliffs darker than the rocks. */
const KIT_TINT: Readonly<Record<string, number>> = { ',': 0xf0dfc4, F: 0xb8aa98, c: 0xd8c0e6 };

/** The kit tile of a zone's tile `c` at (x, y) (variants spread by a fixed hash), or null when the zone has none. */
export function kitTile(zone: string, c: string, x: number, y: number): { id: string; tint: number } | null {
  const ids = KIT_TILES[zone]?.[c];
  if (!ids) return null;
  const h = Math.abs((x * 73856093) ^ (y * 19349663)) % ids.length;
  return { id: ids[h]!, tint: KIT_TINT[c] ?? 0xffffff };
}

/** The zone's wall picture, seen beyond the edges of its areas. */
export const kitWall = (zone: string): string | null => KIT_TILES[zone]?.['#']?.[0] ?? null;

/** The pieces of each zone's cover look (decision 045 covers: tree tops, a rock overhang, a broken roof). */
export const COVER_ART: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  forest: { canopy: ['adv_map_forest_cover_canopy_big', 'adv_map_forest_cover_canopy_mid', 'adv_map_forest_cover_canopy_blossom'] },
  mountain: { rock: ['adv_map_mountain_cover_overhang_big', 'adv_map_mountain_cover_overhang_mid'], canopy: ['adv_map_mountain_cover_pines_top'] },
  ruins: { roof: ['adv_map_ruins_cover_roof_big', 'adv_map_ruins_cover_vault'], canopy: ['adv_map_ruins_cover_deadtree_top'] },
  coast: { canopy: ['adv_map_coast_cover_palms_big', 'adv_map_coast_cover_palm_one'], rock: ['adv_map_coast_cover_seacave_ceiling'], roof: ['adv_map_coast_cover_awning'] },
};

/** A treasure chest by its kind (decision 045 §12), open or shut; a mimic wears the shut false chest. */
export const chestArt = (type: string | undefined, open: boolean): string => `adv_map_chest_${type ?? 'wood'}${open ? '_open' : ''}`;
export const MIMIC_ART = 'adv_map_chest_mimic';

/** An element device by the word in its id (a fire brazier, a water wheel…), else by its element: its picture dark, and lit. */
const PUZZLE_BY_WORD: readonly [string, string, string][] = [
  ['brazier', 'adv_map_puzzle_brazier', 'adv_map_puzzle_brazier_lit'],
  ['wheel', 'adv_map_puzzle_wheel', 'adv_map_puzzle_wheel_on'],
  ['rod', 'adv_map_puzzle_rod', 'adv_map_puzzle_rod_on'],
  ['gear', 'adv_map_puzzle_gear', 'adv_map_puzzle_gear_open'],
  ['plate', 'adv_map_puzzle_plate', 'adv_map_puzzle_plate_down'],
  ['clam', 'adv_map_coast_exit_clam', 'adv_map_coast_exit_clam_open'],
];
const PUZZLE_BY_ELEMENT: Readonly<Record<string, [string, string]>> = {
  FIRE: ['adv_map_puzzle_brazier', 'adv_map_puzzle_brazier_lit'],
  WATER: ['adv_map_puzzle_wheel', 'adv_map_puzzle_wheel_on'],
  LIGHTNING: ['adv_map_puzzle_rod', 'adv_map_puzzle_rod_on'],
  METAL: ['adv_map_puzzle_gear', 'adv_map_puzzle_gear_open'],
  EARTH: ['adv_map_puzzle_plate', 'adv_map_puzzle_plate_down'],
  NATURE: ['adv_map_puzzle_pod', 'adv_map_puzzle_pod_open'],
  DARK: ['adv_map_puzzle_veil', 'adv_map_puzzle_veil_gone'],
  LIGHT: ['adv_map_puzzle_mirror', 'adv_map_puzzle_mirror_lit'],
};
export function puzzleArt(id: string, element: string, lit: boolean): string {
  const word = PUZZLE_BY_WORD.find(([w]) => id.includes(w));
  const pair = word ? [word[1], word[2]] : (PUZZLE_BY_ELEMENT[element] ?? PUZZLE_BY_ELEMENT.LIGHT!);
  return pair[lit ? 1 : 0]!;
}

/**
 * The corrupted dressing of each zone (decision 045 §10): flat marks on the ground (sludge, cracks, roots) and small upright pieces
 * (crystals, wilted flowers, the zone's own sick plants and stones), scattered more the more corrupted the area is.
 */
export const CORRUPT_FLAT: readonly string[] = ['adv_map_corrupt_sludge', 'adv_map_corrupt_cracks', 'adv_map_corrupt_roots'];
export const CORRUPT_UPRIGHT: Readonly<Record<string, readonly string[]>> = {
  forest: ['adv_map_corrupt_crystal_s', 'adv_map_corrupt_wilted', 'adv_map_forest_corrupt_bush', 'adv_map_forest_corrupt_mushrooms', 'adv_map_forest_corrupt_rock', 'adv_map_forest_corrupt_log'],
  mountain: ['adv_map_corrupt_crystal_s', 'adv_map_corrupt_crystal_l', 'adv_map_mountain_corrupt_ore', 'adv_map_mountain_corrupt_boulder'],
  coast: ['adv_map_corrupt_crystal_s', 'adv_map_coast_corrupt_coral', 'adv_map_coast_corrupt_kelp', 'adv_map_coast_corrupt_pool', 'adv_map_coast_corrupt_driftwood'],
  ruins: ['adv_map_corrupt_crystal_s', 'adv_map_corrupt_crystal_l', 'adv_map_ruins_corrupt_shard', 'adv_map_ruins_corrupt_brazier', 'adv_map_ruins_corrupt_stump', 'adv_map_corrupt_wilted'],
};

/** The tall pieces framing a coast area and its decals of shells (the other zones keep theirs). */
export const COAST_FRAME: readonly string[] = ['adv_map_coast_prop_palm', 'adv_map_coast_prop_barnacle_rock', 'adv_map_coast_prop_palm', 'adv_map_coast_prop_bush'];

/** Every kit picture the game draws: the manifest rows of the kit (`scripts/assets/mapKitSizes.json`) are these. */
export const KIT_IDS: readonly string[] = [
  ...new Set([
    ...Object.values(KIT_TILES).flatMap((z) => Object.values(z).flat()),
    ...Object.values(COVER_ART).flatMap((z) => Object.values(z).flat()),
    ...['wood', 'silver', 'gold', 'hidden'].flatMap((t) => [chestArt(t, false), chestArt(t, true)]),
    MIMIC_ART,
    ...PUZZLE_BY_WORD.flatMap(([, a, b]) => [a, b]),
    ...Object.values(PUZZLE_BY_ELEMENT).flat(),
    ...CORRUPT_FLAT,
    ...Object.values(CORRUPT_UPRIGHT).flat(),
    ...COAST_FRAME,
    'adv_map_coast_prop_shells',
  ]),
];
