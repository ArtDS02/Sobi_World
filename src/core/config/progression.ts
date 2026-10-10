// The one Sobi World Level table and the World Development weights (content/shared/progression.json).
import type { ProgressionRules } from '../area-registry/registry';
import type { LevelTable, WorldDevelopmentRules } from '../progression/levels';
import { CONTENT } from './content';

export const WORLD_LEVELS: LevelTable = CONTENT.progression.worldLevel;
export const WORLD_DEVELOPMENT: WorldDevelopmentRules = CONTENT.progression.worldDevelopment;

/** What the area registry needs: the level table and the World Development weights. */
export const PROGRESSION: ProgressionRules = { levels: WORLD_LEVELS, development: WORLD_DEVELOPMENT };
