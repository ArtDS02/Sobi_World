// A battle on the trip (spec §14–§16): the current ally acts (or Auto chooses), the enemies answer; fleeing from a normal group; the end
// of a battle — HP, MP and Rage carry on, the rewards, the area's guardian lights its portal, the zone boss clears the zone (its chest,
// SP for every fighter's first time), a loss ends the trip.
import type { ErrorCode } from '../../../../core/config/errors';
import { hashSeed, mulberry32 } from '../../../../core/rng';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { act, chooseAction, current } from '../../../../systems/combat';
import type { BattleAction, BattleState } from '../../../../systems/combat/types';
import { AB, BATTLE_ITEMS, COMBAT_CONTEXT, ENEMIES, LOOT_TABLES, MAPS } from '../config/content';
import { addCount, enemyIdOf, playEnemies, rollTable } from '../encounter';
import { countOf, credit, runAdventure, take, type AdventureResult } from './kit';
import { commit, finish, giveExp, setFighter, stepOf, type Step } from './trip';

const STEP_ERRORS: Record<string, ErrorCode> = {
  BATTLE_OVER: 'WRONG_PHASE',
  BAD_TARGET: 'INVALID_REQUEST',
  SKILL_UNAVAILABLE: 'SKILL_UNAVAILABLE',
  SKILL_DISABLED: 'SKILL_DISABLED',
  NOT_ENOUGH_MP: 'NOT_ENOUGH_MP',
  ON_COOLDOWN: 'ON_COOLDOWN',
  ULTIMATE_NOT_READY: 'ULTIMATE_NOT_READY',
  UNKNOWN_ITEM: 'INVALID_REQUEST',
};

/** The group being fought: its map row and kind. */
function foughtGroup(st: Step) {
  const [mapId, groupId] = (st.run.fighting ?? '/').split('/');
  const map = MAPS[mapId ?? ''];
  return { map, group: map?.groups.find((g) => g.id === groupId) };
}

/** HP, MP and Rage of the team as the battle left them. */
function carryOver(st: Step, battle: BattleState) {
  for (const m of st.run.team) {
    const c = battle.combatants.find((x) => x.id === m.key);
    if (!c) continue;
    m.hp = c.hp;
    m.mp = c.mp;
    m.rage = c.rage;
  }
}

/** A battle has ended: its rewards on a win, the end of the trip on a loss. */
export function settleBattle(st: Step, battle: BattleState) {
  const { run } = st;
  const key = run.fighting;
  const { map, group } = foughtGroup(st);
  carryOver(st, battle);
  run.battle = null;
  run.phase = 'explore';
  run.fighting = null;
  if (battle.outcome === 'lose' || !map || !group || !key) {
    finish(st, 'lose');
    return;
  }
  const rng = mulberry32(hashSeed('drops', run.seed, key, run.encounters));
  const enemies = battle.combatants.filter((c) => c.side === 'enemy').map((c) => ENEMIES[enemyIdOf(c.id)]!);
  const exp = enemies.reduce((n, e) => n + e.exp, 0);
  const coins = enemies.reduce((n, e) => n + e.coins, 0);
  for (const e of enemies) for (const d of e.drops) if (rng.next() < d.chance) addCount(run.loot, d.itemId, d.min + Math.floor(rng.next() * (d.max - d.min + 1)));
  st.w = credit(st.w, 'coins', coins, 'ADVENTURE_LOOT', st.ctx, key);
  run.coins += coins;
  run.defeated.push(key);
  giveExp(st, exp);
  st.a = { ...st.a, battlesWon: st.a.battlesWon + 1 };
  st.xp += AB.xp.battleWin;
  const boss = group.kind === 'boss';
  const elite = group.kind === 'elite';
  st.events.push({ type: 'ADVENTURE_BATTLE_WON', zoneId: run.zoneId, boss, elite, enemies: enemies.length, exp, coins });
  if ((boss || elite) && !st.a.activePortals.includes(map.id)) {
    st.a = { ...st.a, activePortals: [...st.a.activePortals, map.id] };
    st.events.push({ type: 'ADVENTURE_PORTAL_ACTIVATED', mapId: map.id });
  }
  if (elite) run.lastEvent = { kind: 'elite', id: group.id };
  if (boss) {
    const zoneId = map.zoneId;
    const first = !st.a.cleared[zoneId];
    st.a = { ...st.a, cleared: { ...st.a.cleared, [zoneId]: (st.a.cleared[zoneId] ?? 0) + 1 } };
    run.bossBeaten = true;
    run.lastEvent = { kind: 'boss', id: group.id };
    st.xp += AB.xp.zoneClear;
    if (group.table && LOOT_TABLES[group.table]) {
      const drawn = rollTable(rng, LOOT_TABLES[group.table]!);
      for (const [id, n] of Object.entries(drawn.items)) addCount(run.loot, id, n);
      st.w = credit(st.w, 'coins', drawn.coins, 'ADVENTURE_LOOT', st.ctx, group.table);
      st.w = credit(st.w, 'gems', drawn.gems, 'ADVENTURE_LOOT', st.ctx, group.table);
      run.coins += drawn.coins;
      run.gems += drawn.gems;
      st.events.push({ type: 'ADVENTURE_CHEST_OPENED', items: drawn.items, coins: drawn.coins, gems: drawn.gems, treasure: false });
    }
    for (const m of run.team) {
      const f = st.a.fighters[m.key];
      if (!f || f.bossClears.includes(zoneId)) continue;
      setFighter(st, m.key, { sp: f.sp + AB.sp.bossFirstClear, bossClears: [...f.bossClears, zoneId] });
      run.spGained += AB.sp.bossFirstClear;
      st.events.push({ type: 'ADVENTURE_SP_GAINED', key: m.key, amount: AB.sp.bossFirstClear, why: 'boss' });
    }
    st.events.push({ type: 'ADVENTURE_ZONE_CLEARED', zoneId, first });
  }
}

/**
 * The current ally does `action` (or 'auto': what the AI would pick); the enemies then answer until it is an ally's turn. An item costs
 * one from the bag. The battle's end settles it.
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
    const battle = playEnemies(r.state, events);
    if (action.kind === 'item') {
      const taken = take(st.w, action.itemId, 1);
      if (!taken.ok) return taken;
      st.w = taken.world;
      st.events.push({ type: 'ADVENTURE_ITEM_USED', itemId: action.itemId });
    }
    run.log = events;
    if (battle.outcome) settleBattle(st, battle);
    else run.battle = battle;
    return commit(st);
  });
}

/** Running from a normal group (never from a guardian or a boss): the damage taken stays, the group stays, a short grace follows. */
export function flee(world: WorldSave, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    const st = stepOf(w, a, ctx);
    if (!st) return { ok: false, error: 'NO_RUN' };
    const { run } = st;
    if (run.phase !== 'battle' || !run.battle) return { ok: false, error: 'WRONG_PHASE' };
    if (foughtGroup(st).group?.kind !== 'normal') return { ok: false, error: 'CANNOT_FLEE' };
    carryOver(st, run.battle);
    run.battle = null;
    run.phase = 'explore';
    run.fighting = null;
    run.log = [];
    run.graceUntil = ctx.now + AB.explore.graceMs;
    st.events.push({ type: 'ADVENTURE_FLED' });
    return commit(st);
  });
}
