// The Cloud's own events (the screens and the FeedbackDirector read these; world systems get the standard ones
// through worldEvents.ts).
export type CloudEvent =
  | { type: 'CLOUD_PLANTED'; flowerId: string; plots: number[]; bought: number; gold: number }
  | { type: 'CLOUD_WATERED'; plots: number }
  | { type: 'CLOUD_FERTILIZED'; plots: number[] }
  | { type: 'CLOUD_HARVESTED'; flowerId: string; quantity: number; plots: number; wilted: number; left: number; night: boolean }
  | { type: 'CLOUD_FLOWER_RIPE'; flowerId: string; count: number }
  | { type: 'CLOUD_FLOWER_WILTED'; flowerId: string; count: number }
  | { type: 'CLOUD_PLOTS_BOUGHT'; plots: number; gold: number }
  | { type: 'CLOUD_WATER_COLLECTED'; quantity: number; left: number }
  | { type: 'CLOUD_SPRING_UPGRADED'; level: number; gold: number; materials: Readonly<Record<string, number | undefined>> }
  | { type: 'CLOUD_CAULDRON_BUILT'; gold: number }
  | { type: 'CLOUD_BREW_STARTED'; recipeId: string; batches: number }
  | { type: 'CLOUD_BREW_DONE'; recipeId: string; batches: number }
  | { type: 'CLOUD_BREW_COLLECTED'; recipeId: string; batches: number; kept: number }
  | { type: 'CLOUD_LEVEL_UP'; level: number };

export const CLOUD_EVENT_TYPES = [
  'CLOUD_PLANTED', 'CLOUD_WATERED', 'CLOUD_FERTILIZED', 'CLOUD_HARVESTED', 'CLOUD_FLOWER_RIPE', 'CLOUD_FLOWER_WILTED', 'CLOUD_PLOTS_BOUGHT',
  'CLOUD_WATER_COLLECTED', 'CLOUD_SPRING_UPGRADED', 'CLOUD_CAULDRON_BUILT', 'CLOUD_BREW_STARTED', 'CLOUD_BREW_DONE', 'CLOUD_BREW_COLLECTED',
  'CLOUD_LEVEL_UP',
] as const satisfies readonly CloudEvent['type'][];

export const isCloudEvent = (e: { type: string }): e is CloudEvent => (CLOUD_EVENT_TYPES as readonly string[]).includes(e.type);
