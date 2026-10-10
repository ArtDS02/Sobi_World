// content/shared/progression.json — the one Sobi World Level (decision 007, 013) and World Development
// (GAME_BALANCE §7): the world level + Codex entries / codexEntriesPerPoint + buildings at Lv3 or more.
import { z } from 'zod';
import { int, nonNeg, posInt } from '../fields';

export const progressionFileSchema = z
  .strictObject({
    /** XP of level n + 1 at index n (index 0 = level 1 = 0 XP); GAME_BALANCE §7: step n = 100 × n^1.5. */
    worldLevel: z.strictObject({ maxLevel: posInt, xp: z.array(int.min(0)).min(1) }),
    worldDevelopment: z.strictObject({ perWorldLevel: nonNeg, codexEntriesPerPoint: posInt, perBuildingLv3: nonNeg }),
  })
  .superRefine((f, ctx) => {
    const { xp, maxLevel } = f.worldLevel;
    if (xp.length !== maxLevel) ctx.addIssue({ code: 'custom', message: 'worldLevel.xp needs one entry per level (maxLevel)' });
    if (xp[0] !== 0) ctx.addIssue({ code: 'custom', message: 'worldLevel.xp must start at 0' });
    if (xp.some((x, i) => i > 0 && x <= xp[i - 1]!)) ctx.addIssue({ code: 'custom', message: 'worldLevel.xp must increase' });
  });
