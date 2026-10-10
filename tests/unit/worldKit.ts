// Test helpers for the world save v8: wrap farm states into worlds, and the store as the farm sees it.
import { createGameStore } from '../../src/app/gameStore';
import { parseWorldSave } from '../../src/app/saveCodec';
import { farmToWorld } from '../../src/areas/farm/logic/save/legacy';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import { farmStore } from '../../src/areas/farm/store';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import type { WorldSave } from '../../src/core/save/world';

export { farmOf, parseWorldSave };

/** A farm state as a world save (the farm is the only Area). */
export const world = (farm: FarmGame): WorldSave => farmToWorld(farm);

/**
 * The real store, seen through the farm facade like the farm's screens see it. The world systems (goals, Codex) are off by
 * default so these tests keep counting only what the store and the farm do; tests/unit/goals.test.ts covers the goals.
 */
export const createFarmGameStore = (deps: Parameters<typeof createGameStore>[0]) =>
  farmStore(createGameStore({ settle: (_before, after) => ({ state: after, events: [] }), ...deps }));
