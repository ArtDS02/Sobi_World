// Progression (decision 007, 013): ONE Sobi World Level. Every Area adds its XP under
// progression.areas.<id>.xp (kept per Area); the World XP is their sum and the level comes from the one table
// in content/shared/progression.json. World Development (a wider number: level + Codex + buildings) and the
// world level gate new Areas and content. Pure.

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

/** What the XP functions read: each Area's XP. */
export interface XpHolder {
  progression: { areas: Readonly<Record<string, { xp: number }>> };
}

export const areaXp = (world: XpHolder, areaId: string): number =>
  world.progression.areas[areaId]?.xp ?? 0;

/** World XP: what every Area earned, added up. */
export const worldXp = (world: XpHolder): number =>
  Object.values(world.progression.areas).reduce((sum, a) => sum + a.xp, 0);

export const worldLevel = (world: XpHolder, table: LevelTable): number =>
  levelFromXp(worldXp(world), table);

/** XP bar of a level: where it starts, where the next one starts (null at the cap) and the 0..100 fill. */
export function levelProgress(xp: number, table: LevelTable): { level: number; floor: number; next: number | null; percent: number } {
  const level = levelFromXp(xp, table);
  const floor = table.xp[level - 1] ?? 0;
  const next = nextLevelXp(level, table);
  const percent = next === null ? 100 : Math.floor(((xp - floor) / (next - floor)) * 100);
  return { level, floor, next, percent };
}

export interface WorldDevelopmentRules {
  perWorldLevel: number;
  codexEntriesPerPoint: number;
  perBuildingLv3: number;
}

export interface WorldDevelopmentInput {
  worldLevel: number;
  /** Codex entries discovered (all kinds). */
  codexEntries: number;
  /** Buildings at Lv3 or more, all Areas. */
  buildingsLv3: number;
}

export function worldDevelopment(input: WorldDevelopmentInput, rules: WorldDevelopmentRules): number {
  return (
    input.worldLevel * rules.perWorldLevel +
    Math.floor(input.codexEntries / rules.codexEntriesPerPoint) +
    input.buildingsLv3 * rules.perBuildingLv3
  );
}

/** What an Area needs to open (Area manifest `unlock`): the world level and World Development. */
export interface UnlockRule {
  worldLevel?: number;
  worldDevelopment?: number;
}

export type UnlockGap =
  | { kind: 'worldLevel'; need: number; have: number }
  | { kind: 'worldDevelopment'; need: number; have: number };

/** Conditions still missing (empty = the Area can open). */
export function unlockGaps(rule: UnlockRule, have: { worldLevel: number; worldDevelopment: number }): UnlockGap[] {
  const gaps: UnlockGap[] = [];
  if (rule.worldLevel !== undefined && have.worldLevel < rule.worldLevel) {
    gaps.push({ kind: 'worldLevel', need: rule.worldLevel, have: have.worldLevel });
  }
  if (rule.worldDevelopment !== undefined && have.worldDevelopment < rule.worldDevelopment) {
    gaps.push({ kind: 'worldDevelopment', need: rule.worldDevelopment, have: have.worldDevelopment });
  }
  return gaps;
}
