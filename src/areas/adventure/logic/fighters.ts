// A fighter is a creature of another Area (pig or fish) with an adventure record (spec §4): its class (chosen or its line's default),
// its stats from the class, level, rarity, Bond and gear, its skills (Unique by level + the class loadout) and Ultimate, whether it may
// go on a trip, and when it will be fit again. Pure.
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { ErrorCode } from '../../../core/config/errors';
import { addShares, deriveStats, expToNext } from '../../../systems/combat/stats';
import type { CombatantInit, SkillSlot, Stats } from '../../../systems/combat/types';
import { loadoutBonus, loadoutMods } from '../../../systems/equipment';
import { AB, CLASSES, EQUIPMENT_DEFS, HOUR_MS, LEVEL_RULES, PREP_ITEMS, STAT_RULES, identityOf, type ClassId, type Identity } from './config/content';
import { newFighterFields, type Fighter, type RunMember } from './state';
import { classLoadout } from './tree';

export const newFighter = (now: number): Fighter => ({ level: 1, exp: 0, loadout: {}, energy: AB.run.energyMax, energyAt: now, exhaustedUntil: null, ...newFighterFields() });

/** Adventure energy now: it refills `energyPerHour` an hour (`boost` = the Camp technology's extra share) up to the cap. */
export const energyOf = (f: Pick<Fighter, 'energy' | 'energyAt'>, now: number, boost = 0): number =>
  Math.min(AB.run.energyMax, f.energy + (Math.max(0, now - f.energyAt) / HOUR_MS) * AB.run.energyPerHour * (1 + boost));

/** Milliseconds still to rest after a lost trip (0 = fit). */
export const exhaustedLeft = (f: Pick<Fighter, 'exhaustedUntil'> | undefined, now: number): number => Math.max(0, (f?.exhaustedUntil ?? 0) - now);

/** Milliseconds until the energy reaches `need` (0 when it has it). */
export function msToEnergy(f: Pick<Fighter, 'energy' | 'energyAt'>, now: number, need: number, boost = 0): number {
  const missing = need - energyOf(f, now, boost);
  return missing <= 0 || AB.run.energyPerHour <= 0 ? 0 : Math.ceil((missing / (AB.run.energyPerHour * (1 + boost))) * HOUR_MS);
}

export const rarityMultiplier = (rarity: string): number => (AB.stats.rarity as Record<string, number>)[rarity] ?? 1;

/** Its class: the one chosen at the temple, else its line's default. */
export const classOf = (f: Pick<Fighter, 'classId'>, identity: Identity): ClassId => f.classId ?? identity.classId;

export function fighterStats(f: Fighter, entry: Pick<RosterEntry, 'rarity' | 'hearts'>, identity: Identity): Stats {
  return deriveStats(CLASSES[classOf(f, identity)].stats, { level: f.level, rarityMult: rarityMultiplier(entry.rarity), hearts: entry.hearts }, STAT_RULES, loadoutBonus(f.loadout, EQUIPMENT_DEFS));
}

/** The Unique skills its level has opened (two from the start, one at 10, one at 20). */
export const uniqueSkills = (f: Pick<Fighter, 'level'>, identity: Identity): SkillSlot[] =>
  identity.unique.filter((_, i) => f.level >= (AB.levels.uniqueUnlockLevels[i] ?? Number.POSITIVE_INFINITY)).map((id) => ({ id, level: 1 }));

/** Every skill it takes into battle: its Unique skills, then its class loadout. */
export const fighterSkills = (f: Fighter, identity: Identity): SkillSlot[] => [...uniqueSkills(f, identity), ...classLoadout(f, classOf(f, identity))];

export const expNeeded = (f: Pick<Fighter, 'level'>): number => expToNext(f.level, LEVEL_RULES);

/** Why a creature cannot go on a trip now, or null when it can. */
export function whyNotReady(entry: RosterEntry | undefined, f: Fighter | undefined, now: number, boost = 0): ErrorCode | null {
  if (!entry || !identityOf(entry) || entry.purpose !== 'ADVENTURE' || !entry.adult) return 'NOT_A_FIGHTER';
  if (entry.sick) return 'FIGHTER_SICK';
  if (exhaustedLeft(f, now) > 0) return 'FIGHTER_EXHAUSTED';
  if (energyOf(f ?? newFighter(now), now, boost) < AB.run.energyCost) return 'NO_ADVENTURE_ENERGY';
  return null;
}

/** The stats with the rations a trip carries (GĐ11): shares of some stats, flat points of others. */
export function withPrep(stats: Stats, prep: readonly string[]): Stats {
  let out = stats;
  for (const id of prep) {
    const row = PREP_ITEMS[id];
    if (row) out = addShares(out, row.shares, row.flat);
  }
  return out;
}

/** The member of a trip: its numbers frozen for the trip, full HP and MP, its Rage as it was left. */
export function memberOf(key: string, f: Fighter, entry: RosterEntry, identity: Identity, prep: readonly string[] = []): RunMember {
  const stats = withPrep(fighterStats(f, entry, identity), prep);
  const mods = loadoutMods(f.loadout, EQUIPMENT_DEFS);
  return {
    key,
    name: entry.name,
    art: entry.artId,
    lineage: identity.lineage.id,
    classId: classOf(f, identity),
    element: identity.element,
    element2: identity.element2,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    rage: Math.min(AB.rage.max, f.rage),
    skills: fighterSkills(f, identity),
    ultimate: identity.ultimate,
    mods: { elementDamage: { ...mods.elementDamage }, elementResist: { ...mods.elementResist }, statusChance: { ...mods.statusChance }, statusResist: { ...mods.statusResist }, categoryDamage: { ...mods.categoryDamage } },
  };
}

/** A trip member as a combatant: its HP, MP and Rage carry on; the trip's shrine blessings add to its element damage. */
export function allyInit(m: RunMember, blessings: Readonly<Record<string, number>> = {}): CombatantInit {
  const elementDamage = { ...m.mods.elementDamage };
  for (const [el, n] of Object.entries(blessings)) elementDamage[el] = (elementDamage[el] ?? 0) + n;
  return {
    id: m.key,
    side: 'ally',
    name: m.name,
    element: m.element,
    element2: m.element2,
    stats: m.stats,
    skills: m.skills,
    ultimate: m.ultimate,
    hp: m.hp,
    mp: m.mp,
    rage: m.rage,
    rageMax: AB.rage.max,
    mods: { ...m.mods, elementDamage } as CombatantInit['mods'],
  };
}
