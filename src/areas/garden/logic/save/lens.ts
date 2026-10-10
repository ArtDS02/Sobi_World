// Reading and writing the Garden's slice of a world.
import type { WorldSave } from '../../../../core/save/world';
import { GARDEN_AREA_ID } from '../config/content';
import type { GardenState } from '../state';

export const hasGarden = (world: WorldSave): boolean => GARDEN_AREA_ID in world.areas;

export function gardenOf(world: WorldSave): GardenState {
  const slice = world.areas[GARDEN_AREA_ID];
  if (!slice) throw new Error('the garden has no state in this world (not unlocked yet)');
  return slice as GardenState;
}

export const withGarden = (world: WorldSave, garden: GardenState): WorldSave => ({
  ...world,
  areas: { ...world.areas, [GARDEN_AREA_ID]: garden },
});
