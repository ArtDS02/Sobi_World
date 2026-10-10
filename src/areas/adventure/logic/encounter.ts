// What a node of a zone throws at the party (GĐ10): the groups of enemies drawn from a pool, the loot of a chest, the enemies'
// turns. Pure helpers shared by the run actions and the Admin simulation; every draw takes the caller's rng.
import { type Rng } from '../../../core/rng';
import { act, chooseAction, current } from '../../../systems/combat';
import type { BattleEvent, BattleState, CombatantInit } from '../../../systems/combat/types';
import { COMBAT_CONTEXT, ENEMIES, LOOT_TABLES } from './config/content';
import type { RunMember } from './state';

export type LootTable = (typeof LOOT_TABLES)[string];

export const randInt = (rng: Rng, range: readonly [number, number]): number => range[0] + Math.floor(rng.next() * (range[1] - range[0] + 1));

export const addCount = (into: Record<string, number>, id: string, n: number) => {
  into[id] = (into[id] ?? 0) + n;
};

/** A loot table drawn: items by weight, coins, and now and then gems. */
export function rollTable(rng: Rng, table: LootTable): { items: Record<string, number>; coins: number; gems: number } {
  const items: Record<string, number> = {};
  const total = table.entries.reduce((n, e) => n + e.weight, 0);
  for (let i = 0; i < table.rolls && total > 0; i += 1) {
    let r = rng.next() * total;
    const entry = table.entries.find((e) => (r -= e.weight) < 0) ?? table.entries.at(-1)!;
    addCount(items, entry.itemId, randInt(rng, [entry.min, entry.max]));
  }
  const gems = rng.next() < table.gemChance ? randInt(rng, table.gems) : 0;
  return { items, coins: randInt(rng, table.coins), gems };
}

/** The zone's enemies of a battle node: one group drawn from the pool by weight. */
export function pickGroup(rng: Rng, pool: readonly { weight: number; enemies: readonly string[] }[]): readonly string[] {
  const total = pool.reduce((n, p) => n + p.weight, 0);
  let r = rng.next() * total;
  return (pool.find((p) => (r -= p.weight) < 0) ?? pool.at(-1)!).enemies;
}

export const allyInit = (m: RunMember): CombatantInit => ({ id: m.key, side: 'ally', name: m.name, element: m.element, stats: m.stats, skills: m.skills, hp: m.hp });

export const enemyInits = (ids: readonly string[]): CombatantInit[] =>
  ids.map((id, i) => {
    const e = ENEMIES[id]!;
    return { id: `${id}#${i}`, side: 'enemy', name: e.nameVi, element: e.element, stats: e.stats, skills: e.skills };
  });

/** The enemies of a combatant id list (`enemy_x#0` → `enemy_x`). */
export const enemyIdOf = (combatantId: string): string => combatantId.split('#')[0]!;

/** The enemies play until it is an ally's turn again (or the battle is over); what they did is appended to `events`. */
export function playEnemies(state: BattleState, events: BattleEvent[]): BattleState {
  let s = state;
  for (let guard = 0; guard < 200 && !s.outcome; guard += 1) {
    const cur = current(s);
    if (!cur || cur.side === 'ally') break;
    const action = chooseAction(s, COMBAT_CONTEXT);
    if (!action) break;
    const r = act(s, action, COMBAT_CONTEXT);
    if (!r.ok) break;
    s = r.state;
    events.push(...r.events);
  }
  return s;
}

