// A run (spec V2 §8.5): the party picks a zone, walks its chain of nodes (battle, chest, small event) and meets the boss.
// A lost run only exhausts the party for a few real hours — nobody dies, nothing is taken. Every random draw comes from the
// run's seed and the node, so a saved run plays on the same way.
import type { RosterEntry } from '../../../../core/area-registry/registry';
import { cloneData } from '../../../../core/clone';
import type { ErrorCode } from '../../../../core/config/errors';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { worldLevel } from '../../../../core/progression/levels';
import { hashSeed, mulberry32, type Rng } from '../../../../core/rng';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { act, chooseAction, current, startBattle } from '../../../../systems/combat';
import { addExp } from '../../../../systems/combat/stats';
import type { BattleAction, BattleState } from '../../../../systems/combat/types';
import { AB, BATTLE_ITEMS, COMBAT_CONTEXT, ENEMIES, EVENTS, HOUR_MS, LEVEL_RULES, LOOT_TABLES, ZONES, archetypeOf, type Zone } from '../config/content';
import type { AdventureEvent } from '../events';
import { energyOf, memberOf, newFighter, whyNotReady } from '../fighters';
import type { AdventureState, Fighter, Run, RunMember } from '../state';
import { addCount, allyInit, enemyIdOf, enemyInits, pickGroup, playEnemies, rollTable } from '../encounter';
import { countOf, credit, put, runAdventure, take, type AdventureResult } from './kit';

/** Working copy of one step: the world, the slice, the run, what happened and the XP earned. */
interface Step {
  w: WorldSave;
  a: AdventureState;
  run: Run;
  events: AdventureEvent[];
  xp: number;
  ctx: ActionContext;
}

function zoneOf(run: Run): Zone {
  return ZONES[run.zoneId]!;
}

function setFighter(st: Step, key: string, patch: Partial<Fighter>) {
  const f = st.a.fighters[key];
  if (f) st.a = { ...st.a, fighters: { ...st.a.fighters, [key]: { ...f, ...patch } } };
}

/** Experience to every member of the team, with the level-ups. */
function giveExp(st: Step, exp: number) {
  if (exp <= 0) return;
  st.run.expGained += exp;
  for (const m of st.run.team) {
    const f = st.a.fighters[m.key];
    if (!f) continue;
    const next = addExp(f.level, f.exp, exp, LEVEL_RULES);
    setFighter(st, m.key, { level: next.level, exp: next.exp });
    if (next.levelsGained > 0) {
      if (!st.run.levelUps.includes(m.key)) st.run.levelUps.push(m.key);
      st.events.push({ type: 'ADVENTURE_LEVEL_UP', key: m.key, name: m.name, level: next.level });
    }
  }
}

/** The run is over: its loot waits in the pending pile; a lost run exhausts the party. */
function finish(st: Step, result: 'win' | 'lose' | 'retreat') {
  const { run } = st;
  run.phase = 'done';
  run.result = result;
  run.battle = null;
  const pending = { ...st.a.pending };
  for (const [id, n] of Object.entries(run.loot)) addCount(pending, id, n);
  st.a = { ...st.a, pending };
  if (result === 'win') {
    st.a = { ...st.a, runsCleared: st.a.runsCleared + 1 };
    st.xp += AB.xp.zoneClear;
  } else if (result === 'lose') {
    st.a = { ...st.a, runsLost: st.a.runsLost + 1 };
    const until = st.ctx.now + AB.run.exhaustHours * HOUR_MS;
    for (const m of run.team) setFighter(st, m.key, { exhaustedUntil: until });
    st.events.push({ type: 'ADVENTURE_EXHAUSTED', keys: run.team.map((m) => m.key) });
  }
  st.events.push({ type: 'ADVENTURE_RUN_ENDED', zoneId: run.zoneId, result });
}

/** A battle has ended: its rewards on a win, the end of the run on a loss. */
function settleBattle(st: Step, battle: BattleState, boss: boolean, enemyIds: readonly string[], rng: Rng) {
  const { run } = st;
  run.battle = null;
  run.phase = 'map';
  if (battle.outcome === 'lose') {
    finish(st, 'lose');
    return;
  }
  // HP carries on to the next node.
  for (const m of run.team) m.hp = battle.combatants.find((c) => c.id === m.key)?.hp ?? m.hp;
  const enemies = enemyIds.map((id) => ENEMIES[id]!);
  const exp = enemies.reduce((n, e) => n + e.exp, 0);
  const coins = enemies.reduce((n, e) => n + e.coins, 0);
  for (const e of enemies) {
    for (const d of e.drops) if (rng.next() < d.chance) addCount(run.loot, d.itemId, d.min + Math.floor(rng.next() * (d.max - d.min + 1)));
  }
  st.w = credit(st.w, 'coins', coins, 'ADVENTURE_LOOT', st.ctx, enemyIds.join(','));
  run.coins += coins;
  giveExp(st, exp);
  st.a = { ...st.a, battlesWon: st.a.battlesWon + 1 };
  st.xp += AB.xp.battleWin;
  st.events.push({ type: 'ADVENTURE_BATTLE_WON', zoneId: run.zoneId, boss, enemies: enemies.length, exp, coins });
  if (boss) {
    const node = zoneOf(run).nodes[run.nodeIndex]!;
    if (node.type === 'boss') openChest(st, node.table, rng);
    run.nodeIndex += 1;
    finish(st, 'win');
  } else run.nodeIndex += 1;
}

function openChest(st: Step, tableId: string, rng: Rng) {
  const table = LOOT_TABLES[tableId];
  if (!table) return;
  const drawn = rollTable(rng, table);
  for (const [id, n] of Object.entries(drawn.items)) addCount(st.run.loot, id, n);
  st.w = credit(st.w, 'coins', drawn.coins, 'ADVENTURE_LOOT', st.ctx, tableId);
  st.w = credit(st.w, 'gems', drawn.gems, 'ADVENTURE_LOOT', st.ctx, tableId);
  st.run.coins += drawn.coins;
  st.run.gems += drawn.gems;
  st.events.push({ type: 'ADVENTURE_CHEST_OPENED', items: drawn.items, coins: drawn.coins, gems: drawn.gems });
}

function commit(st: Step) {
  return { ok: true as const, world: put(st.w, { ...st.a, run: st.run }), events: st.events, xp: st.xp };
}

const stepOf = (w: WorldSave, a: AdventureState, ctx: ActionContext): Step | null =>
  a.run ? { w, a, run: cloneData(a.run) as Run, events: [], xp: 0, ctx } : null;

/** Starts a run of `zoneId` with the fighters `keys` (1 to 3 creatures of `roster`): each pays the energy cost. */
export function startRun(world: WorldSave, args: { zoneId: string; keys: string[]; roster: readonly RosterEntry[] }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const zone = ZONES[args.zoneId];
    if (!zone) return { ok: false, error: 'INVALID_REQUEST' };
    if (worldLevel(w, WORLD_LEVELS) < zone.fromWorldLevel) return { ok: false, error: 'ZONE_LOCKED' };
    const keys = args.keys;
    if (keys.length < 1 || keys.length > AB.team.max || new Set(keys).size !== keys.length) return { ok: false, error: 'TEAM_INVALID' };
    const fighters = { ...a.fighters };
    const team: RunMember[] = [];
    for (const key of keys) {
      const entry = args.roster.find((r) => r.key === key);
      if (!entry) return { ok: false, error: 'TEAM_INVALID' };
      const archetype = archetypeOf(entry);
      const error: ErrorCode | null = whyNotReady(entry, fighters[key], ctx.now);
      if (error || !archetype) return { ok: false, error: error ?? 'NOT_A_FIGHTER' };
      const f = fighters[key] ?? newFighter(ctx.now);
      // The energy is spent now; what is left keeps refilling from this moment.
      fighters[key] = { ...f, energy: energyOf(f, ctx.now) - AB.run.energyCost, energyAt: ctx.now };
      team.push(memberOf(key, fighters[key]!, entry, archetype));
    }
    const run: Run = {
      zoneId: zone.id,
      seed: Math.floor(ctx.rng.next() * 2 ** 31),
      nodeIndex: 0,
      team,
      phase: 'map',
      battle: null,
      loot: {},
      coins: 0,
      gems: 0,
      expGained: 0,
      levelUps: [],
      lastEvent: null,
      log: [],
      result: null,
      startedAt: ctx.now,
    };
    return { ok: true, world: put(w, { ...a, fighters, run }), events: [{ type: 'ADVENTURE_RUN_STARTED', zoneId: zone.id, team: keys }] };
  });
}

/** The party steps up to the next node: a fight starts, a chest opens, a small event happens. */
export function enterNode(world: WorldSave, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    const st = stepOf(w, a, ctx);
    if (!st) return { ok: false, error: 'NO_RUN' };
    const { run } = st;
    if (run.phase !== 'map') return { ok: false, error: 'WRONG_PHASE' };
    const zone = zoneOf(run);
    const node = zone.nodes[run.nodeIndex];
    if (!node) return { ok: false, error: 'WRONG_PHASE' };
    const rng = mulberry32(hashSeed('node', run.seed, run.nodeIndex));
    run.lastEvent = null;
    run.log = [];
    if (node.type === 'chest') {
      openChest(st, node.table, rng);
      run.nodeIndex += 1;
    } else if (node.type === 'event') {
      const event = EVENTS[node.events[Math.floor(rng.next() * node.events.length)]!]!;
      for (const m of run.team) {
        if (m.hp <= 0) continue;
        if (event.healPct > 0) m.hp = Math.min(m.stats.hp, m.hp + Math.round(m.stats.hp * event.healPct));
        if (event.damagePct > 0) m.hp = Math.max(1, m.hp - Math.round(m.stats.hp * event.damagePct));
      }
      giveExp(st, event.exp);
      if (event.table && LOOT_TABLES[event.table]) {
        const drawn = rollTable(rng, LOOT_TABLES[event.table]!);
        for (const [id, n] of Object.entries(drawn.items)) addCount(run.loot, id, n);
      }
      run.lastEvent = event.id;
      st.events.push({ type: 'ADVENTURE_EVENT', eventId: event.id });
      run.nodeIndex += 1;
    } else {
      const ids = node.type === 'boss' ? node.enemies : pickGroup(rng, node.pool);
      const boss = node.type === 'boss';
      const fighters = [...run.team.map(allyInit), ...enemyInits(ids)];
      const started = startBattle(hashSeed('battle', run.seed, run.nodeIndex), fighters, COMBAT_CONTEXT);
      const events = [...started.events];
      const battle = playEnemies(started.state, events);
      run.log = events;
      st.events.push({ type: 'ADVENTURE_BATTLE_STARTED', boss });
      if (battle.outcome) settleBattle(st, battle, boss, ids, rng);
      else {
        run.phase = 'battle';
        run.battle = battle;
      }
    }
    return commit(st);
  });
}

const STEP_ERRORS: Record<string, ErrorCode> = {
  BATTLE_OVER: 'WRONG_PHASE',
  BAD_TARGET: 'INVALID_REQUEST',
  SKILL_UNAVAILABLE: 'SKILL_UNAVAILABLE',
  NOT_ENOUGH_ENERGY: 'NOT_ENOUGH_ENERGY',
  ON_COOLDOWN: 'ON_COOLDOWN',
  UNKNOWN_ITEM: 'INVALID_REQUEST',
};

/** The enemies of the battle node the run stands at. */
function battleEnemyIds(run: Run): readonly string[] {
  return (run.battle?.combatants ?? []).filter((c) => c.side === 'enemy').map((c) => enemyIdOf(c.id));
}

/**
 * The current ally does `action` (or 'auto': what the AI would pick); the enemies then answer until it is an ally's turn.
 * An item costs one from the bag. The battle's end settles the node.
 */
export function battleAct(world: WorldSave, args: { action: BattleAction | 'auto' }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    const st = stepOf(w, a, ctx);
    if (!st) return { ok: false, error: 'NO_RUN' };
    const { run } = st;
    if (run.phase !== 'battle' || !run.battle || run.battle.outcome) return { ok: false, error: 'WRONG_PHASE' };
    const cur = current(run.battle);
    if (!cur || cur.side !== 'ally') return { ok: false, error: 'NOT_YOUR_TURN' };
    const action = args.action === 'auto' ? chooseAction(run.battle, COMBAT_CONTEXT) : args.action;
    if (!action) return { ok: false, error: 'WRONG_PHASE' };
    if (action.kind === 'item') {
      if (!BATTLE_ITEMS[action.itemId]) return { ok: false, error: 'INVALID_REQUEST' };
      if (countOf(w, action.itemId) < 1) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    }
    const r = act(run.battle, action, COMBAT_CONTEXT);
    if (!r.ok) return { ok: false, error: STEP_ERRORS[r.error] ?? 'INVALID_REQUEST' };
    const events = [...r.events];
    const enemyIds = battleEnemyIds(run);
    const battle = playEnemies(r.state, events);
    if (action.kind === 'item') {
      const taken = take(st.w, action.itemId, 1);
      if (!taken.ok) return taken;
      st.w = taken.world;
      st.events.push({ type: 'ADVENTURE_ITEM_USED', itemId: action.itemId });
    }
    run.log = events;
    if (battle.outcome) {
      const boss = zoneOf(run).nodes[run.nodeIndex]?.type === 'boss';
      settleBattle(st, battle, boss, enemyIds, mulberry32(hashSeed('drops', run.seed, run.nodeIndex)));
    } else run.battle = battle;
    return commit(st);
  });
}

/** Leaves the zone between two nodes: what was found is kept, nobody is exhausted. */
export function retreat(world: WorldSave, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    const st = stepOf(w, a, ctx);
    if (!st) return { ok: false, error: 'NO_RUN' };
    if (st.run.phase !== 'map') return { ok: false, error: 'WRONG_PHASE' };
    finish(st, 'retreat');
    return commit(st);
  });
}

/** The summary of a finished run is read; the run is cleared. */
export function closeRun(world: WorldSave, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (!a.run) return { ok: false, error: 'NO_RUN' };
    if (a.run.phase !== 'done') return { ok: false, error: 'WRONG_PHASE' };
    return { ok: true, world: put(w, { ...a, run: null }), events: [] };
  });
}
