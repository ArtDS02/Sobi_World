// What a world scene (the plaza) needs from the app, and nothing more: the hint over the world and where to go. The
// app implements it (src/app/start.ts); scenes never reach the store or the DOM themselves, so a scene stays a drawing.
import type { Control } from '../../core/settings/keys';

/** The key hint shown near an object: the key (a control) and what it does or why it does not. */
export interface WorldPrompt {
  /** The control that acts; null = nothing to press (a closed door explains itself). */
  control: Control | null;
  title: string;
  lines: string[];
  /** Greyed (a closed door). */
  disabled?: boolean;
  /** Where to show it: the top centre of the thing, in px of the game canvas (absent = the bottom of the screen). */
  anchor?: { x: number; y: number };
}

export interface WorldHost {
  setPrompt(prompt: WorldPrompt | null): void;
  /** Leave for a place: `plaza` or an Area id. */
  go(placeId: string): void;
  /** The game clock (the day's light follows the player's local time). */
  now(): number;
  /** The player asked for less motion: ambient movement stops. */
  reduceMotion(): boolean;
  /** A panel or dialog covers the world: clicks on the world are left alone. */
  paused(): boolean;
  /** An interaction that did nothing (a closed door): the error feedback. */
  denied(): void;
}
