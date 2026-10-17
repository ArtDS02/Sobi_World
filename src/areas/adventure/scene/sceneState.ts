// What the Adventure's scene reads from its UI and reports back (spec §3): plain data, so the scene never reaches the store. The UI
// builds the state from the world each frame (cheaply) and turns the reports into actions.
import type { Element } from '../../../systems/combat/types';

export type Facing = 'up' | 'down' | 'left' | 'right';

export interface ScenePos {
  x: number;
  y: number;
  facing: Facing;
}

export interface SceneGroup {
  id: string;
  kind: 'normal' | 'elite' | 'boss';
  art: string;
  elements: Element[];
  count: number;
  defeated: boolean;
}

export interface AdventureSceneState {
  mode: 'camp' | 'explore' | 'battle' | 'done';
  mapId: string | null;
  /** Changes when the walker must be put back where the save says (a new trip, another area). */
  placeKey: string;
  pos: ScenePos;
  leader: 'so' | 'bi';
  /** The team's pictures (knocked-out ones greyed). */
  followers: { art: string; down: boolean }[];
  groups: SceneGroup[];
  openedGates: readonly string[];
  openedChests: readonly string[];
  /** Spots used on this trip (resource spots, travellers, shrines). */
  usedSpots: readonly string[];
  springUsed: boolean;
  portalLit: boolean;
  /** The game clock now, and no touch starts a battle before `graceUntil`. */
  now: number;
  graceUntil: number;
  /** The picture behind the camp and the battle. */
  backdrop: string;
  /** A dialog covers the world, or an action is on its way: the walker stands still. */
  paused: boolean;
}

export interface SceneReport {
  move(pos: ScenePos): void;
  touch(groupId: string, pos: ScenePos): void;
  focus(thingId: string | null): void;
  use(thingId: string, pos: ScenePos): void;
  exit(exitId: string, pos: ScenePos): void;
}
