// Where the character appears in the plaza (spec §4, GĐ3 item 7): the game opens in the plaza at the
// spot they left it; coming back from an Area, in front of that Area's door; a new character at the
// spawn. Pure.
import type { PlazaLayout } from '../../../../content/schemas/plaza/layout';
import { PLAZA_ID, type PlayerSave } from '../../../core/player/player';
import { settle, type Vec, type Walkable } from '../../../systems/character';

/** How far below a door's foot line the character is put when they come out of it, design px. */
export const DOOR_STEP_PX = 56;

export interface Arrival {
  x: number;
  y: number;
  /** Which way they face (out of the door = down). */
  facing: PlayerSave['facing'];
}

/**
 * `areaOf` maps a door (`portal` id) to its Area id. `from` = the Area just left (null when the game
 * opens: then the saved player says where they were).
 */
export function arrivalSpot(
  layout: PlazaLayout,
  walk: Walkable,
  areaOf: (portal: string) => string | undefined,
  player: PlayerSave,
  from: string | null,
): Arrival {
  const { width, height } = layout.designSize;
  const toDoor = (areaId: string): Vec | null => {
    const door = layout.placements.find((p) => p.portal !== undefined && areaOf(p.portal) === areaId);
    return door ? { x: door.x * width, y: door.y * height + DOOR_STEP_PX } : null;
  };
  const area = from ?? player.area;
  if (area !== PLAZA_ID) {
    const door = toDoor(area);
    if (door) return { ...settle(door, walk), facing: 'down' };
  } else if (from === null && player.x !== null && player.y !== null) {
    return { ...settle({ x: player.x, y: player.y }, walk), facing: player.facing };
  }
  return { ...settle({ x: layout.spawn.x * width, y: layout.spawn.y * height }, walk), facing: 'down' };
}
