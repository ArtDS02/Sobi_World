// A fighter is a creature of another Area (pig or fish) with an adventure record: the numbers a run starts from, whether it
// may go, and when it will be fit again. Pure.
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { ErrorCode } from '../../../core/config/errors';
import { deriveStats, expToNext, skillsAtLevel } from '../../../systems/combat/stats';
import type { Stats } from '../../../systems/combat/types';
import { loadoutBonus } from '../../../systems/equipment';
import { AB, ARCHETYPES, EQUIPMENT_DEFS, HOUR_MS, LEVEL_RULES, STAT_RULES, archetypeOf, type Archetype } from './config/content';
import type { Fighter, RunMember } from './state';

export const newFighter = (now: number): Fighter => ({ level: 1, exp: 0, loadout: {}, energy: AB.run.energyMax, energyAt: now, exhaustedUntil: null });

/** Adventure energy now: it refills `energyPerHour` an hour up to the cap. */
export const energyOf = (f: Pick<Fighter, 'energy' | 'energyAt'>, now: number): number =>
  Math.min(AB.run.energyMax, f.energy + (Math.max(0, now - f.energyAt) / HOUR_MS) * AB.run.energyPerHour);

/** Milliseconds still to rest after a lost run (0 = fit). */
export const exhaustedLeft = (f: Pick<Fighter, 'exhaustedUntil'> | undefined, now: number): number => Math.max(0, (f?.exhaustedUntil ?? 0) - now);

/** Milliseconds until the energy reaches `need` (0 when it has it). */
export function msToEnergy(f: Pick<Fighter, 'energy' | 'energyAt'>, now: number, need: number): number {
  const missing = need - energyOf(f, now);
  return missing <= 0 || AB.run.energyPerHour <= 0 ? 0 : Math.ceil((missing / AB.run.energyPerHour) * HOUR_MS);
}

export const rarityMultiplier = (rarity: string): number => (AB.stats.rarity as Record<string, number>)[rarity] ?? 1;

export function fighterStats(f: Fighter, entry: Pick<RosterEntry, 'rarity' | 'hearts'>, archetype: Archetype): Stats {
  return deriveStats(archetype.stats, { level: f.level, rarityMult: rarityMultiplier(entry.rarity), hearts: entry.hearts }, STAT_RULES, loadoutBonus(f.loadout, EQUIPMENT_DEFS));
}

/** The skills it has at its level (two from the start, one more at 10 and at 20). */
export const fighterSkills = (f: Pick<Fighter, 'level'>, archetype: Archetype): string[] => skillsAtLevel(archetype.skills, AB.levels.skillUnlockLevels, f.level);

export const expNeeded = (f: Pick<Fighter, 'level'>): number => expToNext(f.level, LEVEL_RULES);

/** Why a creature cannot go on a run now, or null when it can. */
export function whyNotReady(entry: RosterEntry | undefined, f: Fighter | undefined, now: number): ErrorCode | null {
  if (!entry || !archetypeOf(entry) || entry.purpose !== 'ADVENTURE' || !entry.adult) return 'NOT_A_FIGHTER';
  if (entry.sick) return 'FIGHTER_SICK';
  if (exhaustedLeft(f, now) > 0) return 'FIGHTER_EXHAUSTED';
  if (energyOf(f ?? newFighter(now), now) < AB.run.energyCost) return 'NO_ADVENTURE_ENERGY';
  return null;
}

/** The member of a run: its numbers frozen for the run, full HP. */
export function memberOf(key: string, f: Fighter, entry: RosterEntry, archetype: Archetype): RunMember {
  const stats = fighterStats(f, entry, archetype);
  return { key, name: entry.name, art: entry.artId, element: archetype.element, stats, hp: stats.hp, skills: fighterSkills(f, archetype) };
}

export const archetypeById = (id: string): Archetype | undefined => ARCHETYPES[id];
