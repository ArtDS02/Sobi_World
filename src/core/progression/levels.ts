// Progression (spec §6, ARCHITECTURE core/progression): every Area has its own level, derived from its
// XP (stored in the world save's progression.areas) and its own level table; World Development sums
// them up and gates new Areas and content. Pure.
import type { WorldSave } from '../save/world';

/** XP needed to reach level n + 1 at index n (index 0 = level 1 = 0 XP), and the cap. */
export interface LevelTable {
  xp: readonly number[];
  maxLevel: number;
}

/** Highest level whose threshold <= xp, capped at maxLevel. */
export function levelFromXp(xp: number, table: LevelTable): number {
  let level = 1;
  table.xp.forEach((threshold, i) => {
    if (xp >= threshold) level = i + 1;
  });
  return Math.min(level, table.maxLevel);
}

/** XP of the next level, or null at the cap. */
export const nextLevelXp = (level: number, table: LevelTable): number | null =>
  level >= table.maxLevel ? null : (table.xp[level] ?? null);

export const areaXp = (world: Pick<WorldSave, 'progression'>, areaId: string): number =>
  world.progression.areas[areaId]?.xp ?? 0;

export interface WorldDevelopmentRules {
  perAreaLevel: number;
  codexEntriesPerPoint: number;
  perBuildingLv3: number;
}

export interface WorldDevelopmentInput {
  /** Level of every unlocked Area. */
  areaLevels: Readonly<Record<string, number>>;
  /** Codex entries discovered (all kinds). */
  codexEntries: number;
  /** Buildings at Lv3 or more, all Areas (none before GĐ5). */
  buildingsLv3: number;
}

export function worldDevelopment(input: WorldDevelopmentInput, rules: WorldDevelopmentRules): number {
  const levels = Object.values(input.areaLevels).reduce((sum, l) => sum + l, 0);
  return (
    levels * rules.perAreaLevel +
    Math.floor(input.codexEntries / rules.codexEntriesPerPoint) +
    input.buildingsLv3 * rules.perBuildingLv3
  );
}

/** What an Area needs to open (Area manifest `unlock`): levels of other Areas and World Development. */
export interface UnlockRule {
  areaLevels?: Readonly<Record<string, number>>;
  worldDevelopment?: number;
}

export type UnlockGap =
  | { kind: 'areaLevel'; areaId: string; need: number; have: number }
  | { kind: 'worldDevelopment'; need: number; have: number };

/** Conditions still missing (empty = the Area can open). */
export function unlockGaps(rule: UnlockRule, areaLevels: Readonly<Record<string, number>>, wd: number): UnlockGap[] {
  const gaps: UnlockGap[] = Object.entries(rule.areaLevels ?? {})
    .filter(([id, need]) => (areaLevels[id] ?? 0) < need)
    .map(([areaId, need]) => ({ kind: 'areaLevel', areaId, need, have: areaLevels[areaId] ?? 0 }));
  if (rule.worldDevelopment !== undefined && wd < rule.worldDevelopment) {
    gaps.push({ kind: 'worldDevelopment', need: rule.worldDevelopment, have: wd });
  }
  return gaps;
}
