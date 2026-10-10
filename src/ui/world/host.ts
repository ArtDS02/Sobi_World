// What a world scene (the plaza, a farm) needs from the app, and nothing more: the keys, the key hint, where
// to go, what to remember. The app implements it (src/app/start.ts); scenes never reach the store or the
// DOM themselves, so an Area scene stays a drawing of its Area.
import type { PlayerSave } from '../../core/player/player';
import type { CharacterId } from '../../core/settings/settings';
import type { Control } from '../../core/settings/keys';
import type { ControlInput } from './controlInput';

/** The key hint shown near an object: the key (a control) and what it does or why it does not. */
export interface WorldPrompt {
  /** The control that acts; null = nothing to press (a closed door explains itself). */
  control: Control | null;
  title: string;
  lines: string[];
  /** Greyed (a closed door). */
  disabled?: boolean;
}

export interface WorldHost {
  input: ControlInput;
  setPrompt(prompt: WorldPrompt | null): void;
  /** Leave for a place: `plaza` or an Area id. */
  go(placeId: string): void;
  /** The character's spot to keep in the save (the app throttles the writes). */
  remember(spot: PlayerSave): void;
  /** The player's saved character. */
  player(): PlayerSave;
  /** Which character the player chose (settings), read every frame. */
  character(): CharacterId;
  /** The game clock (the day's light follows the player's local time). */
  now(): number;
  /** The player asked for less motion: ambient movement stops. */
  reduceMotion(): boolean;
  /** A panel or dialog covers the world: the character stands still, the interact key is left alone. */
  paused(): boolean;
  /** An interaction that did nothing (a closed door): the error feedback. */
  denied(): void;
}
