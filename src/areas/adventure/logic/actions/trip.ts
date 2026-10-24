// What every step of a trip shares (spec §2): a working copy of the world, the slice and the trip; experience and SP to the team; the
// end of a trip (loot to the pile, Rage kept, exhaustion on a loss); which portals are lit; the enemies a group of the map is made of.
import { cloneData } from '../../../../core/clone';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { hashSeed, mulberry32 } from '../../../../core/rng';
import { worldLevel } from '../../../../core/progression/levels';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { addExp } from '../../../../systems/combat/stats';
import type { BattleEvent, BattleState } from '../../../../systems/combat/types';
import type { Vec } from '../../../../systems/character';
import { canStand } from '../../../../systems/character';
import { AB, HOUR_MS, LEVEL_RULES, MAPS, ZONES, type AreaMap, type MapGroup } from '../config/content';
import { pickQuip, titlesOf, type QuipTrigger } from '../bonds';
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

/** A new trip with nothing done yet: full of what `fields` give, everything else empty. */
export function freshRun(fields: Pick<Run, 'zoneId' | 'mapId' | 'x' | 'y' | 'seed' | 'team' | 'prep' | 'startedAt'> & { rift?: Run['rift'] }): Run {
  return {
    facing: 'down',
    phase: 'explore',
    battle: null,
    fighting: null,
    encounters: 0,
    defeated: [],
    harvested: [],
    springs: [],
    blessings: {},
    graceUntil: null,
    loot: {},
    coins: 0,
    gems: 0,
    expGained: 0,
    spGained: 0,
    levelUps: [],
    lastEvent: null,
    log: [],
    bossBeaten: false,
    result: null,
    rift: null,
    ...fields,
  };
}

export function commit(st: Step): Body {
  return { ok: true, world: put(st.w, { ...st.a, run: st.run }), events: st.events, xp: st.xp };
}

export function setFighter(st: Step, key: string, patch: Partial<Fighter>) {
  const f = st.a.fighters[key];
  if (f) st.a = { ...st.a, fighters: { ...st.a.fighters, [key]: { ...f, ...patch } } };
}

/** HP, MP and Rage of the team as the battle left them. */
export function carryOver(st: Step, battle: BattleState) {
  for (const m of st.run.team) {
    const c = battle.combatants.find((x) => x.id === m.key);
    if (!c) continue;
    m.hp = c.hp;
    m.mp = c.mp;
    m.rage = c.rage;
  }
}

/** A team member says something about the moment (`always` = it surely speaks; else only now and then). */
export function speak(st: Step, trigger: QuipTrigger, always: boolean, only?: string) {
  const team = only ? st.run.team.filter((m) => m.key === only) : st.run.team;
  const q = pickQuip(team, trigger, hashSeed('speak', st.run.seed, st.run.encounters, st.events.length), always);
  if (q) st.events.push({ type: 'ADVENTURE_QUIP', key: q.key, name: q.name, lineage: q.lineage, trigger, n: q.n });
}

/** After a won battle: a fighter left very low says so; else someone may cheer (always after a boss, a guardian or a golden group). */
export function cheer(st: Step, big: boolean) {
  const low = st.run.team.find((m) => m.hp > 0 && m.hp / m.stats.hp < 0.3);
  if (low) speak(st, 'lowVi', true, low.key);
  else speak(st, big ? 'bossVi' : 'winVi', big);
}

/** `patch` applied to the feats of every member; a title it newly earns is announced. */
export function updateFeats(st: Step, patch: (feats: Fighter['feats'], key: string) => Fighter['feats'] | null) {
  for (const m of st.run.team) {
    const f = st.a.fighters[m.key];
    if (!f) continue;
    const feats = patch(f.feats, m.key);
    if (!feats) continue;
    const before = new Set(titlesOf(f).map((t) => t.id));
    setFighter(st, m.key, { feats });
    announceTitles(st, m.key, m.name, before);
  }
}

/** The titles a fighter holds now that it did not hold in `before` (several fighters earning one title in a step share one event). */
export function announceTitles(st: Step, key: string, name: string, before: ReadonlySet<string>) {
  const f = st.a.fighters[key];
  if (!f) return;
  for (const t of titlesOf(f)) {
    if (before.has(t.id)) continue;
    const same = st.events.find((e) => e.type === 'ADVENTURE_TITLE_EARNED' && e.titleId === t.id);
    if (same?.type === 'ADVENTURE_TITLE_EARNED') same.name = `${same.name}, ${name}`;
    else st.events.push({ type: 'ADVENTURE_TITLE_EARNED', key, name, titleId: t.id });
  }
}

/** The best hit and the Ultimates of the team in these battle events. */
export function recordFeats(st: Step, events: readonly BattleEvent[]) {
  const best = new Map<string, number>();
  const ultimates = new Map<string, number>();
  for (const e of events) {
    if (e.type === 'damage') best.set(e.actor, Math.max(best.get(e.actor) ?? 0, e.amount));
    else if (e.type === 'use' && e.ultimate) ultimates.set(e.actor, (ultimates.get(e.actor) ?? 0) + 1);
  }
  if (best.size === 0 && ultimates.size === 0) return;
  updateFeats(st, (feats, key) => {
    const hit = best.get(key) ?? 0;
    const ult = ultimates.get(key) ?? 0;
    if (hit <= feats.bestHit && ult === 0) return null;
    return { ...feats, bestHit: Math.max(feats.bestHit, hit), ultimates: feats.ultimates + ult };
  });
}

/** Experience to every member of the team (a knocked-out one gets half), with the level-ups and their SP. */
export function giveExp(st: Step, exp: number) {
  if (exp <= 0) return;
  st.run.expGained += exp;
  let leveled: string | null = null;
  for (const m of st.run.team) {
    const f = st.a.fighters[m.key];
    if (!f) continue;
    const next = addExp(f.level, f.exp, m.hp > 0 ? exp : exp / 2, LEVEL_RULES);
    setFighter(st, m.key, { level: next.level, exp: next.exp, sp: f.sp + next.levelsGained * AB.sp.perLevel });
    if (next.levelsGained > 0) {
      if (!st.run.levelUps.includes(m.key)) st.run.levelUps.push(m.key);
      st.events.push({ type: 'ADVENTURE_LEVEL_UP', key: m.key, name: m.name, level: next.level });
      leveled ??= m.key;
    }
  }
  if (leveled) speak(st, 'levelUpVi', true, leveled);
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
  if (result === 'win' && !run.rift) st.a = { ...st.a, runsCleared: st.a.runsCleared + 1 };
  if (result === 'lose') {
    st.a = { ...st.a, runsLost: st.a.runsLost + 1 };
    const until = st.ctx.now + AB.run.exhaustHours * HOUR_MS;
    for (const m of run.team) setFighter(st, m.key, { exhaustedUntil: until });
    st.events.push({ type: 'ADVENTURE_EXHAUSTED', keys: run.team.map((m) => m.key) });
  }
  st.events.push({ type: 'ADVENTURE_RUN_ENDED', zoneId: run.zoneId, result, ...(run.rift ? { rift: true } : {}) });
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
