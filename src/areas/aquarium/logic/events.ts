// The Aquarium's own events (the screens and the FeedbackDirector read these; world systems get the
// standard ones through worldEvents.ts).
export type AquariumEvent =
  | { type: 'AQUARIUM_FISH_FED'; fishId: string; itemId: string; favorite?: boolean; /** Fed with feed bought on the spot, not from the bag. */ bought?: boolean }
  | { type: 'AQUARIUM_FEED_BOUGHT'; quantity: number; gold: number }
  | { type: 'AQUARIUM_FISH_PETTED'; fishId: string; hearts: number }
  | { type: 'AQUARIUM_FISH_TREATED'; fishId: string }
  | { type: 'AQUARIUM_TRAIT_REVEALED'; fishId: string; name: string; traitId: string }
  | { type: 'AQUARIUM_WATER_CHANGED' }
  | { type: 'AQUARIUM_CAST'; speciesId: string | null; itemId: string | null; quantity: number; score: number; night: boolean }
  | { type: 'AQUARIUM_RELEASED'; fishId: string; speciesId: string }
  | { type: 'AQUARIUM_FISH_SOLD'; fishId: string; speciesId: string; gold: number }
  | { type: 'AQUARIUM_CATCH_SOLD'; itemId: string; quantity: number; gold: number }
  | { type: 'AQUARIUM_SCALES_COLLECTED'; quantity: number; left: number }
  | { type: 'AQUARIUM_SCALES_SHED'; count: number }
  | { type: 'AQUARIUM_TANK_UPGRADED'; level: number; gold: number }
  | { type: 'AQUARIUM_EGGS_LAID'; speciesId: string; eggId: string; mutated: boolean }
  | { type: 'AQUARIUM_EGG_HATCHED'; fishId: string; speciesId: string; name: string }
  | { type: 'AQUARIUM_FISH_SICK'; fishId: string; name: string }
  | { type: 'AQUARIUM_FISH_CRITICAL'; fishId: string; name: string }
  | { type: 'AQUARIUM_FISH_DIED'; fishId: string; name: string; speciesId: string }
  | { type: 'AQUARIUM_PURPOSE_SET'; fishId: string; purpose: string }
  | { type: 'AQUARIUM_LEVEL_UP'; level: number };

export const AQUARIUM_EVENT_TYPES = [
  'AQUARIUM_FISH_FED', 'AQUARIUM_FEED_BOUGHT', 'AQUARIUM_FISH_PETTED', 'AQUARIUM_FISH_TREATED', 'AQUARIUM_TRAIT_REVEALED', 'AQUARIUM_WATER_CHANGED',
  'AQUARIUM_CAST', 'AQUARIUM_RELEASED', 'AQUARIUM_FISH_SOLD', 'AQUARIUM_CATCH_SOLD', 'AQUARIUM_SCALES_COLLECTED', 'AQUARIUM_SCALES_SHED',
  'AQUARIUM_TANK_UPGRADED', 'AQUARIUM_EGGS_LAID', 'AQUARIUM_EGG_HATCHED', 'AQUARIUM_FISH_SICK', 'AQUARIUM_FISH_CRITICAL',
  'AQUARIUM_FISH_DIED', 'AQUARIUM_PURPOSE_SET', 'AQUARIUM_LEVEL_UP',
] as const satisfies readonly AquariumEvent['type'][];

export const isAquariumEvent = (e: { type: string }): e is AquariumEvent => (AQUARIUM_EVENT_TYPES as readonly string[]).includes(e.type);
