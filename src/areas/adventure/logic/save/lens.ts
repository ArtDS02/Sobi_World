// Reading and writing the Adventure's slice of a world.
import type { WorldSave } from '../../../../core/save/world';
import { ADVENTURE_AREA_ID } from '../config/content';
import type { AdventureState } from '../state';

export const hasAdventure = (world: WorldSave): boolean => ADVENTURE_AREA_ID in world.areas;

export function adventureOf(world: WorldSave): AdventureState {
  const slice = world.areas[ADVENTURE_AREA_ID];
  if (!slice) throw new Error('the adventure has no state in this world (not unlocked yet)');
  return slice as AdventureState;
}

export const withAdventure = (world: WorldSave, adventure: AdventureState): WorldSave => ({
  ...world,
  areas: { ...world.areas, [ADVENTURE_AREA_ID]: adventure },
});
