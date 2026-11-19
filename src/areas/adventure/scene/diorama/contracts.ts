// The scene contract of each Forest map (docs/agent-loop/forest-diorama/design.md §C, docs/maps/MAP_SCENE_STANDARD.md §2): how the
// light leans off the three presets, the mix of trees, the one accent only this map has, and the fixed review points the shots are
// taken at. Plain data: the view reads it for light, fog and trees now; accents flagged TODO(M4) are drawn in a later step.
import type { AreaMap } from '../../logic/config/content';
import type { PoolLook } from './water';

/** The one thing only this map has (the standard's "ĐIỂM NHẤN"). */
export type Accent = 'lotus' | 'sunShafts' | 'corruptionInk' | 'spores' | 'waterfall' | 'lowMist';

export interface SceneContract {
  /** Shares of the standing trees: oak, fir, big canopy, blossom (they need not sum to 1). */
  trees: readonly [number, number, number, number];
  /** Offsets from the day / golden / night presets: saturation, warmth (+ warm / - cool), far fog 0–0.6 and its tint. */
  light: { sat: number; warm: number; fog: number; fogTint: number; /** Overall brightness, 1 = the preset's (default). */ dim?: number; /** Extra moon fill at night (hemisphere light), 0 = the preset's. */ moon?: number };
  /** What drifts through the air (default: everything on): butterflies, blossom petals, a multiple of the falling leaves. */
  life?: { wings: boolean; petals: boolean; leaves: number; /** Dry grey-brown leaves that fall slowly (default false). */ dry?: boolean; /** Multiple of the fireflies (default 1). */ flies?: number; /** Share of ink flakes rising round the `ink` centre. */ flakes?: number };
  /** Lily pads on the calm water (default true). */
  lilies?: boolean;
  /** Gain of the wind on every standing picture (default 1). */
  wind?: number;
  /** How far the dirt paths are darkened and cooled, 0–1 (default 0). */
  pathTone?: number;
  /** How far the night floors of open ground and paths are raised, 0–1 (default 0), so clearings read well beyond the lantern. */
  nightLift?: number;
  /** Height of a shut barrier (bramble, vine wall) as a multiple of the default, 1 = default: a map whose gate stands in dense woods needs it taller to read as a blocker. */
  barrier?: number;
  /** Small mushroom clusters (the landmark's picture scaled down) beside the woods' edge: share of the bush tiles that carry one (default 0). */
  mushrooms?: number;
  /** A calmer palette for the map's water (water.ts `PoolLook`). */
  pool?: PoolLook;
  /** Stretch of every elevation level (default 1): a map whose cliffs must read tall. Drawing only; the walkable tiles are unchanged. */
  rise?: number;
  /** Light added to the bridge decks in shade, 0–1 (default 0), so a tree's shadow never turns the planks black. */
  deckLift?: number;
  /** Trees and stones made of corruption around a centre (tile), share of the tiles at the centre. */
  corrupt?: { x: number; y: number; r: number; share: number };
  /** How far the standing trees are drained toward violet-grey, 0–1 (default 0). */
  sick?: number;
  /** The corruption's ink (ground.ts, life.ts): its centre (tiles) and reach. */
  ink?: { x: number; y: number; r: number };
  accent: Accent;
  /** Tiles (areas, margin forest too) where the woods stand low (bushes, not tall trees), so a landmark, the steps or an exit is never hidden behind a crown. Blocking is unchanged. */
  keepLow?: readonly { x: number; y: number; w: number; h: number }[];
  /** Review points: a tile, or a group's tile (`group`). */
  spots: readonly { name: string; x?: number; y?: number; group?: string }[];
}

const TINT_SKY = 0xbcd2e0;
const TINT_VIOLET = 0x6a5688;
const TINT_DEEP = 0x8fb4b4;
const TINT_TEAL = 0x9cc4b8;
const TINT_MIST = 0xb4d8ee;

export const CONTRACTS: Readonly<Record<string, SceneContract>> = {
  // Bìa Rừng: the opening morning. Must stay as the approved G0 look.
  map_forest_edge: {
    trees: [0.45, 0.2, 0.15, 0.2],
    light: { sat: 0, warm: 0.02, fog: 0.1, fogTint: TINT_SKY },
    accent: 'lotus',
    // The plateau and its steps (the giant oak must stand clear above them), and the way to the east exit.
    keepLow: [
      { x: 36, y: 6, w: 20, h: 8 },
      { x: 54, y: 22, w: 12, h: 6 },
      { x: 64, y: 15, w: 14, h: 7 },
    ],
    spots: [
      { name: '1 · Start', x: 3, y: 18 },
      { name: '2 · Wooden bridge', x: 22, y: 16 },
      { name: '3 · Lotus pond', x: 24, y: 24 },
      { name: '4 · Steps to the giant oak', x: 42, y: 6 },
      { name: '5 · East exit', x: 61, y: 20 },
      { name: '6 · Under the canopy', x: 52, y: 26 },
    ],
  },
  // Rừng Sâu: dense pines, sun slanting through the canopy (sunShafts.ts), the moss floor of the `c` tiles (ground.ts). Darker and
  // cooler than the other woods, with no butterflies, petals or lily pads: falling needles and leaves, dust in the light.
  map_forest_deep: {
    trees: [0.3, 0.5, 0.2, 0],
    light: { sat: -0.12, warm: -0.07, fog: 0.3, fogTint: TINT_DEEP, dim: 0.6, moon: 0.7 },
    life: { wings: false, petals: false, leaves: 1.5 },
    nightLift: 1,
    lilies: false,
    wind: 1.8,
    pathTone: 1,
    deckLift: 1,
    // The south exit (the log tunnel) and the way to it stand clear of tall crowns, so the exit reads whole; the ring's plateau too.
    keepLow: [
      { x: 38, y: 27, w: 12, h: 14 },
      { x: 7, y: 0, w: 18, h: 9 },
    ],
    accent: 'sunShafts',
    spots: [
      { name: '1 · Start', x: 2, y: 21 },
      { name: '2 · Stone ring', x: 13, y: 7 },
      { name: '3 · Long bridge', x: 40, y: 8 },
      { name: '4 · Wide bridge', x: 25, y: 20 },
      { name: '5 · Middle lake', x: 34, y: 16 },
      { name: '6 · Moss floor', x: 44, y: 25 },
      { name: '7 · Boulder gate', x: 7, y: 27 },
    ],
  },
  // Lõi Rừng: the corrupted heart: ink crawling round the dead tree, the ground greying toward it (ground.ts), dry leaves and ink flakes
  // in the air (life.ts), darker and cooler than the other woods, no water, no butterflies.
  map_forest_heart: {
    trees: [0.4, 0.4, 0.2, 0],
    light: { sat: -0.15, warm: -0.03, fog: 0.4, fogTint: TINT_VIOLET, dim: 0.82, moon: 0.5 },
    life: { wings: false, petals: false, leaves: 0.7, dry: true, flies: 0.3, flakes: 1 },
    lilies: false,
    wind: 1.2,
    pathTone: 0.5,
    corrupt: { x: 21, y: 12, r: 12, share: 0.5 },
    ink: { x: 22, y: 13, r: 6 },
    sick: 0.55,
    // The dead tree's north side, and the boss's clearing: low woods so neither hides behind a crown.
    keepLow: [
      { x: 16, y: 3, w: 12, h: 6 },
      { x: 34, y: 15, w: 14, h: 6 },
      { x: 34, y: 5, w: 14, h: 6 },
    ],
    accent: 'corruptionInk',
    spots: [
      { name: '1 · Start', x: 2, y: 14 },
      { name: '2 · Dead giant tree', x: 20, y: 11 },
      { name: '3 · Boss', group: 'g_f3_boss' },
      { name: '4 · Shadow gate', x: 10, y: 17 },
      { name: '5 · Under the canopy', x: 31, y: 4 },
      { name: '6 · Exit', x: 46, y: 13 },
    ],
  },
  // Thung Nấm: the damp hollow: teal light, gold spores rising round the giant mushroom (spores.ts), small mushroom clusters along the
  // woods' edge, and the big canopy over the hidden nook that thins out when the party steps in (canopyCover.ts).
  map_forest_hollow: {
    trees: [0.35, 0.3, 0.35, 0],
    light: { sat: 0.05, warm: -0.02, fog: 0.35, fogTint: TINT_TEAL, moon: 0.3 },
    life: { wings: true, petals: false, leaves: 0.8, flies: 1.2 },
    lilies: false,
    wind: 1.3,
    nightLift: 0.5,
    mushrooms: 0.4,
    deckLift: 1,
    barrier: 1.5,
    // The giant mushroom's clearing and the way to the bramble gate stand clear of tall crowns.
    keepLow: [
      { x: 32, y: 15, w: 14, h: 10 },
      { x: 46, y: 22, w: 14, h: 9 },
    ],
    accent: 'spores',
    spots: [
      { name: '1 · Start', x: 40, y: 33 },
      { name: '2 · Giant mushroom', x: 36, y: 21 },
      { name: '3 · Bridge', x: 23, y: 19 },
      { name: '4 · Hidden nook', x: 12, y: 21 },
      { name: '5 · Plateau', x: 15, y: 6 },
      { name: '6 · Bramble gate', x: 54, y: 26 },
    ],
  },
  // Thác Rêu: the waterfall off the big cliff (waterfall.ts, the pool's foam ring in water.ts): cool, damp, bright light, a plateau drawn
  // half again as tall so the falls drop a long way, the ancient stump and the way to the south exit kept clear of crowns.
  map_forest_falls: {
    trees: [0.35, 0.45, 0.2, 0],
    light: { sat: 0.05, warm: -0.08, fog: 0.4, fogTint: TINT_MIST, moon: 0.4 },
    life: { wings: false, petals: false, leaves: 1.4, flies: 0.8 },
    pool: { shallow: 0x8fc9c0, deep: 0x336f86, ramp: 3.4, stretch: 0.5 },
    pathTone: 0.35,
    wind: 1.3,
    nightLift: 0.5,
    deckLift: 1,
    rise: 1.45,
    keepLow: [
      { x: 31, y: 12, w: 19, h: 9 },
      { x: 17, y: 27, w: 20, h: 13 },
      { x: 5, y: 22, w: 15, h: 13 },
      { x: 60, y: 22, w: 12, h: 10 },
    ],
    accent: 'waterfall',
    spots: [
      { name: '1 · Start', x: 2, y: 20 },
      { name: '2 · Falls foot', x: 40, y: 18 },
      { name: '3 · Ancient stump', x: 25, y: 35 },
      { name: '4 · Bridge', x: 41, y: 24 },
      { name: '5 · Plateau', x: 20, y: 6 },
      { name: '6 · East exit', x: 70, y: 26 },
      { name: '7 · Boulder gate', x: 9, y: 23 },
    ],
  },
  // Đầm Sương: cold marsh. TODO(M4): drifting low mist, dense reeds.
  map_forest_marsh: {
    trees: [0.3, 0.3, 0.3, 0],
    light: { sat: -0.1, warm: -0.04, fog: 0.3, fogTint: TINT_TEAL },
    corrupt: { x: 40, y: 22, r: 90, share: 0.2 },
    accent: 'lowMist',
    spots: [
      { name: '1 · Start', x: 2, y: 28 },
      { name: '2 · Cross bridge', x: 41, y: 33 },
      { name: '3 · Ruined hut', x: 50, y: 38 },
      { name: '4 · Water wheel', x: 45, y: 21 },
      { name: '5 · North-east pond', x: 70, y: 8 },
      { name: '6 · North-west rim', x: 31, y: 11 },
    ],
  },
};

/** The map ids that have a contract, in the order of the Forest. */
export const CONTRACT_IDS: readonly string[] = Object.keys(CONTRACTS);

/** The review points of an area as tiles (a group's point is its own tile). */
export function reviewSpots(map: AreaMap): { name: string; x: number; y: number }[] {
  return (CONTRACTS[map.id]?.spots ?? []).flatMap((s) => {
    const g = s.group ? map.groups.find((x) => x.id === s.group) : undefined;
    const x = s.x ?? g?.x;
    const y = s.y ?? g?.y;
    return x === undefined || y === undefined ? [] : [{ name: s.name, x, y }];
  });
}
