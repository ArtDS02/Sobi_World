import type { FlowerStage } from '../logic/art';
import type { PlotView } from '../logic/derived';

// Look of the Cloud scene (design px, depths, colours). What grows where is content and state; these are the drawing
// choices of the scene: the bed's grid, where the spring and the cauldron stand, how the sky is painted.
export const CLOUD_DESIGN = { width: 1600, height: 900 } as const;

export const CLOUD_VIEW = {
  columns: 6,
  /** Top-left of the beds and the step between two plots. */
  field: { x: 470, y: 222, stepX: 166, stepY: 118 },
  plotSize: { width: 152, height: 108 },
  /** Feet of the spring and the cauldron (their art stands on this point). */
  spring: { x: 230, y: 400 },
  cauldron: { x: 230, y: 650 },
  /** Sky: a day and a night wash, two flat bands each (a gradient fill needs WebGL). */
  sky: { dayTop: 0xc4d6f8, dayBottom: 0xffe8f0, nightTop: 0x2a2f5c, nightBottom: 0x6a5a98 },
  cloudBank: 0xffffff,
  cloudShade: 0xe6ecfa,
  path: 0xf4e6f0,
  unbuiltTint: 0x8c8c8c,
  hover: 0xffffff,
  /** Depths: sky below everything, then plots, flowers, buildings, badges. */
  depth: { sky: -2000, ground: -1000, plot: 10, crop: 20, building: 30, badge: 5000, night: 6000 },
  label: {
    fontPx: 26,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#5a4a8a',
    background: '#fdf4ff',
    padX: 10,
    padY: 3,
    offsetY: 8,
  },
  badge: { fontPx: 28, color: '#ffffff', background: '#e0654f', readyBackground: '#6a5acd' },
  /** A ripe flower breathes: scale swing and period. */
  ripePulse: { scale: 0.05, periodMs: 1400 },
  /** The night wash over the scene. */
  nightAlpha: 0.35,
} as const;

/** Where plot `index` stands (its centre) in design px. */
export function plotCentre(index: number): { x: number; y: number } {
  const { field, columns } = CLOUD_VIEW;
  return { x: field.x + (index % columns) * field.stepX, y: field.y + Math.floor(index / columns) * field.stepY };
}

/** Plot slots drawn: the owned ones plus the next row's worth as locked ground (up to `max`). */
export const slotsToDraw = (owned: number, max: number): number => Math.min(max, Math.ceil((owned + 1) / CLOUD_VIEW.columns) * CLOUD_VIEW.columns);

/** The picture of a flower at a stage of its growth. */
export function flowerStageOf(view: Pick<PlotView, 'stage' | 'share'>): FlowerStage {
  if (view.stage === 'ripe') return 'ripe';
  if (view.stage === 'wilted') return 'wilt';
  return view.share < 0.5 ? 'sprout' : 'grow';
}
