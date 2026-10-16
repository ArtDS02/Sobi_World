import type { FishView } from '../logic/derived';

// Look of the Aquarium scene (design px, depths, colours). What swims is state; these are the drawing choices of the
// scene. GĐ14 (decision 030): each tank level is its own painted place (bg_aquarium, bg_aquarium_t2..t5, measured on
// the owner's mock-ups), so where the fish swim, where the plaque and the rod stand and where the eggs lie are per level.
export const AQUARIUM_DESIGN = { width: 1600, height: 900 } as const;

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Spot {
  x: number;
  y: number;
}

/** One painted place (one tank level). Coordinates are design px: backdrop px − `backdrop.offsetX`. */
export interface AquariumPlace {
  art: string;
  /** The water fish swim in. */
  water: Box;
  /** Where the murk of dirty water shows (the glass of level 1, the whole sea below the surface elsewhere). */
  murk: Box;
  /** The sand the eggs lie on (first egg; the next ones step right). */
  eggs: Spot;
  /** The pile of scales (bottom centre). */
  scales: Spot;
  /** The plaque with the place's name (centre): opens the tank card too. */
  plaque: Spot;
  /** The rod at the fishing spot (bottom of the handle), or null when the backdrop paints the spot itself. */
  rod: (Spot & { scale: number }) | null;
  /** Where a fish bites while a cast is ready: rings on the water by the float, or (the deep sea) the lantern glows
   *  and bubbles. Null takes the float of the rod sprite. */
  bite: (Spot & { kind: 'ripple' | 'glow' }) | null;
  /** What a click on the fishing spot hits (centre and size). */
  dock: Spot & { width: number; height: number };
  /** Pearls lying on the sand, for the look only. */
  decor: { art: string; x: number; y: number }[];
}

const PEARLS = 'prop_orange_pearls';
const PEARL_PILE = 'prop_pearl_pile';

/** The five places, by tank level (index 0 = level 1). A level past the list draws the last place. */
export const AQUARIUM_PLACES: readonly AquariumPlace[] = [
  {
    // Level 1: the round glass tank on the wooden dock (the tank and the rod are painted in the backdrop).
    art: 'bg_aquarium',
    water: { left: 390, right: 1250, top: 305, bottom: 515 },
    murk: { left: 360, right: 1280, top: 290, bottom: 600 },
    eggs: { x: 480, y: 578 },
    scales: { x: 1110, y: 598 },
    plaque: { x: 800, y: 643 },
    rod: null,
    bite: { x: 1585, y: 470, kind: 'ripple' },
    dock: { x: 1565, y: 380, width: 180, height: 260 },
    decor: [{ art: PEARLS, x: 930, y: 590 }],
  },
  {
    // Level 2: the rock pool by the shore, the pier at the top right.
    art: 'bg_aquarium_t2',
    water: { left: 290, right: 1340, top: 370, bottom: 630 },
    murk: { left: -400, right: 2000, top: 330, bottom: 1300 },
    eggs: { x: 560, y: 712 },
    scales: { x: 1130, y: 728 },
    plaque: { x: 800, y: 700 },
    rod: { x: 1520, y: 318, scale: 0.85 },
    bite: null,
    dock: { x: 1555, y: 220, width: 190, height: 250 },
    decor: [
      { art: PEARLS, x: 470, y: 722 },
      { art: PEARL_PILE, x: 1290, y: 722 },
    ],
  },
  {
    // Level 3: the mangrove lagoon, coral at both sides.
    art: 'bg_aquarium_t3',
    water: { left: 290, right: 1340, top: 330, bottom: 615 },
    murk: { left: -400, right: 2000, top: 292, bottom: 1300 },
    eggs: { x: 560, y: 700 },
    scales: { x: 1060, y: 712 },
    plaque: { x: 800, y: 700 },
    rod: { x: 1525, y: 282, scale: 0.85 },
    bite: null,
    dock: { x: 1560, y: 185, width: 190, height: 250 },
    decor: [{ art: PEARL_PILE, x: 1290, y: 702 }],
  },
  {
    // Level 4: the old ruins at sunset (the orange pearls, the pebble pile and the big clam are painted).
    art: 'bg_aquarium_t4',
    water: { left: 300, right: 1300, top: 325, bottom: 620 },
    murk: { left: -400, right: 2000, top: 288, bottom: 1300 },
    eggs: { x: 600, y: 718 },
    scales: { x: 1090, y: 728 },
    plaque: { x: 800, y: 700 },
    rod: { x: 1505, y: 288, scale: 0.85 },
    bite: null,
    dock: { x: 1540, y: 190, width: 190, height: 250 },
    decor: [],
  },
  {
    // Level 5: the deep sea, no surface; the fishing spot is the lantern hanging on its rope (painted).
    art: 'bg_aquarium_t5',
    water: { left: 290, right: 1340, top: 245, bottom: 620 },
    murk: { left: -400, right: 2000, top: -400, bottom: 1300 },
    eggs: { x: 620, y: 732 },
    scales: { x: 1110, y: 742 },
    plaque: { x: 800, y: 700 },
    rod: null,
    bite: { x: 1485, y: 238, kind: 'glow' },
    dock: { x: 1485, y: 150, width: 120, height: 300 },
    decor: [
      { art: PEARLS, x: 500, y: 736 },
      { art: PEARL_PILE, x: 1280, y: 742 },
    ],
  },
];

/** The place drawn for a tank level. */
export const aquariumPlace = (level: number): AquariumPlace => AQUARIUM_PLACES[Math.min(AQUARIUM_PLACES.length, Math.max(1, level)) - 1]!;

export const AQUARIUM_VIEW = {
  /** The painted backdrops: 1800 × 900, centred on the design frame (design x = backdrop x − offsetX). */
  backdrop: { width: 1800, height: 900, offsetX: 100 },
  plaque: { art: 'prop_aqua_plaque', width: 330 },
  rod: { art: 'bld_fish_dock' },
  egg: { art: 'prop_fish_egg', width: 44, step: 50 },
  scalePile: { art: 'prop_scale_pile', width: 92 },
  decorWidth: { prop_orange_pearls: 52, prop_pearl_pile: 96 } as Record<string, number>,
  /** Colours of the backdrop outside the art (shown only until the backdrop loads). */
  sea: 0x60aad6,
  sky: 0xbae2f6,
  murk: 0x6b8f4a,
  night: 0x10204a,
  depth: { sky: -1001, ground: -1000, decor: 5, sign: 8, egg: 15, pellet: 19, fish: 20, murk: 25, pour: 26, ripple: 27, dock: 30, drone: 36, bubble: 40, sparkle: 41, night: 4000, badge: 5000 },
  text: { fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif', color: '#5a3a1e', plaquePx: 26 },
  badge: { fontPx: 24, color: '#ffffff', background: '#4aa86b' },
  /** A fish on the line (cast ready), every `everyMs`: the float (cut out of the 200 × 300 rod picture: right of
   *  `floatLeft`, below `floatTop`) dips `dipPx` twice and the rod tugs `tugRad` on its handle. */
  bite: { cut: { width: 200, height: 300, floatLeft: 150, floatTop: 172 }, dipPx: 9, everyMs: [1100, 2200] as const, tugRad: 0.04 },
  /** Hover: the plaque and the rod grow a little. */
  hoverScale: 1.06,
  /** Swimming (fishSwim.ts): top speed (design px per second) at a fish scale of 1, how fast the velocity follows
   *  the wish (per second), the slow-down radius, the pause between two targets, the tail beat and the body tilt, the
   *  turn (the body narrows, flips, widens), a rare dart, the bob while resting and a bubble now and then. */
  swim: {
    speed: 70,
    sickFactor: 0.4,
    pauseMs: [400, 2200] as const,
    steer: 2.6,
    arrive: 90,
    /** How far up or down one leg may go: fish mostly swim level. */
    climb: 120,
    wagHz: [0.9, 3.2] as const,
    /** The whole fish rocks this much (rad) against its tail; the body bends this share of its height at the tail. */
    wagRad: [0.01, 0.04] as const,
    bend: [0.05, 0.17] as const,
    tiltMax: 0.38,
    squash: 0.035,
    turnMs: 260,
    dart: { chance: 0.12, factor: 2.3, ms: 650 },
    bobPx: 2.5,
    bubbleMs: [2500, 7500] as const,
  },
  /** Feeding (aquariumFx.ts): pellets drop on the water, sink, and the fish that just ate swim to them and gulp them. */
  feed: {
    art: 'fx_fish_pellet',
    pelletPx: 18,
    perFish: 3,
    max: 24,
    spread: 110,
    /** Fall above the surface (px/s²), the sink speed under it (px/s) and how long a pellet lies on the bottom. */
    gravity: 1400,
    sink: [26, 46] as const,
    restMs: 3500,
    chaseFactor: 2.1,
    eatPx: 16,
    gulpMs: 220,
  },
  /** Changing the water (aquariumFx.ts): fresh water pours in, bubbles rush up, a clear wave sweeps the murk away. */
  water: {
    pourArt: 'fx_water_pour',
    rippleArt: 'fx_water_ripple',
    pourAt: 0.22,
    pourMs: 1300,
    bubbles: 30,
    sweepMs: 1400,
    sweepPx: 280,
    sparkles: 9,
    happyFactor: 1.8,
    happyMs: 1600,
  },
  /** The drones that bring the care (decision 033): the food drone sprinkles pellets, the water drone pours fresh
   *  water. Each stands in with a drone of the Garden / Cloud until its own art is painted. Off-screen from the left,
   *  out to the right; they hover `hoverY` over the surface. */
  drone: {
    feed: { art: 'prop_drone_aquarium', stand: 'prop_drone_garden' },
    water: { art: 'prop_drone_water', stand: 'prop_drone_cloud' },
    size: 190,
    hoverY: 150,
    speed: 1000,
    feedMs: 650,
    puffFeed: [0xd98a3d, 0xb5652a, 0xffd89a],
    puffWater: [0xcfeefe, 0xffffff, 0x9fd6f5],
  },
  bubbleArt: 'fx_bubble',
  sparkleArt: 'fx_sparkle',
  sickTint: 0xa8d890,
  hungryIcon: '🍽',
  sickIcon: '🤒',
} as const;

/** Picture scale of a fish at a growth: a hatchling is small, a grown one full size. */
export const fishScale = (progress: number): number => 0.26 + (0.34 * Math.min(100, Math.max(0, progress))) / 100;

/** The part of the picture of a fish that the draw cares about: which way it faces and its icon. */
export function fishIcon(view: Pick<FishView, 'sick' | 'hunger'>): string {
  return view.sick ? AQUARIUM_VIEW.sickIcon : view.hunger < 30 ? AQUARIUM_VIEW.hungryIcon : '';
}

/** Where egg `index` lies on the sand of a place (design px). */
export function eggSpot(place: AquariumPlace, index: number): Spot {
  return { x: place.eggs.x + index * AQUARIUM_VIEW.egg.step, y: place.eggs.y + (index % 2) * 8 };
}

/** How thick the murk over the water is drawn at a clarity. */
export const murkAlpha = (water: number): number => Math.min(0.5, Math.max(0, (1 - water / 100) * 0.55));
