// The Umbraflux Rift (decision 039): the endgame after the Ruins' boss. Floor after floor of one battle each, with enemies of every
// zone scaled to the floor, a rule that changes with the game day, and the three zone bosses waiting as Nightmares on their floors.
// Pure: what a floor throws at the team, how the day's rule touches both sides, what a floor gives.
import { DAY_MS } from '../../../core/clock';
import { hashSeed, mulberry32 } from '../../../core/rng';
import type { CombatantInit, Mods, Stats } from '../../../systems/combat/types';
import { ENEMY_LIST, ENEMY_ZONE, RIFT, type RiftRule } from './config/content';
import { enemyInits } from './encounter';
import { addMods } from './bonds';
import { allyInit } from './fighters';
import type { AdventureState, RunMember } from './state';
import { scaleStats } from './variants';

/** The game day (days since the epoch, local) the Rift's rule follows. */
export const riftDay = (now: number, dayOffsetMs = 0): number => Math.floor((now + dayOffsetMs) / DAY_MS);

/** The rule of a game day. */
export function ruleOfDay(day: number): RiftRule {
  const i = Math.floor(mulberry32(hashSeed('rift-rule', day)).next() * RIFT.rules.length);
  return RIFT.rules[i]!;
}

export const riftOpen = (a: Pick<AdventureState, 'cleared'>): boolean => !!a.cleared[RIFT.requiresCleared];

export const nightmareAt = (floor: number) => RIFT.nightmares.find((n) => n.floor === floor) ?? null;

/** How much stronger than its zone an enemy is on a floor. */
export const floorScale = (floor: number): number => 1 + RIFT.perFloor * (Math.max(1, floor) - 1);

const STRONG: (keyof Stats)[] = ['hp', 'atk', 'matk', 'def', 'mdef'];
const scaled = (stats: Stats, by: number): Stats => scaleStats(stats, Object.fromEntries(STRONG.map((k) => [k, by])));

/** The enemies of the Rift's normal floors: every normal enemy met in a zone. */
const POOL = ENEMY_LIST.filter((e) => ENEMY_ZONE[e.id] && !e.tags.includes('boss') && !e.tags.includes('elite')).map((e) => e.id);

/** An enemy as a floor makes it: its zone's scale, the floor's, the rule's stats. */
function onFloor(init: CombatantInit, enemyId: string, by: number, rule: RiftRule): CombatantInit {
  const zone = ENEMY_ZONE[enemyId] ?? RIFT.requiresCleared;
  const stats = scaleStats(scaled(init.stats, (RIFT.zoneScale[zone] ?? 1) * by), rule.enemy.stats);
  const mods = init.mods ?? {};
  const elementDamage: Mods['elementDamage'] = { ...mods.elementDamage };
  for (const [el, n] of Object.entries(rule.enemy.mods.elementDamage ?? {})) elementDamage[el as keyof Mods['elementDamage']] = (elementDamage[el as keyof Mods['elementDamage']] ?? 0) + (n ?? 0);
  const statusChance: Mods['statusChance'] = { ...mods.statusChance };
  for (const [st, n] of Object.entries(rule.enemy.mods.statusChance ?? {})) statusChance[st as keyof Mods['statusChance']] = (statusChance[st as keyof Mods['statusChance']] ?? 0) + (n ?? 0);
  return { ...init, stats, mods: { ...mods, elementDamage, statusChance }, statuses: [...(init.statuses ?? []), ...rule.enemy.statuses] };
}

/** What floor `floor` throws at the team (a Nightmare boss and its escort on its floor). */
export function riftEnemies(seed: number, floor: number, rule: RiftRule): CombatantInit[] {
  const by = floorScale(floor);
  const nightmare = nightmareAt(floor);
  if (nightmare) {
    const ids = [nightmare.enemy, ...nightmare.escort];
    return enemyInits(ids).map((init, i) => {
      const id = ids[i]!;
      const e = onFloor(init, id, i === 0 ? by * RIFT.nightmare : by, rule);
      return i === 0 ? { ...e, name: nightmare.nameVi, phases: [...(e.phases ?? []), { hpBelow: 0.3, addSkills: [], statuses: nightmare.rage }] } : e;
    });
  }
  const rng = mulberry32(hashSeed('rift-floor', seed, floor));
  const size = floor >= RIFT.bigFrom ? RIFT.groupSize[1] : RIFT.groupSize[0];
  const ids = Array.from({ length: size }, () => POOL[Math.floor(rng.next() * POOL.length)]!);
  return enemyInits(ids).map((init, i) => onFloor(init, ids[i]!, by, rule));
}

/** A team member on a Rift floor: the day's rule adds its statuses and mods. */
export function riftAlly(m: RunMember, rule: RiftRule): CombatantInit {
  const init = allyInit({ ...m, mods: addMods(m.mods, rule.ally.mods) });
  return { ...init, statuses: rule.ally.statuses };
}

/** Coins and experience of clearing a floor. */
export const floorReward = (floor: number): { coins: number; exp: number } => {
  const g = 1 + RIFT.growth * (Math.max(1, floor) - 1);
  return { coins: Math.round(RIFT.coins * g), exp: Math.round(RIFT.exp * g) };
};
