// What a fighter's numbers are (spec V2 §4.4): its class's base stats grow with level, rarity and Bond, plus what the gear and rations
// add; experience and levels. Accuracy, evasion and crit are points that do not grow with level; speed and MP grow at half the rate
// (a high level should not make everyone act twice). Pure: the rules come in as arguments.
import { STAT_KEYS, type StatKey, type Stats } from './types';

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

const FLAT: readonly StatKey[] = ['acc', 'eva', 'crit'];
const HALF: readonly StatKey[] = ['spd', 'mp'];

export const zeroStats = (): Stats => Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;

export function deriveStats(base: Stats, input: StatInput, rules: StatRules, bonus: Partial<Stats> = {}): Stats {
  const bond = 1 + rules.bondPerHeart * input.hearts;
  const out = zeroStats();
  for (const k of STAT_KEYS) {
    if (FLAT.includes(k)) {
      out[k] = base[k] + (bonus[k] ?? 0);
      continue;
    }
    const growth = 1 + (HALF.includes(k) ? rules.levelGrowth / 2 : rules.levelGrowth) * (input.level - 1);
    out[k] = Math.round(base[k] * growth * input.rarityMult * bond) + (bonus[k] ?? 0);
  }
  return out;
}

/** Shares of some stats added (rations: +15% HP…) and flat points (speed, crit). */
export function addShares(stats: Stats, shares: Partial<Stats>, flat: Partial<Stats> = {}): Stats {
  const out = { ...stats };
  for (const k of STAT_KEYS) out[k] = Math.round(stats[k] * (1 + (shares[k] ?? 0))) + (flat[k] ?? 0);
  return out;
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
