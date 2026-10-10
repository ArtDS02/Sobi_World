// What a fighter's numbers are (spec V2 §7, §8.5): the archetype's base stats grow with level, rarity and Bond, plus what
// the equipment adds; experience and the skills a level opens. Pure: the rules come in as arguments.
import type { Stats } from './types';

export interface StatRules {
  /** Stats grow by this share of the base for every level above 1. */
  levelGrowth: number;
  /** Extra share of the stats for each full heart of Bond. */
  bondPerHeart: number;
}

export interface LevelRules {
  maxLevel: number;
  expBase: number;
  expExponent: number;
}

export interface StatInput {
  level: number;
  /** Rarity multiplier of the species (1 = Common). */
  rarityMult: number;
  hearts: number;
}

/** Speed grows at half the rate of the other stats (a high level should not make everyone act twice). */
export function deriveStats(base: Stats, input: StatInput, rules: StatRules, bonus: Partial<Stats> = {}): Stats {
  const growth = 1 + rules.levelGrowth * (input.level - 1);
  const speedGrowth = 1 + (rules.levelGrowth / 2) * (input.level - 1);
  const bond = 1 + rules.bondPerHeart * input.hearts;
  const scale = (v: number, g: number) => v * g * input.rarityMult * bond;
  return {
    hp: Math.round(scale(base.hp, growth)) + (bonus.hp ?? 0),
    atk: Math.round(scale(base.atk, growth)) + (bonus.atk ?? 0),
    def: Math.round(scale(base.def, growth)) + (bonus.def ?? 0),
    spd: Math.round(scale(base.spd, speedGrowth)) + (bonus.spd ?? 0),
    crit: base.crit + (bonus.crit ?? 0),
  };
}

/** Experience to go from `level` to the next one (Infinity at the top). */
export const expToNext = (level: number, rules: LevelRules): number =>
  level >= rules.maxLevel ? Number.POSITIVE_INFINITY : Math.floor(rules.expBase * level ** rules.expExponent);

/** `gain` experience added: the new level and the experience towards the next one. */
export function addExp(level: number, exp: number, gain: number, rules: LevelRules): { level: number; exp: number; levelsGained: number } {
  let l = level;
  let e = exp + Math.max(0, Math.floor(gain));
  while (l < rules.maxLevel && e >= expToNext(l, rules)) {
    e -= expToNext(l, rules);
    l += 1;
  }
  return { level: l, exp: l >= rules.maxLevel ? 0 : e, levelsGained: l - level };
}

/** The skills a fighter of `level` may use: the first of `skills` whose unlock level is reached, in order. */
export const skillsAtLevel = <T>(skills: readonly T[], unlockLevels: readonly number[], level: number): T[] =>
  skills.filter((_, i) => level >= (unlockLevels[i] ?? Number.POSITIVE_INFINITY));
