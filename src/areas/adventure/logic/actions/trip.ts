// What every step of a trip shares (spec §2): a working copy of the world, the slice and the trip; experience and SP to the team; the
// end of a trip (loot to the pile, Rage kept, exhaustion on a loss); which portals are lit; the enemies a group of the map is made of.
import { cloneData } from '../../../../core/clone';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { hashSeed, mulberry32 } from '../../../../core/rng';
import { worldLevel } from '../../../../core/progression/levels';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { addExp } from '../../../../systems/combat/stats';
import type { Vec } from '../../../../systems/character';
import { canStand } from '../../../../systems/character';
import { AB, HOUR_MS, LEVEL_RULES, MAPS, ZONES, type AreaMap, type MapGroup } from '../config/content';
import { addCount, pickGroup } from '../encounter';
import type { AdventureEvent } from '../events';
import { walkableOf } from '../maps';
import type { AdventureState, Fighter, Run } from '../state';
import { put, type Body } from './kit';

/** Working copy of one step: the world, the slice, the trip, what happened and the XP earned. */
export interface Step {
  w: WorldSave;
  a: AdventureState;
  run: Run;
  events: AdventureEvent[];
  xp: number;
  ctx: ActionContext;
}

export const stepOf = (w: WorldSave, a: AdventureState, ctx: ActionContext): Step | null =>
  a.run ? { w, a, run: cloneData(a.run) as Run, events: [], xp: 0, ctx } : null;

export function commit(st: Step): Body {
  return { ok: true, world: put(st.w, { ...st.a, run: st.run }), events: st.events, xp: st.xp };
}

export function setFighter(st: Step, key: string, patch: Partial<Fighter>) {
  const f = st.a.fighters[key];
  if (f) st.a = { ...st.a, fighters: { ...st.a.fighters, [key]: { ...f, ...patch } } };
}

/** Experience to every member of the team (a knocked-out one gets half), with the level-ups and their SP. */
export function giveExp(st: Step, exp: number) {
  if (exp <= 0) return;
  st.run.expGained += exp;
  for (const m of st.run.team) {
    const f = st.a.fighters[m.key];
    if (!f) continue;
    const next = addExp(f.level, f.exp, m.hp > 0 ? exp : exp / 2, LEVEL_RULES);
    setFighter(st, m.key, { level: next.level, exp: next.exp, sp: f.sp + next.levelsGained * AB.sp.perLevel });
    if (next.levelsGained > 0) {
      if (!st.run.levelUps.includes(m.key)) st.run.levelUps.push(m.key);
      st.events.push({ type: 'ADVENTURE_LEVEL_UP', key: m.key, name: m.name, level: next.level });
    }
  }
}

/** The trip is over: its loot waits in the pile, Rage is kept on each fighter; a lost trip exhausts the party. */
export function finish(st: Step, result: 'win' | 'lose' | 'retreat') {
  const { run } = st;
  run.phase = 'done';
  run.result = result;
  run.battle = null;
  run.fighting = null;
  const pending = { ...st.a.pending };
  for (const [id, n] of Object.entries(run.loot)) addCount(pending, id, n);
  st.a = { ...st.a, pending };
  for (const m of run.team) setFighter(st, m.key, { rage: m.rage });
  if (result === 'win') st.a = { ...st.a, runsCleared: st.a.runsCleared + 1 };
  if (result === 'lose') {
    st.a = { ...st.a, runsLost: st.a.runsLost + 1 };
    const until = st.ctx.now + AB.run.exhaustHours * HOUR_MS;
    for (const m of run.team) setFighter(st, m.key, { exhaustedUntil: until });
    st.events.push({ type: 'ADVENTURE_EXHAUSTED', keys: run.team.map((m) => m.key) });
  }
  st.events.push({ type: 'ADVENTURE_RUN_ENDED', zoneId: run.zoneId, result });
}

/** Is the zone open to this world: its level and the zone before it beaten. */
export function zoneOpen(w: WorldSave, a: AdventureState, zoneId: string): boolean {
  const zone = ZONES[zoneId];
  if (!zone) return false;
  if (worldLevel(w, WORLD_LEVELS) < zone.fromWorldLevel) return false;
  return !zone.requiresCleared || !!a.cleared[zone.requiresCleared];
}

/** Is the portal of an area lit: the entrance of an open zone, or an area whose guardian / boss has fallen. */
export function portalLit(w: WorldSave, a: AdventureState, mapId: string): boolean {
  const map = MAPS[mapId];
  const zone = map ? ZONES[map.zoneId] : undefined;
  if (!map || !zone || !zoneOpen(w, a, zone.id)) return false;
  return zone.maps[0] === mapId || a.activePortals.includes(mapId);
}

export const groupKey = (mapId: string, groupId: string) => `${mapId}/${groupId}`;

/** The enemies a group of the map is made of on this trip (the same each time it is met, so its icons never lie). */
export const groupEnemies = (seed: number, mapId: string, g: MapGroup): readonly string[] => pickGroup(mulberry32(hashSeed('group', seed, mapId, g.id)), g.pool);

/** The gates open in this world. */
export const openedGates = (a: AdventureState): ReadonlySet<string> => new Set(a.openedGates);

/** Puts the walker at `pos` on the trip's area, or false when nobody can stand there. */
export function placeAt(st: Step, map: AreaMap, pos: Vec & { facing?: Run['facing'] }): boolean {
  if (!canStand(pos, walkableOf(map, openedGates(st.a)))) return false;
  st.run.x = pos.x;
  st.run.y = pos.y;
  if (pos.facing) st.run.facing = pos.facing;
  return true;
}
