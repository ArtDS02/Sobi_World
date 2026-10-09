// The player character in the world save (spec §4, ARCHITECTURE core/player): where they stand and which
// way they face. One character for every Area; the game opens in the plaza, so what is kept is the spot
// in the Area they were in, and an Area's door when they left from inside it.
import { z } from 'zod';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';

export const FACING_VALUES = ['down', 'up', 'left', 'right'] as const;
export type Facing = (typeof FACING_VALUES)[number];

export interface PlayerSave {
  /** Id of the place they were in: the plaza (`plaza`) or an Area id. */
  area: string;
  /** Spot in that place's design pixels; null = at its entrance. */
  x: number | null;
  y: number | null;
  facing: Facing;
}

export const PLAZA_ID = 'plaza';

export const playerSchema = z.object({
  area: z.string().min(1),
  x: z.number().finite().nullable(),
  y: z.number().finite().nullable(),
  facing: z.enum(FACING_VALUES),
});

export const newPlayer = (): PlayerSave => ({ area: PLAZA_ID, x: null, y: null, facing: 'down' });

/** Records where the player is. A no-op action result when nothing changed (no event, no write). */
export function setPlayerSpot(
  state: WorldSave,
  spot: PlayerSave,
  _ctx: ActionContext,
): ActionResultOf<WorldSave> {
  const p = state.player;
  const same = p.area === spot.area && p.x === spot.x && p.y === spot.y && p.facing === spot.facing;
  return { ok: true, state: same ? state : { ...state, player: spot }, events: [] };
}
