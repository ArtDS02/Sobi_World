// Character types (ARCHITECTURE systems/character): the player's position is the point between the
// feet, in design pixels of the Area they are in.
export type Facing = 'down' | 'up' | 'left' | 'right';
export const FACINGS: readonly Facing[] = ['down', 'up', 'left', 'right'];

export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterState extends Vec {
  facing: Facing;
  moving: boolean;
}

/** What blocks the character: the ground they may stand on and the objects they cannot walk through. */
export interface Walkable {
  /** The feet box (below) stays inside this rect. */
  bounds: Rect;
  obstacles: readonly Rect[];
  /** Half width / half height of the feet box used for collisions. */
  halfW: number;
  halfH: number;
}

/** Something to interact with: the player must stand within `reach` of its point. */
export interface Interactable extends Vec {
  id: string;
  reach: number;
}
