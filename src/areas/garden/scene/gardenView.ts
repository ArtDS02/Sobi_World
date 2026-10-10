import type { CropStage } from '../logic/art';
import type { PlotView } from '../logic/derived';

// Look of the Garden scene (design px, depths, colours). What grows where is content and state; these are the
// drawing choices of the scene: the field's grid, where the workshops stand, how the ground is painted.
export const GARDEN_DESIGN = { width: 1600, height: 900 } as const;

export const GARDEN_VIEW = {
  columns: 6,
  /** Top-left of the field and the step between two plots. */
  field: { x: 470, y: 222, stepX: 166, stepY: 118 },
  /** Largest picture drawn on a plot (a crop is scaled to fit). */
  plotSize: { width: 152, height: 108 },
  cropSize: { width: 152, height: 132 },
  /** Feet of the workshops and the sprinkler (their art stands on this point). */
  mill: { x: 230, y: 400 },
  composter: { x: 230, y: 610 },
  sprinkler: { x: 1530, y: 380 },
  /** Ground. */
  horizonY: 190,
  skyTop: 0xa8d6f0,
  skyBottom: 0xfff4de,
  grass: 0x84be60,
  grassDark: 0x6fae52,
  path: 0xd9b98a,
  fence: 0xb98a55,
  /** Depths: ground below everything, then plots, crops, buildings, badges. */
  depth: { sky: -2000, ground: -1000, plot: 10, crop: 20, building: 30, badge: 5000 },
  /** Wilted crops are drawn a little dimmer; unbuilt workshops greyer. */
  unbuiltTint: 0x8c8c8c,
  hover: 0xffffff,
  label: {
    fontPx: 26,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#7a4f2a',
    background: '#fff6e6',
    padX: 10,
    padY: 3,
    offsetY: 8,
  },
  badge: { fontPx: 28, color: '#ffffff', background: '#e0654f', readyBackground: '#4aa86b' },
  /** A ripe crop breathes: scale swing and period. */
  ripePulse: { scale: 0.05, periodMs: 1400 },
} as const;

/** Where plot `index` stands (its centre) in design px. */
export function plotCentre(index: number): { x: number; y: number } {
  const { field, columns } = GARDEN_VIEW;
  return { x: field.x + (index % columns) * field.stepX, y: field.y + Math.floor(index / columns) * field.stepY };
}

/** Plot slots drawn: the owned ones plus the next row's worth as locked ground (up to `max`). */
export const slotsToDraw = (owned: number, max: number): number => Math.min(max, Math.ceil((owned + 1) / GARDEN_VIEW.columns) * GARDEN_VIEW.columns);

/** The picture of a crop at a stage of its growth. */
export function cropStageOf(view: Pick<PlotView, 'stage' | 'share'>): CropStage {
  if (view.stage === 'ripe') return 'ripe';
  if (view.stage === 'wilted') return 'wilt';
  return view.share < 0.5 ? 'sprout' : 'grow';
}
