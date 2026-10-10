// World events (ARCHITECTURE §7): the standard events every Area speaks, and the bus that carries
// them between Areas and world systems (goals, codex, achievements…). An Area keeps its own detailed
// events for its screens (the farm's PIG_*), and maps them to these at the boundary. A new standard
// event is added here and to ARCHITECTURE §7.
import type { Currency } from './save/world';

/** Anything the store carries: an Area's own events or world events. */
export interface EventBase {
  readonly type: string;
}

export type WorldEvent =
  | { type: 'item.added'; area: string; itemId: string; quantity: number }
  | { type: 'item.removed'; area: string; itemId: string; quantity: number }
  | { type: 'currency.changed'; area: string; currency: Currency; amount: number }
  | { type: 'creature.born'; area: string; creatureId: string; breed: string }
  | { type: 'creature.sold'; area: string; creatureId: string; amount: number }
  | { type: 'creature.sick'; area: string; creatureId: string }
  | { type: 'creature.critical'; area: string; creatureId: string }
  | { type: 'creature.died'; area: string; creatureId: string }
  | { type: 'creature.levelUp'; area: string; creatureId: string; level: number }
  | { type: 'creature.petted'; area: string; creatureId: string; hearts: number }
  | { type: 'creature.purposeSet'; area: string; creatureId: string; purpose: string }
  | { type: 'crop.planted'; area: string; plotId: string; cropId: string }
  | { type: 'crop.harvested'; area: string; plotId: string; cropId: string; quantity: number }
  | { type: 'fish.caught'; area: string; speciesId: string; itemId: string }
  | { type: 'tank.cleaned'; area: string }
  | { type: 'flower.harvested'; area: string; flowerId: string; itemId: string; quantity: number }
  | { type: 'potion.brewed'; area: string; itemId: string; quantity: number }
  | { type: 'recipe.completed'; area: string; recipeId: string }
  | { type: 'order.completed'; area: string; orderId: string }
  | { type: 'area.unlocked'; area: string }
  | { type: 'area.levelUp'; area: string; level: number }
  | { type: 'codex.discovered'; area: string; kind: string; id: string }
  | { type: 'achievement.unlocked'; area: string; achievementId: string }
  | { type: 'adventure.finished'; area: string; zoneId: string; won: boolean }
  | { type: 'time.dayChanged'; day: number };

export type WorldEventType = WorldEvent['type'];

/** Every standard event type at runtime (totality tests). */
export const WORLD_EVENT_TYPES = [
  'item.added',
  'item.removed',
  'currency.changed',
  'creature.born',
  'creature.sold',
  'creature.sick',
  'creature.critical',
  'creature.died',
  'creature.levelUp',
  'creature.petted',
  'creature.purposeSet',
  'crop.planted',
  'crop.harvested',
  'fish.caught',
  'tank.cleaned',
  'flower.harvested',
  'potion.brewed',
  'recipe.completed',
  'order.completed',
  'area.unlocked',
  'area.levelUp',
  'codex.discovered',
  'achievement.unlocked',
  'adventure.finished',
  'time.dayChanged',
] as const satisfies readonly WorldEventType[];

type Missing = Exclude<WorldEventType, (typeof WORLD_EVENT_TYPES)[number]>;
export const WORLD_EVENT_TYPES_COMPLETE: Missing extends never ? true : Missing = true;

export type WorldEventListener = (event: WorldEvent) => void;

/** A synchronous publish / subscribe bus; listeners run in subscription order. */
export function createEventBus() {
  const byType = new Map<string, Set<WorldEventListener>>();
  const all = new Set<WorldEventListener>();
  return {
    /** Listens to one event type, or to every event with '*'. Returns the unsubscribe. */
    on(type: WorldEventType | '*', fn: WorldEventListener): () => void {
      const set = type === '*' ? all : (byType.get(type) ?? byType.set(type, new Set()).get(type)!);
      set.add(fn);
      return () => void set.delete(fn);
    },
    emit(events: readonly WorldEvent[]): void {
      for (const e of events) {
        for (const fn of byType.get(e.type) ?? []) fn(e);
        for (const fn of all) fn(e);
      }
    },
  };
}

export type EventBus = ReturnType<typeof createEventBus>;
