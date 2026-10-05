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

/** The real store, seen through the farm facade like the farm's screens see it. */
export const createFarmGameStore = (...args: Parameters<typeof createGameStore>) =>
  farmStore(createGameStore(...args));
