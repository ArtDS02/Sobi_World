// The six classes of enemy group and their corruption (decision 045). A group's class says how big it stands on the map, whether it is
// beaten for good, whether the party may flee from it, and how its enemies are made from the enemy rows: stronger stats, a second
// element (mutant, special), richer rewards. Its corruption 1–5 makes them stronger again, tougher against the elements and gives dark
// skills, all measured against the class's own level, so a class at its usual corruption fights as its enemies were made; Light hurts
// them more and the umbraflux tag comes at every level that has them. A sleeping group starts the battle stunned; a special group shows
// only on a rainy day or at night. Pure.
import { isNight } from '../../../core/clock';
import { TIME } from '../../../core/config/time';
import type { WorldSave } from '../../../core/save/world';
import type { CombatantInit, Element, Mods, Stats } from '../../../systems/combat/types';
import { weatherNow } from '../../../systems/weather/live';
import { ELEMENT_VALUES } from '../../../../content/schemas/adventure/combat';
import { AB, type AreaMap, type MapGroup } from './config/content';
import type { AdventureState } from './state';
import { scaleStats } from './variants';

export type FoeClass = MapGroup['kind'];
type Group = Pick<MapGroup, 'kind'> & Partial<Pick<MapGroup, 'corruption' | 'sleep' | 'when' | 'element2'>>;

const FOES = AB.foes;
/** The stats corruption raises (speed, accuracy, evasion and critical hits stay). */
const CORRUPTED_STATS: readonly (keyof Stats)[] = ['hp', 'atk', 'def', 'matk', 'mdef'];

export const foeClass = (kind: FoeClass) => FOES.classes[kind];

/** The area's guardian (its defeat lights the portal and opens the gates behind it) or the zone boss. */
export const isGuardian = (g: Pick<MapGroup, 'kind'>): boolean => g.kind === 'elite' || g.kind === 'boss';

/** Beaten once and for all: every class but the normal and the mutant groups, which come back when the party changes area. */
export const staysBeaten = (g: Pick<MapGroup, 'kind'>): boolean => g.kind !== 'normal' && g.kind !== 'mutant';

/** The party may run only from a group that comes back. */
export const canFlee = (g: Pick<MapGroup, 'kind'>): boolean => !staysBeaten(g);

export const corruptionOf = (g: Group): number => g.corruption ?? foeClass(g.kind).corruption;

/** Height of the group's picture on the map, in tiles. */
export const foeSize = (g: Pick<MapGroup, 'kind'>): number => foeClass(g.kind).size;

const level = (n: number) => FOES.corruption[Math.max(1, Math.min(5, n)) - 1]!;

/** Corruption's share of stats and rewards, and its extra resistance, against the class's own level. */
function corruptionShare(g: Group): { stats: number; reward: number; resist: number } {
  const own = level(foeClass(g.kind).corruption);
  const at = level(corruptionOf(g));
  return { stats: at.stats / own.stats, reward: at.reward / own.reward, resist: at.resist - own.resist };
}

/** What the group's class and corruption make of its rewards: experience and coins, and drop chances. */
export function foeReward(g: Group): { reward: number; drops: number } {
  const row = foeClass(g.kind);
  const share = corruptionShare(g);
  return { reward: row.reward * share.reward, drops: row.drops };
}

/** The second element a mutant or a special grows (none for the other classes, or when it would be its first one). */
export function grownElement(g: Group, first: Element): Element | null {
  if (g.kind !== 'mutant' && g.kind !== 'special') return null;
  const el = g.element2 ?? FOES.secondElement[first] ?? null;
  return el && el !== first ? el : null;
}

/** The dark skills its corruption gives above the class's own level, in order of level. */
export const corruptionSkills = (g: Group): string[] =>
  FOES.corruption.slice(foeClass(g.kind).corruption, Math.max(0, Math.min(5, corruptionOf(g)))).flatMap((l) => (l.skill ? [l.skill] : []));

/** The enemies of a group as its class and corruption make them. */
export function withClass(inits: readonly CombatantInit[], g: Group): CombatantInit[] {
  const row = foeClass(g.kind);
  const c = corruptionOf(g);
  const lv = level(c);
  const share = corruptionShare(g);
  const extra = corruptionSkills(g);
  const named = g.kind === 'mutant' || g.kind === 'subboss' || g.kind === 'special';
  return inits.map((e) => {
    const mods: Partial<Mods> = { ...e.mods, elementResist: { ...e.mods?.elementResist } };
    for (const el of ELEMENT_VALUES) {
      const add = el === 'LIGHT' ? -lv.lightWeak : share.resist;
      if (add !== 0) mods.elementResist![el] = (mods.elementResist![el] ?? 0) + add;
    }
    const scaled = scaleStats(e.stats, row.stats);
    const stats = scaleStats(scaled, Object.fromEntries(CORRUPTED_STATS.map((k) => [k, share.stats])));
    const tags = [...(e.tags ?? []), `foe:${g.kind}`, `corruption:${c}`, ...(c >= FOES.umbrafluxFrom ? ['umbraflux'] : [])];
    const grown = grownElement(g, e.element);
    return {
      ...e,
      name: named ? `${e.name} · ${row.nameVi}` : e.name,
      element2: grown ?? e.element2 ?? null,
      stats,
      skills: [...e.skills, ...extra.filter((id) => !e.skills.some((s) => s.id === id)).map((id) => ({ id, level: 1 }))],
      tags: [...new Set(tags)],
      mods,
      statuses: [...(e.statuses ?? []), ...(g.sleep ? [{ status: 'stun' as const, turns: 1 }] : [])],
    };
  });
}

/** A zone whose boss has fallen is purified one step (decision 045). */
export const zonePurified = (a: Pick<AdventureState, 'cleared'>, zoneId: string): boolean => (a.cleared[zoneId] ?? 0) > 0;

/** The corruption of an area now: its own, less a step once its zone is purified. */
export const areaCorruption = (map: Pick<AreaMap, 'corruption' | 'zoneId'>, a: Pick<AdventureState, 'cleared'>): number =>
  Math.max(0, map.corruption - (zonePurified(a, map.zoneId) ? FOES.purify.area : 0));

/** A group as it stands now: in a purified zone the normal groups are a step less corrupted (never under 1). */
export function groupNow<G extends Group>(g: G, purified: boolean): G {
  if (!purified || g.kind !== 'normal') return g;
  return { ...g, corruption: Math.max(1, corruptionOf(g) - FOES.purify.normal) };
}

/** The corruption level a combatant carries (its `corruption:<n>` tag), or 0. */
export const corruptionOfTags = (tags: readonly string[]): number => Number(tags.find((t) => t.startsWith('corruption:'))?.slice('corruption:'.length) ?? 0);

/** The sky a special group waits for: a rainy day, the night. */
export interface FoeSky {
  rain: boolean;
  night: boolean;
}

export const foeSky = (world: Pick<WorldSave, 'live'>, now: number, dayOffsetMs: number): FoeSky => ({
  rain: weatherNow(world, now, dayOffsetMs) === 'rainy',
  night: isNight(now, dayOffsetMs, TIME),
});

/** Does the group stand on the map under this sky. */
export const foePresent = (g: Pick<MapGroup, 'when'>, sky: FoeSky): boolean => !g.when || (g.when === 'rain' ? sky.rain : sky.night);

const ORDER: Record<FoeClass, number> = { normal: 0, mutant: 1, special: 2, elite: 3, subboss: 4, boss: 5 };

/** The order a walk through an area meets the classes in (the simulation and the tests): the open field first, the boss last. */
export const foeOrder = (kind: FoeClass): number => ORDER[kind];

/** A fight the main road does not need (the simulation skips it). */
export const optionalFoe = (g: Pick<MapGroup, 'kind'>): boolean => g.kind === 'subboss' || g.kind === 'special';
