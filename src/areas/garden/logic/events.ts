// The Garden's own events (the screens and the FeedbackDirector read these; world systems get the
// standard ones through worldEvents.ts).
import type { BuildingId } from './config/content';

export type GardenEvent =
  | { type: 'GARDEN_PLANTED'; cropId: string; plots: number[]; bought: number; gold: number }
  | { type: 'GARDEN_WATERED'; plots: number }
  | { type: 'GARDEN_FERTILIZED'; plots: number[] }
  | { type: 'GARDEN_HARVESTED'; cropId: string; quantity: number; plots: number; wilted: number; left: number }
  | { type: 'GARDEN_CROP_RIPE'; cropId: string; count: number }
  | { type: 'GARDEN_CROP_WILTED'; cropId: string; count: number }
  | { type: 'GARDEN_PLOTS_BOUGHT'; plots: number; gold: number }
  | { type: 'GARDEN_SPRINKLER_BOUGHT'; level: number; gold: number }
  | { type: 'GARDEN_BUILT'; building: BuildingId; gold: number }
  | { type: 'GARDEN_CRAFT_STARTED'; building: BuildingId; recipeId: string; batches: number }
  | { type: 'GARDEN_BATCH_DONE'; building: BuildingId; recipeId: string; batches: number }
  | { type: 'GARDEN_CRAFT_COLLECTED'; building: BuildingId; recipeId: string; batches: number; kept: number }
  | { type: 'GARDEN_LEVEL_UP'; level: number };

export const GARDEN_EVENT_TYPES = [
  'GARDEN_PLANTED', 'GARDEN_WATERED', 'GARDEN_FERTILIZED', 'GARDEN_HARVESTED', 'GARDEN_CROP_RIPE', 'GARDEN_CROP_WILTED',
  'GARDEN_PLOTS_BOUGHT', 'GARDEN_SPRINKLER_BOUGHT', 'GARDEN_BUILT', 'GARDEN_CRAFT_STARTED', 'GARDEN_BATCH_DONE',
  'GARDEN_CRAFT_COLLECTED', 'GARDEN_LEVEL_UP',
] as const satisfies readonly GardenEvent['type'][];

export const isGardenEvent = (e: { type: string }): e is GardenEvent => (GARDEN_EVENT_TYPES as readonly string[]).includes(e.type);
