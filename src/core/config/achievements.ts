// Achievements (spec §20.4, DECISIONS PG-2): content/shared/achievements.json. Reached when a metric
// meets its target; the player claims the reward in the achievements panel. Ids are never removed
// (saves keep claims). TUNABLE.
import type { ACHIEVEMENT_METRIC_VALUES } from '../../../content/schemas/shared/achievements';
import { CONTENT } from './content';

/** A stat counter, or a value read from the save (engine/progress.ts `metric`). */
export type AchievementMetric = (typeof ACHIEVEMENT_METRIC_VALUES)[number];

export interface AchievementDef {
  id: string;
  metric: AchievementMetric;
  /** Target value; 'ALL' = every species that can be discovered, or every decoration. */
  target: number | 'ALL';
  gold: number;
  xp: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = CONTENT.achievements.achievements;
