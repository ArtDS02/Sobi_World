import type { CropStage } from '../logic/art';
import { PLOTS_PER_ZONE } from '../logic/config/content';
import type { PlotView } from '../logic/derived';
import type { SceneryLayer } from '../../../systems/animation/rankScenery';

// Look of the Garden scene (design px, depths, colours, motion). What grows where is content and state; these are the
// drawing choices of the scene. Positions are measured on the backdrop (bg_garden, the owner's mock-up with the
// interactive parts removed — sheet E of garden-01-scene, GĐ14): backdrop px − 106 = design x, design y = backdrop y.
export const GARDEN_DESIGN = { width: 1600, height: 900 } as const;

export const GARDEN_VIEW = {
  columns: 6,
  /** Centre of the first plot and the step between two plots: four rows of six fill the lawn inside the path. */
  field: { x: 450, y: 287, stepX: 178, stepY: 93 },
  /** Plot art canvas and the scale it is drawn at (four rows must fit the lawn; the mock-up shows two). */
  plotSize: { width: 152, height: 108 },
  plotScale: 0.86,
  /**
   * Crops share the plot's scale. Where a crop's canvas bottom sits below the plot's centre, in plot-art px: measured, the
   * soil of plot_soil is centred on the art's centre and a crop's soil mound ends at its canvas bottom; +16 puts the mound
   * in the middle of the soil (the old +32 put it on the front frame).
   */
  cropScale: 0.86,
  cropBaseY: 16,
  /**
   * The largest a crop's painted part may be, in plot-art px, by stage. Crop art shares one canvas but the drawing on it
   * varies (a cabbage sprout fills it, a carrot sprout is a third of it): a drawing bigger than this is scaled down so
   * every crop sits on its bed and a sprout stays small.
   */
  cropFit: { width: 112, height: { sprout: 58, grow: 92, ripe: 118, wilt: 88 } satisfies Record<CropStage, number> },
  /** Feet of the workshops and the sprinkler on the empty grass spots of the backdrop, and their drawing scale. */
  mill: { x: 185, y: 364, scale: 1 },
  composter: { x: 165, y: 615, scale: 1 },
  sprinkler: { x: 1530, y: 380, scale: 1.2 },
  /**
   * Crops sway in a breeze: each plant its own period and phase, all stirred by one slow gust. Degrees by stage are the whole
   * picture's tilt around its base, used only without WebGL (where crops cannot bend).
   */
  sway: { sprout: 1.4, grow: 2.2, ripe: 2.8, wilt: 0.8, periodMs: [2400, 3600], gustMs: 9000, gust: 0.4 },
  /**
   * Crops bend on their stem (systems/animation/plantBend.ts, owner-approved 2026-11-09), on the sway's rhythm: the soil mound
   * (`root`, share of the picture's height) stays put, the top from `stiff` up turns without bending, and trails the stem by
   * `lag` radians. Degrees are the top's lean by stage (the Cloud's, scaled to the Garden's calmer sway). Tuned in the admin's
   * "Cây đung đưa" page.
   */
  bend: { rows: 14, root: 0.1, stiff: 0.62, lag: 0.7, sprout: 2.1, grow: 3.3, ripe: 4.2, wilt: 1.2 },
  /** Changing zone (decision 028): the field slides out sideways and the next one slides in. */
  zoneMove: { px: 420, outMs: 260, inMs: 380 },
  /** The building's name in a small bubble over it while hovered (no signs: owner's ask). */
  tip: { fontPx: 22, padX: 12, padY: 5, gap: 10, background: 0xfff6e6, border: 0x8a5a2b, color: '#6b4423' },
  /**
   * The sprinkler at work: a burst of drops from its head every `everyMs`, and now and then a light mist on a few watered
   * plots of the zone on screen.
   */
  spray: { everyMs: 1500, drops: 7, reach: [60, 120], headY: 0.93, mistEveryMs: 3200, mistPlots: 2 },
  /** The shop stall (decision 029) on the lawn at the lower right; drawn in code until bld_shop_garden is painted. */
  shop: { x: 1497, y: 752, scale: 0.7, art: 'bld_shop_garden', colours: { stripe: 0x7fbf5e, stripe2: 0xfff6e2, goods: [0xe9c46a, 0xe07a5f, 0x8fbf6a, 0xb98a55] } },
  /** The sprinkler grows with its level: its art per level when painted, else the base art drawn a little bigger. */
  sprinklerGrow: 0.07,
  /** A soft colour over the backdrop per zone, so each zone feels its own (index = zone). */
  zoneTints: [0xffffff, 0xfff1d2, 0xffe6d2, 0xe4f5e0],
  /** Garden life (decision 029): Farm animals strolling the path around the field. */
  life: {
    path: [
      { x: 385, y: 222 },
      { x: 1492, y: 222 },
      { x: 1492, y: 662 },
      { x: 385, y: 662 },
    ],
    behindBelowY: 250,
    critters: [
      { art: 'prop_animal_hen_cream', faceRight: true, height: 54, speed: 42, start: 0.1 },
      { art: 'prop_animal_duck', faceRight: false, height: 58, speed: 34, start: 0.55 },
    ],
    stretch: [0.04, 0.12],
    restMs: [1800, 5200],
    peckChance: 0.6,
  },
  /** A harvest: the crop's icon flies to the bag button (top right) and "+n" rises over the plot. */
  harvestFly: { to: { x: 1450, y: 36 }, ms: 760, icon: 64, textPx: 30, color: '#ffffff', stroke: '#6b4423' },
  /** A crop that just ripened hops and sparkles once. */
  ripen: { sparkles: 7, hop: 1.16 },
  /** The fertiliser drone (decision 028): flies from the composter over each newly fertilised plot, then away. */
  drone: { from: { x: 165, y: 470 }, exit: { x: 1700, y: -120 }, hoverY: 70, speed: 900, dropMs: 260, size: 130, art: 'prop_drone_garden' },
  /** The backdrop's own size (scripts/assets/sizes.ts): it is drawn to cover the visible view, centred on the frame. */
  backdrop: { width: 1812, height: 900 },
  /** Sky behind the backdrop (only seen while the image loads or if it is missing). */
  sky: { top: 0xa8d6f0, bottom: 0xe9f6ff },
  /** Depths: sky, backdrop, then the field (plots and crops), buildings, effects, the drone, tips and badges. */
  depth: { sky: -2000, ground: -1000, plot: 10, building: 30, fx: 60, drone: 80, badge: 5000 },
  /** Unbuilt workshops are drawn greyer. */
  unbuiltTint: 0x8c8c8c,
  label: {
    fontPx: 24,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#7a4f2a',
  },
  badge: { fontPx: 28, color: '#ffffff', background: '#e0654f', readyBackground: '#4aa86b' },
  /** Hover: buildings swell a touch (plots do not: owner's ask). */
  hover: { swell: 1.04, ms: 140 },
  /** A ripe crop breathes: scale swing and period. */
  ripePulse: { scale: 0.05, periodMs: 1400 },
} as const;

/** Where slot `slot` of a zone stands (its centre) in design px. */
export function plotCentre(slot: number): { x: number; y: number } {
  const { field, columns } = GARDEN_VIEW;
  return { x: field.x + (slot % columns) * field.stepX, y: field.y + Math.floor(slot / columns) * field.stepY };
}

/** The plot index of slot `slot` on zone `zone`. */
export const plotIndex = (zone: number, slot: number): number => zone * PLOTS_PER_ZONE + slot;

/**
 * Slots drawn on a zone: the owned ones plus the next row's worth as locked ground (up to `max`). A zone not opened yet
 * opens whole, so it shows every slot locked.
 */
export const slotsToDraw = (ownedInZone: number, max: number): number =>
  ownedInZone <= 0 ? max : Math.min(max, Math.ceil((ownedInZone + 1) / GARDEN_VIEW.columns) * GARDEN_VIEW.columns);

/** The picture of a crop at a stage of its growth. */
export function cropStageOf(view: Pick<PlotView, 'stage' | 'share'>): CropStage {
  if (view.stage === 'ripe') return 'ripe';
  if (view.stage === 'wilted') return 'wilt';
  return view.share < 0.5 ? 'sprout' : 'grow';
}

/**
 * Rank scenery of a garden zone (decision 056), over the backdrop and under the plots: a fence and stepping stones (rank 2),
 * the zone's landmark (3), lanterns and a small creature (4), an old tree and a village market (5). Design px.
 */
export const GARDEN_SCENERY: readonly SceneryLayer[] = [
  { kind: 'tree', art: 'scn_garden_oldtree', minRank: 5, x: 330, y: 560, depth: 7, feet: true, scale: 0.8 },
  { kind: 'fence', art: 'scn_garden_fence', minRank: 2, x: 895, y: 610, depth: 8 },
  { kind: 'path', art: 'scn_garden_path', minRank: 2, x: 895, y: 690, depth: 9 },
  { kind: 'landmark', art: Array.from({ length: 4 }, (_, i) => `scn_garden_landmark_${String(i + 1).padStart(2, '0')}`), minRank: 3, x: 1400, y: 690, depth: 12, feet: true, scale: 0.7 },
  { kind: 'lanterns', art: 'scn_garden_lanterns', minRank: 4, x: 895, y: 232, depth: 9 },
  { kind: 'critter', art: 'scn_garden_critter', minRank: 4, x: 700, y: 650, depth: 40 },
  { kind: 'market', art: 'scn_garden_market', minRank: 5, x: 1180, y: 800, depth: 12, feet: true, scale: 0.7 },
];
