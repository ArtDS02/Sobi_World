// The player character's numbers (content/shared/character.json): speed, feet box, size, animation.
import type { CharacterFile } from '../../../content/schemas/shared/character';
import { CONTENT } from './content';

export type CharacterConfig = CharacterFile;
export const CHARACTER: CharacterConfig = CONTENT.character;
