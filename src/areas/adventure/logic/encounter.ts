// What a group on the map throws at the party (spec §3.4, §14): the enemies drawn from its pool, the loot of a chest, the enemies' turns
// (each does what its intent said). Pure helpers shared by the trip actions, the sweep and the Admin simulation; every draw takes the
// caller's rng.
import { type Rng } from '../../../core/rng';
import { act, actionFor, current } from '../../../systems/combat';
import type { BattleEvent, BattleState, CombatantInit, Mods } from '../../../systems/combat/types';
import { COMBAT_CONTEXT, ENEMIES, LOOT_TABLES } from './config/content';

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

/** One group of enemies drawn from a pool by weight. */
export function pickGroup(rng: Rng, pool: readonly { weight: number; enemies: readonly string[] }[]): readonly string[] {
  const total = pool.reduce((n, p) => n + p.weight, 0);
  let r = rng.next() * total;
  return (pool.find((p) => (r -= p.weight) < 0) ?? pool.at(-1)!).enemies;
}

export const enemyInits = (ids: readonly string[]): CombatantInit[] =>
  ids.map((id, i) => {
    const e = ENEMIES[id]!;
    const mods: Partial<Mods> = { statusResist: e.statusResist, statusImmune: e.statusImmune, elementOverrides: e.elementOverrides };
    return {
      id: `${id}#${i}`,
      side: 'enemy',
      name: e.nameVi,
      element: e.element,
      element2: e.element2 ?? null,
      tags: e.tags,
      stats: e.stats,
      skills: e.skills.map((s) => ({ id: s, level: 1 })),
      rageMax: 0,
      mods,
      phases: e.phases,
    };
  });

/** The enemy behind a combatant id (`enemy_x#0` → `enemy_x`). */
export const enemyIdOf = (combatantId: string): string => combatantId.split('#')[0]!;

/** The enemies play (their intents) until it is an ally's turn again or the battle is over; what they did is appended to `events`. */
export function playEnemies(state: BattleState, events: BattleEvent[]): BattleState {
  let s = state;
  for (let guard = 0; guard < 200 && !s.outcome; guard += 1) {
    const cur = current(s);
    if (!cur || cur.side === 'ally') break;
    const action = actionFor(s, COMBAT_CONTEXT);
    const r = action ? act(s, action, COMBAT_CONTEXT) : null;
    const step = r && r.ok ? r : act(s, { kind: 'guard' }, COMBAT_CONTEXT);
    if (!step.ok) break;
    s = step.state;
    events.push(...step.events);
  }
  return s;
}
