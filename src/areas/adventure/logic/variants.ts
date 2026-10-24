// What makes a trip's groups differ (decision 039): a normal group may wear a variant drawn from the trip's seed (stronger, or wet,
// or golden and quick to run away) with richer rewards; once the team has outgrown the zone, a group far weaker than it is beaten at
// once by the AI of both sides, on the same engine and seed as a played battle. Pure.
import { hashSeed, mulberry32 } from '../../../core/rng';
import { act, chooseAction, current, startBattle } from '../../../systems/combat';
import type { BattleEvent, BattleState, CombatantInit, Stats } from '../../../systems/combat/types';
import { AFFIXES, COMBAT_CONTEXT, ENEMIES, ENGAGEMENT, type Affix, type MapGroup } from './config/content';
import { playEnemies } from './encounter';
import type { RunMember } from './state';

/** The variant a group wears on this trip (normal groups only), the same every time it is met. */
export function groupAffix(seed: number, mapId: string, g: Pick<MapGroup, 'id' | 'kind'>): Affix | null {
  if (g.kind !== 'normal') return null;
  const rng = mulberry32(hashSeed('affix', seed, mapId, g.id));
  if (rng.next() >= ENGAGEMENT.affixChance) return null;
  const total = ENGAGEMENT.affixes.reduce((n, a) => n + a.weight, 0);
  let r = rng.next() * total;
  return ENGAGEMENT.affixes.find((a) => (r -= a.weight) < 0) ?? ENGAGEMENT.affixes.at(-1)!;
}

/** Stats with some multiplied (1 when absent). */
export function scaleStats(stats: Stats, mults: Partial<Record<keyof Stats, number>>): Stats {
  const out = { ...stats };
  for (const [k, m] of Object.entries(mults) as [keyof Stats, number | undefined][]) if (m !== undefined) out[k] = out[k] * m;
  return out;
}

/** The enemies of a group as their variant makes them. */
export function withAffix(inits: readonly CombatantInit[], affix: Affix | null): CombatantInit[] {
  if (!affix) return [...inits];
  return inits.map((e) => ({
    ...e,
    name: `${e.name} · ${affix.nameVi}`,
    stats: scaleStats(e.stats, affix.stats),
    tags: [...new Set([...(e.tags ?? []), ...affix.tags, `affix:${affix.id}`])],
    statuses: [...(e.statuses ?? []), ...affix.statuses],
  }));
}

/** The variant a combatant wears (its `affix:<id>` tag). */
export const affixOfTags = (tags: readonly string[]): Affix | null => {
  const tag = tags.find((t) => t.startsWith('affix:'));
  return tag ? (AFFIXES[tag.slice('affix:'.length)] ?? null) : null;
};

/** A rough strength: health times the better attack (what a quick look at both sides compares). */
const strength = (hp: number, stats: Pick<Stats, 'atk' | 'matk'>) => hp * Math.max(stats.atk, stats.matk);

/** The team's strength as it stands now (knocked-out members count for nothing). */
export const teamStrength = (team: readonly RunMember[]): number => team.reduce((n, m) => n + (m.hp > 0 ? strength(m.hp, m.stats) : 0), 0);

export const groupStrength = (ids: readonly string[]): number =>
  ids.reduce((n, id) => {
    const e = ENEMIES[id];
    return n + (e ? strength(e.stats.hp, e.stats) : 0);
  }, 0);

/**
 * Is the group weak enough to be beaten at once: a normal group without a variant, a team whose average level has outgrown the zone
 * (`zoneTop` = the top of its level range), and a team far stronger than the group as both stand now.
 */
export function quickWinnable(team: readonly RunMember[], teamLevel: number, zoneTop: number, ids: readonly string[], g: Pick<MapGroup, 'kind'>, affix: Affix | null): boolean {
  if (g.kind !== 'normal' || affix || teamLevel < zoneTop + ENGAGEMENT.quickWin.levelsAbove) return false;
  const foes = groupStrength(ids);
  return foes > 0 && teamStrength(team) >= ENGAGEMENT.quickWin.powerRatio * foes;
}

/** The average level of a team. */
export const teamLevel = (team: readonly RunMember[], levelOf: (key: string) => number): number => team.reduce((n, m) => n + levelOf(m.key), 0) / Math.max(1, team.length);

/** A battle played to its end by the AI of both sides; every event of it, in order. */
export function autoBattle(seed: number, fighters: readonly CombatantInit[]): { state: BattleState; events: BattleEvent[] } {
  const started = startBattle(seed, fighters, COMBAT_CONTEXT);
  const events = [...started.events];
  let s = playEnemies(started.state, events);
  for (let guard = 0; guard < 400 && !s.outcome; guard += 1) {
    const cur = current(s);
    if (!cur) break;
    const action = chooseAction(s, COMBAT_CONTEXT);
    const r = action ? act(s, action, COMBAT_CONTEXT) : null;
    const step = r && r.ok ? r : act(s, { kind: 'guard' }, COMBAT_CONTEXT);
    if (!step.ok) break;
    events.push(...step.events);
    s = playEnemies(step.state, events);
  }
  return { state: s, events };
}
