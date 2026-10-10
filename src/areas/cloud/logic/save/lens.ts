// Reading and writing the Cloud's slice of a world.
import type { WorldSave } from '../../../../core/save/world';
import { CLOUD_AREA_ID } from '../config/content';
import type { CloudState } from '../state';

export const hasCloud = (world: WorldSave): boolean => CLOUD_AREA_ID in world.areas;

export function cloudOf(world: WorldSave): CloudState {
  const slice = world.areas[CLOUD_AREA_ID];
  if (!slice) throw new Error('the cloud has no state in this world (not unlocked yet)');
  return slice as CloudState;
}

export const withCloud = (world: WorldSave, cloud: CloudState): WorldSave => ({
  ...world,
  areas: { ...world.areas, [CLOUD_AREA_ID]: cloud },
});
