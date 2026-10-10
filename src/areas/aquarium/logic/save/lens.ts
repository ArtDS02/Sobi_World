// Reading and writing the Aquarium's slice of a world.
import type { WorldSave } from '../../../../core/save/world';
import { AQUARIUM_AREA_ID } from '../config/content';
import type { AquariumState } from '../state';

export const hasAquarium = (world: WorldSave): boolean => AQUARIUM_AREA_ID in world.areas;

export function aquariumOf(world: WorldSave): AquariumState {
  const slice = world.areas[AQUARIUM_AREA_ID];
  if (!slice) throw new Error('the aquarium has no state in this world (not unlocked yet)');
  return slice as AquariumState;
}

export const withAquarium = (world: WorldSave, aquarium: AquariumState): WorldSave => ({
  ...world,
  areas: { ...world.areas, [AQUARIUM_AREA_ID]: aquarium },
});
