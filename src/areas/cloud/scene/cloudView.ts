import type { FlowerStage } from '../logic/art';
import type { PlotView } from '../logic/derived';
import { PLOTS_PER_TIER } from '../logic/config/content';

// Look of the Cloud scene (design px, depths, colours, motion). What grows where is content and state; these are the drawing
// choices of the scene. Positions are measured on the backdrop (bg_cloud, the owner's mock-up with the interactive parts
// removed — sheet E of batch cloud-04-scene, decision 023): backdrop px × 1.25 − 108 = design x, × 1.25 = design y.
export const CLOUD_DESIGN = { width: 1600, height: 900 } as const;

export const CLOUD_VIEW = {
  columns: 5,
  /** Centre of the first plot and the step between two plots (the cream field of the island). */
  field: { x: 536, y: 288, stepX: 165, stepY: 118 },
  plotSize: { width: 152, height: 108 },
  /** Flowers are drawn a little smaller than their canvas so a bloom does not hide the plot above it. */
  flowerScale: 0.88,
  /**
   * Where a flower's canvas bottom sits, from the plot's centre. Measured: the soil hollow of plot_cloud is centred 10.6 px
   * above the plot's centre, the flower art's base is 6 px above its canvas bottom; +1 puts the base in the soil's middle.
   */
  flowerOffsetY: 1,
  /** Flowers sway around their base like in a breeze: degrees by stage, each plant its own period and phase. */
  sway: { sprout: 1.6, grow: 2.6, ripe: 3.4, wilt: 1, periodMs: [2200, 3400], gustMs: 9000, gust: 0.45 },
  /** Feet of the spring and the cauldron on the two grass banks at the left, and their drawing scale. */
  spring: { x: 286, y: 372, scale: 0.9 },
  cauldron: { x: 222, y: 662, scale: 0.82 },
  /** Wooden label planks (centre). */
  springLabel: { x: 284, y: 440 },
  cauldronLabel: { x: 340, y: 624 },
  plank: { width: 220, height: 80 },
  /** The tier's title banner (centre) on the green knoll under the field, and the arrows that change tier. */
  title: { x: 800, y: 706, width: 430, height: 164 },
  tierUp: { x: 1074, y: 712 },
  tierDown: { x: 526, y: 712 },
  /** Share of the banner's width the title may use (a long tier name shrinks to fit). */
  titleFit: 0.6,
  arrowSize: 78,
  /**
   * The cloud bird: rests (hovering in place) at its perch, now and then flies to a random spot over the island, and goes
   * after the caterpillars one by one. Flight is a smooth curve at `speed` design px per second.
   */
  bird: { x: 1257, y: 118, size: 116, speed: 230, restMs: [4500, 9000], area: { x0: 520, x1: 1420, y0: 150, y1: 560 }, catchMs: 520 },
  /** Decorative caterpillars (no gameplay): one may appear on a growing flower now and then, at most `max` at a time. */
  pest: { everyMs: [9000, 18000], max: 2, width: 30, height: 16, scale: 1.5, noticeMs: 2500 },
  /** Small clouds drifting across the sky behind the island (existing env art), each its own speed and height. */
  drift: [
    { art: 'env_cloud_a', y: 70, scale: 0.55, alpha: 0.9, seconds: 140, start: 0.15 },
    { art: 'env_cloud_c', y: 150, scale: 0.4, alpha: 0.75, seconds: 190, start: 0.62 },
    { art: 'env_cloud_e', y: 820, scale: 0.7, alpha: 0.85, seconds: 165, start: 0.4 },
  ],
  /** The backdrop's own size (scripts/assets/sizes.ts): it is drawn to cover the visible view, centred on the frame. */
  backdrop: { width: 1816, height: 900 },
  /** Until each tier has its own backdrop, a soft colour over the shared one tells them apart (index = tier). */
  tierTints: [0xffffff, 0xffeef8, 0xffe4d0, 0xfff8dc, 0xe0fff0, 0xffe6f0, 0xe8e6ff, 0xdde8ff, 0xfff0c0, 0xf0f8ff],
  /** Sky behind the backdrop (only seen if the image is missing). */
  sky: { dayTop: 0xc4d6f8, dayBottom: 0xffe8f0, nightTop: 0x2a2f5c, nightBottom: 0x6a5a98 },
  /** A plot that is not open yet: a soft blue-grey, half see-through (still clearly not usable). */
  unbuilt: { tint: 0xc9cfdd, alpha: 0.72 },
  /** Hover: plots lift a little and brighten a touch; planks and arrows press up; buildings answer in their own way. */
  hover: { lift: 3, brighten: 1.07, swell: 1.04, ms: 140 },
  /** Changing tier: the field sinks (going up) or rises (going down) and fades, a cloud veil sweeps, the sky shifts. */
  tierMove: { outMs: 240, inMs: 340, shift: 60, sky: 16, veilAlpha: 0.92, veilScale: 1.25, veilBlur: 2, travel: 240 },
  /** The fertiliser drone (decision 028): from the cauldron's bank over each newly fertilised flower, then away. */
  drone: { from: { x: 222, y: 560 }, exit: { x: 1700, y: -120 }, hoverY: 70, speed: 900, dropMs: 260, size: 130, art: 'prop_drone_cloud' },
  /** Idle motion: slow, never in step (each object gets its own period and phase). */
  idle: { bobPx: 5, bobMs: [2600, 3400], swayDeg: 3, flapMs: 1700, brewSwell: 0.035 },
  /** Building hover answers: spring droplets, cauldron bubbles (counts per hover). */
  buildingFx: { drops: 9, dropScale: 1.6, bubbles: 8, bubbleScale: [1.3, 2] },
  /** Depths: sky below everything, then plots, flowers, buildings, signs, badges. */
  depth: { sky: -2000, ground: -1000, drift: -990, plot: 10, building: 30, pest: 40, bird: 3000, veil: 3500, sign: 4000, badge: 5000, night: 6000 },
  label: {
    fontPx: 30,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#fff8e6',
    stroke: '#7a4a24',
    strokePx: 6,
  },
  titleText: { fontPx: 32, color: '#7a4a24', stroke: '#fff4d6', strokePx: 6 },
  lockedText: { fontPx: 28, color: '#5a4a8a', background: '#fdf4ffe6' },
  badge: { fontPx: 26, color: '#ffffff', background: 0xe0654f, readyBackground: 0x7a62d8, border: 0xffffff, height: 40, minWidth: 44 },
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
