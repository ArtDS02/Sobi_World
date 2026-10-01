// Farm canvas presentation numbers (spec §11, §11.1, §11.4; art standard §2.4, §5).
// Positions in the manifest layout are normalised; everything here is in design pixels.
import type { BreedId } from './ids';

export const FARM_VIEW = {
  /** On-screen height of an adult pig at the front of the walk area (scale 1). */
  PIG_DISPLAY_PX: 200,
  /** growthProgress 0 → baby, 100 → adult (spec §11: baby small, adult larger). */
  PIG_GROWTH_SCALE: { baby: 0.6, adult: 1 },
  /** Overlay (fx_*) size at pig scale 1, and the gap between stacked overlays. */
  FX_DISPLAY_PX: 64,
  FX_STACK_GAP_PX: 8,
  /** Pigs are spread over the walk area by slot (golden-ratio sequence) and id hash. */
  PIG_SPREAD_STEP: 0.618034,
  PIG_SPREAD_OFFSET: 0.1,
  /** Default origin of a placement without originX / originY: centre bottom (DECISIONS R04-2). */
  PLACEMENT_ORIGIN: { x: 0.5, y: 1 },
  /** Depth bands: layers 0–3 below every actor, layer 4 sorted by Y (px), layer 5 above all. */
  BACK_LAYER_DEPTH: -10000,
  BACK_LAYER_STEP: 1000,
  OVERLAY_DEPTH: 100000,
  /** Selection marker under the pig's feet, relative to the pig's display height. */
  SELECTION: {
    width: 0.7,
    height: 0.16,
    color: 0xfff3b0,
    alpha: 0.9,
    stroke: 0xe8708a,
    strokeWidth: 2,
  },
  /** Name tag under each clickable world object (DECISIONS R05C-1). */
  LABEL: {
    fontPx: 34,
    fontFamily: 'system-ui, "Segoe UI", sans-serif',
    offsetY: 6,
    color: '#3b2a26',
    background: '#fff7f3',
    padX: 14,
    padY: 6,
    depth: 50000,
  },
  /** Visual-only strolls inside layout.walkArea (spec §11). Radius is normalised to width. */
  WANDER: {
    radius: 0.08,
    /** Vertical reach relative to the horizontal one (the walk area is wide and shallow). */
    yRatio: 0.6,
    speedPx: 70,
    minWalkMs: 600,
    restMinMs: 2500,
    restMaxMs: 8000,
    /** Share of rests a healthy idle pig spends asleep (DECISIONS R09B-1). */
    napChance: 0.3,
    /** Retry delay while the pig may not wander (selected, interacting, sick...). */
    retryMs: 1000,
  },
  /** Sick pigs are tinted green on top of the fx_sick overlay (spec §11 table). */
  SICK_TINT: 0xb6e3a2,
  /** Alpha threshold for pixel-perfect pig clicks. */
  HIT_ALPHA: 1,
  /** Progress bar of the preload scene (design px). */
  LOADING_BAR: { width: 640, height: 24, color: 0xe8708a, track: 0xffe9e1, text: '#3b2a26' },
} as const;

/** Flat colour fills drawn when environment / prop / fx files are missing (spec §11.4). */
export const FARM_FALLBACK = {
  SKY: 0xbfe6ff,
  GROUND: 0x9bd37a,
  /** Ground line when the layout has no layer-2 environment placement. */
  GROUND_Y: 0.56,
  PROP: { width: 160, height: 120, radius: 20, color: 0xc8a27a },
  FX: { size: 64, color: 0xffffff },
  PIG: { size: 512, bodyWidth: 0.7, bodyHeight: 0.5, radius: 96, stroke: 8, outline: 0x3b2a26 },
  BREED: {
    PIG_EARTH_PINK: 0xf7a8b8,
    PIG_STRIPED_MELON: 0x8fd18a,
    PIG_SUPERMAN: 0x7fa8f0,
    PIG_MYTHICAL: 0xc9a0f0,
  } satisfies Record<BreedId, number>,
} as const;
