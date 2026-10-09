// systems/character (ARCHITECTURE §4): walking and interacting of the one player character.
export { directionTo, canStand, facingFor, inputVector, settle, stepCharacter } from './move';
export { nearestInteractable } from './interact';
export { FACINGS } from './types';
export type { CharacterState, Facing, Interactable, Rect, Vec, Walkable } from './types';
