// content/shared/character.json — the player character (spec §4): walking speed, the feet box used for
// collisions, how big it is drawn, and the animation. Same numbers in every Area.
import { z } from 'zod';
import { assetId, posInt } from '../fields';

export const characterFileSchema = z.strictObject({
  /** Manifest prop row holding the frames: `<facing>_idle`, `<facing>_walk1`, `<facing>_walk2`. */
  assetId,
  /** Design pixels per second. */
  speed: z.number().positive(),
  /** Half width / half height of the feet box, design px. */
  feetHalfWidth: z.number().positive(),
  feetHalfHeight: z.number().positive(),
  /** On-screen height of the sprite, design px (width keeps the art's aspect ratio). */
  displayHeight: z.number().positive(),
  /** Walk cycle speed, frames per second. */
  walkFps: z.number().positive(),
  /** Click-to-walk stops this close to its target, design px. */
  arriveDistance: z.number().positive(),
  /** How long the character must stand still before the spot is written to the save. */
  restSaveMs: posInt,
});

export type CharacterFile = z.infer<typeof characterFileSchema>;
