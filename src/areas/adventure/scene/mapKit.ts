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
    F: ['adv_map_coast_tile_dune'],
    w: ['adv_map_coast_tile_sea_deep'],
  },
};

/** A tint per tile character over a kit tile: the trodden path darker than the sand, the cliff rims sandstone brown. */
const KIT_TINT: Readonly<Record<string, number>> = { ',': 0xf0dfc4, F: 0xc89a6a, c: 0xd8c0e6 };

/** The kit tile of a zone's tile `c` at (x, y) (variants spread by a fixed hash), or null when the zone has none. */
export function kitTile(zone: string, c: string, x: number, y: number): { id: string; tint: number } | null {
  const ids = KIT_TILES[zone]?.[c];
  if (!ids) return null;
  const h = Math.abs((x * 73856093) ^ (y * 19349663)) % ids.length;
  return { id: ids[h]!, tint: KIT_TINT[c] ?? 0xffffff };
}

/** The zone's wall picture, seen beyond the edges of its areas. */
export const kitWall = (zone: string): string | null => KIT_TILES[zone]?.['#']?.[0] ?? null;

/** A zone's cliff face in 3/4 (decision 045 §art): the strip repeated along a plateau's front, its two rounded ends, the stairs and
 * the waterfall cut into it. A zone without a piece keeps its tinted tiles there. */
export interface CliffArt {
  cliff: string;
  endL?: string;
  endR?: string;
  stairs?: string;
  waterfall?: string;
}
export const CLIFF_ART: Readonly<Record<string, CliffArt>> = {
  forest: { cliff: 'adv_map_forest_edge_cliff', endL: 'adv_map_forest_edge_cliff_end_l', endR: 'adv_map_forest_edge_cliff_end_r', stairs: 'adv_map_forest_edge_stairs', waterfall: 'adv_map_forest_edge_waterfall' },
  mountain: { cliff: 'adv_map_mountain_edge_cliff', endL: 'adv_map_mountain_edge_cliff_end_l', endR: 'adv_map_mountain_edge_cliff_end_r', stairs: 'adv_map_mountain_edge_stairs', waterfall: 'adv_map_forest_edge_waterfall' },
  // The coast's ends stand in the sea (drawn with water around): its runs end plain.
  coast: { cliff: 'adv_map_coast_edge_cliff', stairs: 'adv_map_coast_edge_stairs', waterfall: 'adv_map_forest_edge_waterfall' },
};

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

/** A zone's own healing spring (sheet S1). */
export const SPRING_ART: Readonly<Record<string, string>> = {
  forest: 'adv_map_spring_forest',
  mountain: 'adv_map_spring_mountain',
  ruins: 'adv_map_spring_ruins',
  coast: 'adv_map_spring_coast',
};

/** An exit by its kind (decision 043 `exits[].kind`) in each zone, open; else the zone's trail. */
const EXIT_ART: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  forest: { trail: 'adv_map_forest_exit_arch', cave: 'adv_map_forest_exit_cave', tunnel: 'adv_map_forest_exit_log_tunnel', shore: 'adv_map_coast_exit_stepping_stones' },
  mountain: { trail: 'adv_map_mountain_exit_arch', cave: 'adv_map_mountain_exit_cave', tunnel: 'adv_map_mountain_exit_tunnel', stairs: 'adv_map_mountain_exit_ladder' },
  ruins: { trail: 'adv_map_ruins_exit_gate_open', cave: 'adv_map_ruins_exit_crypt', tunnel: 'adv_map_ruins_exit_crypt', stairs: 'adv_map_ruins_exit_stairs_down' },
  coast: { trail: 'adv_map_coast_exit_dock_arch', cave: 'adv_map_coast_exit_seacave', tunnel: 'adv_map_coast_exit_seacave', stairs: 'adv_map_coast_exit_ladder', shore: 'adv_map_coast_exit_stepping_stones' },
};
/** What bars a shut exit in each zone: brambles, a boulder, the shut stone gate, a wall of coral. */
const EXIT_LOCK: Readonly<Record<string, string>> = {
  forest: 'adv_map_forest_exit_bramble',
  mountain: 'adv_map_mountain_exit_boulder',
  ruins: 'adv_map_ruins_exit_gate',
  coast: 'adv_map_coast_exit_coralwall',
};
export const exitArt = (zone: string, kind: string | undefined, open: boolean): string | null =>
  open ? (EXIT_ART[zone]?.[kind ?? 'trail'] ?? EXIT_ART[zone]?.trail ?? null) : (EXIT_LOCK[zone] ?? null);

/** A false wall (decision 045 `look: 'crack'`): a boulder by its id, else the zone's cracked wall; whole, and broken once opened. */
const CRACK_ART: Readonly<Record<string, [string, string]>> = {
  boulder: ['adv_map_mountain_exit_boulder', 'adv_map_mountain_exit_boulder_broken'],
  forest: ['adv_map_forest_exit_vinewall', 'adv_map_forest_exit_vinewall_open'],
  mountain: ['adv_map_mountain_exit_crackwall', 'adv_map_mountain_exit_crackwall_open'],
  ruins: ['adv_map_ruins_exit_runewall', 'adv_map_ruins_exit_runewall_open'],
  coast: ['adv_map_coast_exit_coralwall', 'adv_map_coast_exit_coralwall_open'],
};
export const crackArt = (zone: string, gateId: string, open: boolean): string | null => (CRACK_ART[gateId.includes('boulder') ? 'boulder' : zone]?.[open ? 1 : 0] ?? null);

/** Every kit picture the game draws: the manifest rows of the kit (`scripts/assets/mapKitSizes.json`) are these. */
export const KIT_IDS: readonly string[] = [
  ...new Set([
    ...Object.values(KIT_TILES).flatMap((z) => Object.values(z).flat()),
    ...Object.values(COVER_ART).flatMap((z) => Object.values(z).flat()),
    ...Object.values(CLIFF_ART).flatMap((z) => Object.values(z) as string[]),
    ...['wood', 'silver', 'gold', 'hidden'].flatMap((t) => [chestArt(t, false), chestArt(t, true)]),
    MIMIC_ART,
    ...PUZZLE_BY_WORD.flatMap(([, a, b]) => [a, b]),
    ...Object.values(PUZZLE_BY_ELEMENT).flat(),
    ...CORRUPT_FLAT,
    ...Object.values(CORRUPT_UPRIGHT).flat(),
    ...COAST_FRAME,
    ...Object.values(SPRING_ART),
    ...Object.values(EXIT_ART).flatMap((z) => Object.values(z)),
    ...Object.values(EXIT_LOCK),
    ...Object.values(CRACK_ART).flat(),
    'adv_map_coast_prop_shells',
  ]),
];
