// content/shared/progression.json — World Development (GAME_BALANCE §7): total Area levels + Codex
// entries / codexEntriesPerPoint + buildings at Lv3 or more. Each Area's level table is its own content.
import { z } from 'zod';
import { nonNeg, posInt } from '../fields';

export const progressionFileSchema = z.strictObject({
  worldDevelopment: z.strictObject({ perAreaLevel: nonNeg, codexEntriesPerPoint: posInt, perBuildingLv3: nonNeg }),
});
