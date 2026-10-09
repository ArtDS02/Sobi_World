// What a pig brain sees each AI tick and the commands it returns (DECISIONS PL-1). Types only.
import type { PigRestState } from './sleepCycle';

export type AiState =
  | 'IDLE'
  | 'WANDER'
  | 'LOOK_AROUND'
  | 'SOCIAL_APPROACH'
  | 'SOCIAL'
  | 'SEEK_FOOD'
  | 'EATING'
  | 'GO_TO_SLEEP'
  | 'FALLING_ASLEEP'
  | 'SLEEPING'
  | 'WAKING_UP'
  | 'REST';

export interface Point {
  x: number;
  y: number;
}

export type BrainCommand =
  | { kind: 'walk'; to: Point; speed: number }
  | { kind: 'stop' }
  | { kind: 'rest'; rest: PigRestState }
  | { kind: 'eat' }
  | { kind: 'lookAround' }
  | { kind: 'face'; x: number }
  | { kind: 'callFriend'; id: string };

/** What the brain may see and use this tick (built by PigLife). */
export interface BrainWorld {
  now: number;
  night: boolean;
  /** Game time since the night ended while the farm was watched (Infinity otherwise). */
  sinceDayMs: number;
  care: { hunger: number; cleanliness: number; isSick: boolean; pregnant: boolean };
  /** Selected, a feedback state playing, or leaving: hold everything. */
  paused: boolean;
  /** reduceMotion: activities happen in place, no walking. */
  still: boolean;
  /** The mover is still on its way to the last walk target. */
  walking: boolean;
  pos: Point;
  /** Reserve a place at the trough (null: no trough on the farm). */
  feedSpot(): Point | null;
  releaseFeed(): void;
  sleepSpot(): Point;
  wanderTo(step: number): Point;
  /** Nearest free pig to visit, if any. */
  friend(): { id: string; at: Point } | null;
}
