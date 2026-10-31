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
  kind: 'normal' | 'elite' | 'mutant' | 'subboss' | 'boss' | 'special';
  /** Height of its picture in tiles, its corruption 1–5, asleep or on guard (decision 045). */
  size: number;
  corruption: number;
  asleep: boolean;
  /** A mimic: it looks like a closed treasure chest and shows no tag (decision 045). */
  disguised: boolean;
  /** Its class's name on the ribbon over its tag (none for a normal group). */
  title: string | null;
  art: string;
  elements: Element[];
  count: number;
  defeated: boolean;
  /** The variant it wears on this trip (decision 039): its name and whether it is the golden one. */
  affix: { name: string; golden: boolean } | null;
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
  /** The teleport gates of the area: open or why still shut (decision 043), and whether it leads on (forward) or back. */
  exits: { id: string; open: boolean; lock: 'guardian' | 'shortcut' | 'zone' | null; forward: boolean }[];
  openedGates: readonly string[];
  openedChests: readonly string[];
  /** Element puzzles lit for good (decision 045). */
  litPuzzles: readonly string[];
  /** The area's corruption now, 0–100 % (decision 045): its veil and dust. */
  corruption: number;
  /** Hidden places found for good (the overhead covers stepped under, decision 045). */
  foundSecrets: readonly string[];
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
  /** The party stepped into an open teleport gate (its light and sound start; `exit` follows when it is over). */
  warp?(exitId: string): void;
}
