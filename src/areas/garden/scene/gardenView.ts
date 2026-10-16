import type { CropStage } from '../logic/art';
import { PLOTS_PER_ZONE } from '../logic/config/content';
import type { PlotView } from '../logic/derived';

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
  /** Feet of the workshops and the sprinkler on the empty grass spots of the backdrop, and their drawing scale. */
  mill: { x: 185, y: 364, scale: 1 },
  composter: { x: 165, y: 615, scale: 1 },
  sprinkler: { x: 1530, y: 380, scale: 1.2 },
  /** Crops sway around their base like in a breeze: degrees by stage, each plant its own period and phase. */
  sway: { sprout: 1.4, grow: 2.2, ripe: 2.8, wilt: 0.8, periodMs: [2400, 3600], gustMs: 9000, gust: 0.4 },
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
  shop: { x: 1440, y: 738, scale: 0.85, art: 'bld_shop_garden', colours: { stripe: 0x7fbf5e, stripe2: 0xfff6e2, goods: [0xe9c46a, 0xe07a5f, 0x8fbf6a, 0xb98a55] } },
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
