import type { CropStage } from '../logic/art';
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
  /** Crops share the plot's scale; their canvas bottom sits this share of the drawn plot height below its centre. */
  cropScale: 0.86,
  cropOffset: 0.3,
  /** Feet of the workshops and the sprinkler on the empty grass spots of the backdrop, and their drawing scale. */
  mill: { x: 185, y: 364, scale: 1 },
  composter: { x: 165, y: 615, scale: 1 },
  sprinkler: { x: 1530, y: 380, scale: 1.2 },
  /** Feet of each building's name sign (a plank on a post), its drawn width, and where the name sits on the plank. */
  signs: {
    mill: { x: 318, y: 448 },
    sprinkler: { x: 1530, y: 512 },
  },
  /** The composter's name goes on the blank sign painted in the backdrop by the lower path (face centre and size). */
  paintedSign: { composter: { x: 371, y: 618, width: 104, height: 46 } },
  sign: { canvas: { width: 220, height: 200 }, width: 150, textY: 0.6, maxText: 0.66 },
  /** The backdrop's own size (scripts/assets/sizes.ts): it is drawn to cover the visible view, centred on the frame. */
  backdrop: { width: 1812, height: 900 },
  /** Sky behind the backdrop (only seen while the image loads or if it is missing). */
  sky: { top: 0xa8d6f0, bottom: 0xe9f6ff },
  /** Depths: sky, backdrop, then plots, crops, buildings, signs, badges. */
  depth: { sky: -2000, ground: -1000, plot: 10, crop: 20, building: 30, sign: 40, badge: 5000 },
  /** Unbuilt workshops are drawn greyer. */
  unbuiltTint: 0x8c8c8c,
  label: {
    fontPx: 24,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#7a4f2a',
  },
  badge: { fontPx: 28, color: '#ffffff', background: '#e0654f', readyBackground: '#4aa86b' },
  /** Hover: a plot lifts a little and swells a touch; buildings and signs swell. */
  hover: { lift: 3, swell: 1.04, ms: 140 },
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
