import type { FlowerStage } from '../logic/art';
import type { PlotView } from '../logic/derived';
import { PLOTS_PER_TIER } from '../logic/config/content';

// Look of the Cloud scene (design px, depths, colours). What grows where is content and state; these are the drawing
// choices of the scene. Positions follow the owner's layout mock-up (sheet L of batch cloud-03-world, decision 023):
// a painted island backdrop (bg_cloud), one tier of 5 × 3 plots on its cream field, the spring and the cauldron on the
// grass banks at the left, wooden label planks and the tier's title banner at the bottom.
export const CLOUD_DESIGN = { width: 1600, height: 900 } as const;

export const CLOUD_VIEW = {
  columns: 5,
  /** Centre of the first plot and the step between two plots. */
  field: { x: 536, y: 282, stepX: 165, stepY: 124 },
  plotSize: { width: 152, height: 108 },
  /** Flowers are drawn a little smaller than their canvas so a bloom does not hide the plot above it. */
  flowerScale: 0.88,
  /** Feet of the spring and the cauldron (their art stands on this point). */
  spring: { x: 284, y: 372 },
  cauldron: { x: 226, y: 694 },
  /** Wooden label planks under the buildings (centre). */
  springLabel: { x: 300, y: 436 },
  cauldronLabel: { x: 382, y: 640 },
  plank: { width: 220, height: 70 },
  /** The tier's title banner (centre) and the arrows that change tier. */
  title: { x: 800, y: 712, width: 420, height: 121 },
  tierUp: { x: 1060, y: 712 },
  tierDown: { x: 540, y: 712 },
  arrowSize: 84,
  /** The ambient bird: where it hovers and how far it drifts. */
  bird: { x: 1300, y: 130, size: 110, drift: 18, periodMs: 3200 },
  /** The backdrop's own size (scripts/assets/sizes.ts): it is drawn to cover the visible view, centred on the frame. */
  backdrop: { width: 1816, height: 900 },
  /** Until each tier has its own backdrop, a soft colour over the shared one tells them apart (index = tier). */
  tierTints: [0xffffff, 0xffeef8, 0xffe4d0, 0xfff8dc, 0xe0fff0, 0xffe6f0, 0xe8e6ff, 0xdde8ff, 0xfff0c0, 0xf0f8ff],
  /** Sky behind the backdrop (only seen if the image is missing). */
  sky: { dayTop: 0xc4d6f8, dayBottom: 0xffe8f0, nightTop: 0x2a2f5c, nightBottom: 0x6a5a98 },
  unbuiltTint: 0x8c8c8c,
  hover: 0xffffff,
  /** Depths: sky below everything, then plots, flowers, buildings, signs, badges. */
  depth: { sky: -2000, ground: -1000, plot: 10, crop: 20, building: 30, sign: 4000, badge: 5000, night: 6000 },
  label: {
    fontPx: 30,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#fff8e6',
    stroke: '#7a4a24',
    strokePx: 6,
  },
  titleText: { fontPx: 34, color: '#7a4a24', stroke: '#fff4d6', strokePx: 6 },
  lockedText: { fontPx: 28, color: '#5a4a8a', background: '#fdf4ffe6' },
  badge: { fontPx: 28, color: '#ffffff', background: '#e0654f', readyBackground: '#6a5acd' },
  /** A ripe flower breathes: scale swing and period. */
  ripePulse: { scale: 0.05, periodMs: 1400 },
  /** The night wash over the scene. */
  nightAlpha: 0.35,
} as const;

/** Where the plot at `slot` (0..14 of the tier shown) stands (its centre) in design px. */
export function plotCentre(slot: number): { x: number; y: number } {
  const { field, columns } = CLOUD_VIEW;
  return { x: field.x + (slot % columns) * field.stepX, y: field.y + Math.floor(slot / columns) * field.stepY };
}

/** The plot index of `slot` on `tier`. */
export const plotIndex = (tier: number, slot: number): number => tier * PLOTS_PER_TIER + slot;

/**
 * The tiers the player may look at: every tier with an owned plot, plus the next closed one (to see what opening it
 * gives), within the content's tier count.
 */
export const viewableTiers = (owned: number, tierCount: number): number =>
  Math.min(tierCount, Math.floor((owned - 1) / PLOTS_PER_TIER) + 1 + (owned % PLOTS_PER_TIER === 0 ? 1 : 0));

/** The picture of a flower at a stage of its growth. */
export function flowerStageOf(view: Pick<PlotView, 'stage' | 'share'>): FlowerStage {
  if (view.stage === 'ripe') return 'ripe';
  if (view.stage === 'wilted') return 'wilt';
  return view.share < 0.5 ? 'sprout' : 'grow';
}
