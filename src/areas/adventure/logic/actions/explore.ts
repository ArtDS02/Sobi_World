// Walking an area (spec §3): saving where the walker stands, touching a group (a battle), using a thing with Space (treasure chest,
// resource spot, element gate, spring, traveller, lore stone, Guardian shrine), the portals between lit areas, the exits between areas,
// and going back to the camp. Every action takes the walker's position, checked against the grid: a thing is used only within reach.
import type { ErrorCode } from '../../../../core/config/errors';
import { hashSeed, mulberry32 } from '../../../../core/rng';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import type { Vec } from '../../../../systems/character';
import { startBattle } from '../../../../systems/combat';
import { AB, COMBAT_CONTEXT, ENGAGEMENT, EVENTS, LOOT_TABLES, MAPS, ZONES, type AreaMap } from '../config/content';
import { addCount, enemyInits, playEnemies, rollTable } from '../encounter';
import { allyInit } from '../fighters';
import { distanceToThing, groupDistance, thingsOf, tileCenter } from '../maps';
import type { Run } from '../state';
import { autoBattle, groupAffix, quickWinnable, teamLevel, withAffix } from '../variants';
import { credit, put, runAdventure, type AdventureResult } from './kit';
import { settleBattle } from './battle';
import { commit, finish, giveExp, groupEnemies, groupKey, placeAt, portalLit, recordFeats, speak, stepOf, type Step } from './trip';

export type Position = Vec & { facing?: Run['facing'] | undefined };

type Walk = (st: Step, map: AreaMap) => { ok: true } | { ok: false; error: ErrorCode };
const fail = (error: ErrorCode) => ({ ok: false as const, error });

/** Runs `body` on the trip while the party walks, after placing the walker at `pos`. */
function onFoot(world: WorldSave, pos: Position | null, ctx: ActionContext, body: Walk): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    const st = stepOf(w, a, ctx);
    if (!st) return { ok: false, error: 'NO_RUN' };
    if (st.run.phase === 'battle') return { ok: false, error: 'IN_BATTLE' };
    if (st.run.phase !== 'explore') return { ok: false, error: 'WRONG_PHASE' };
    // A Rift trip has no map to walk; only going back to the camp (no position) is open.
    if (st.run.rift && pos) return { ok: false, error: 'WRONG_PHASE' };
    const map = MAPS[st.run.mapId];
    if (!map) return { ok: false, error: 'INVALID_REQUEST' };
    if (pos && !placeAt(st, map, pos)) return { ok: false, error: 'BLOCKED' };
    const r = body(st, map);
    if (!r.ok) return r;
    return commit(st);
  });
}

const here = (st: Step): Vec => ({ x: st.run.x, y: st.run.y });

/** The walker stopped here (saved so a reload puts it back). */
export function moveTo(world: WorldSave, args: Position, ctx: ActionContext): AdventureResult {
  return onFoot(world, args, ctx, (st) => {
    st.events.push({ type: 'ADVENTURE_MOVED', mapId: st.run.mapId });
    return { ok: true };
  });
}

/**
 * The walker touched a group: the battle starts (the enemies that act before the party already did). A normal group far weaker than
 * the team is beaten at once when the AI of both sides wins it (`quick`, on by default; decision 039); else it is played.
 */
export function engage(world: WorldSave, args: Position & { groupId: string; quick?: boolean | undefined }, ctx: ActionContext): AdventureResult {
  return onFoot(world, args, ctx, (st, map) => {
    const { run } = st;
    const g = map.groups.find((x) => x.id === args.groupId);
    if (!g) return fail('INVALID_REQUEST');
    const key = groupKey(map.id, g.id);
    if (run.defeated.includes(key)) return fail('ALREADY_OPENED');
    if (run.graceUntil !== null && ctx.now < run.graceUntil) return fail('TOO_FAR');
    if (groupDistance(map, g, here(st)) > AB.explore.touch + map.tile) return fail('TOO_FAR');
    const ids = groupEnemies(run.seed, map.id, g);
    const affix = groupAffix(run.seed, map.id, g);
    run.encounters += 1;
    const seed = hashSeed('battle', run.seed, key, run.encounters);
    const fighters = [...run.team.map((m) => allyInit(m, run.blessings)), ...withAffix(enemyInits(ids), affix)];
    run.lastEvent = null;
    run.fighting = key;
    run.graceUntil = null;
    const level = teamLevel(run.team, (key) => st.a.fighters[key]?.level ?? 1);
    if (args.quick !== false && quickWinnable(run.team, level, ZONES[map.zoneId]?.levels[1] ?? Infinity, ids, g, affix)) {
      const sim = autoBattle(seed, fighters);
      if (sim.state.outcome === 'win') {
        run.log = [];
        recordFeats(st, sim.events);
        settleBattle(st, sim.state, ENGAGEMENT.quickWin.share);
        return { ok: true };
      }
    }
    const started = startBattle(seed, fighters, COMBAT_CONTEXT);
    const events = [...started.events];
    const battle = playEnemies(started.state, events);
    run.log = events;
    st.events.push({ type: 'ADVENTURE_BATTLE_STARTED', boss: g.kind === 'boss', elite: g.kind === 'elite', affix: affix?.id ?? null });
    run.phase = 'battle';
    run.battle = battle;
    recordFeats(st, events);
    if (battle.outcome) settleBattle(st, battle);
    return { ok: true };
  });
}

function rollInto(st: Step, tableId: string, seedParts: (string | number)[]): { items: Record<string, number>; coins: number; gems: number } {
  const table = LOOT_TABLES[tableId];
  if (!table) return { items: {}, coins: 0, gems: 0 };
  const drawn = rollTable(mulberry32(hashSeed('loot', st.run.seed, ...seedParts)), table);
  for (const [id, n] of Object.entries(drawn.items)) addCount(st.run.loot, id, n);
  st.w = credit(st.w, 'coins', drawn.coins, 'ADVENTURE_LOOT', st.ctx, tableId);
  st.w = credit(st.w, 'gems', drawn.gems, 'ADVENTURE_LOOT', st.ctx, tableId);
  st.run.coins += drawn.coins;
  st.run.gems += drawn.gems;
  return drawn;
}

/** Space on a thing within reach: what it does depends on what it is. */
export function interact(world: WorldSave, args: Position & { id: string }, ctx: ActionContext): AdventureResult {
  return onFoot(world, args, ctx, (st, map) => {
    const { run } = st;
    const thing = thingsOf(map).find((t) => t.id === args.id);
    if (!thing || thing.kind === 'exit' || thing.kind === 'portal') return fail('INVALID_REQUEST');
    if (distanceToThing(map, here(st), thing) > AB.explore.reach) return fail('TOO_FAR');
    const spotKey = groupKey(map.id, thing.id);
    switch (thing.kind) {
      case 'chest': {
        if (st.a.openedChests.includes(thing.id)) return fail('ALREADY_OPENED');
        const chest = map.chests.find((c) => c.id === thing.id)!;
        const drawn = rollInto(st, chest.table, ['chest', thing.id]);
        st.a = { ...st.a, openedChests: [...st.a.openedChests, thing.id] };
        st.events.push({ type: 'ADVENTURE_CHEST_OPENED', items: drawn.items, coins: drawn.coins, gems: drawn.gems, treasure: true });
        speak(st, 'chestVi', true);
        break;
      }
      case 'node': {
        if (run.harvested.includes(spotKey)) return fail('ALREADY_OPENED');
        const node = map.nodes.find((n) => n.id === thing.id)!;
        const drawn = rollInto(st, node.table, ['node', spotKey, run.encounters]);
        run.harvested.push(spotKey);
        st.events.push({ type: 'ADVENTURE_HARVESTED', items: drawn.items });
        break;
      }
      case 'gate': {
        if (st.a.openedGates.includes(thing.id)) return fail('ALREADY_OPENED');
        const gate = map.gates.find((g) => g.id === thing.id)!;
        const opener = run.team.find((m) => m.hp > 0 && (m.element === gate.element || m.element2 === gate.element));
        if (!opener) return fail('GATE_NEEDS_ELEMENT');
        st.a = { ...st.a, openedGates: [...st.a.openedGates, thing.id] };
        st.events.push({ type: 'ADVENTURE_GATE_OPENED', gateId: thing.id, element: gate.element, by: opener.key });
        break;
      }
      case 'spring': {
        if (run.springs.includes(map.id)) return fail('SPRING_USED');
        for (const m of run.team) {
          m.hp = Math.min(m.stats.hp, m.hp + Math.round(m.stats.hp * AB.explore.springPct));
          m.mp = Math.min(m.stats.mp, m.mp + Math.round(m.stats.mp * AB.explore.springPct));
        }
        run.springs.push(map.id);
        st.events.push({ type: 'ADVENTURE_SPRING', mapId: map.id });
        break;
      }
      case 'npc': {
        if (run.harvested.includes(spotKey)) return fail('ALREADY_OPENED');
        const npc = map.npcs.find((n) => n.id === thing.id)!;
        const event = EVENTS[npc.event]!;
        for (const m of run.team) {
          if (m.hp <= 0) continue;
          if (event.healPct > 0) m.hp = Math.min(m.stats.hp, m.hp + Math.round(m.stats.hp * event.healPct));
          if (event.damagePct > 0) m.hp = Math.max(1, m.hp - Math.round(m.stats.hp * event.damagePct));
        }
        giveExp(st, event.exp);
        if (event.table) rollInto(st, event.table, ['npc', spotKey]);
        run.harvested.push(spotKey);
        st.events.push({ type: 'ADVENTURE_EVENT', eventId: event.id });
        break;
      }
      case 'lore': {
        if (st.a.loreFound.includes(thing.id)) return fail('ALREADY_OPENED');
        st.a = { ...st.a, loreFound: [...st.a.loreFound, thing.id] };
        st.events.push({ type: 'ADVENTURE_LORE_FOUND', loreId: thing.id });
        break;
      }
      case 'shrine': {
        const shrine = map.shrine!;
        if (run.harvested.includes(spotKey)) return fail('ALREADY_OPENED');
        run.blessings = { ...run.blessings, [shrine.element]: (run.blessings[shrine.element] ?? 0) + shrine.damagePct };
        run.harvested.push(spotKey);
        st.events.push({ type: 'ADVENTURE_SHRINE_BLESSED', element: shrine.element, pct: shrine.damagePct });
        break;
      }
    }
    run.lastEvent = { kind: thing.kind, id: thing.id };
    return { ok: true };
  });
}

/** Through the lit portal of this area to another lit portal (any zone), or back to the camp (`to: 'camp'`). */
export function travel(world: WorldSave, args: Position & { to: string }, ctx: ActionContext): AdventureResult {
  return onFoot(world, args, ctx, (st, map) => {
    const portal = thingsOf(map).find((t) => t.kind === 'portal')!;
    if (distanceToThing(map, here(st), portal) > AB.explore.reach) return fail('TOO_FAR');
    if (!portalLit(st.w, st.a, map.id)) return fail('PORTAL_INACTIVE');
    if (args.to === 'camp') {
      finish(st, st.run.bossBeaten ? 'win' : 'retreat');
      return { ok: true };
    }
    const dest = MAPS[args.to];
    if (!dest || dest.id === map.id || !portalLit(st.w, st.a, dest.id)) return fail('PORTAL_INACTIVE');
    const at = tileCenter(dest, dest.spawn.x, dest.spawn.y);
    st.run.mapId = dest.id;
    st.run.zoneId = dest.zoneId;
    st.run.x = at.x;
    st.run.y = at.y;
    st.run.facing = 'down';
    st.run.lastEvent = { kind: 'portal', id: dest.id };
    st.events.push({ type: 'ADVENTURE_AREA_ENTERED', mapId: dest.id, via: 'portal' });
    return { ok: true };
  });
}

/** Walking out by an exit: the party arrives in the next (or previous) area of the zone. */
export function takeExit(world: WorldSave, args: Position & { exitId: string }, ctx: ActionContext): AdventureResult {
  return onFoot(world, args, ctx, (st, map) => {
    const exit = map.exits.find((e) => e.id === args.exitId);
    if (!exit) return fail('INVALID_REQUEST');
    if (distanceToThing(map, here(st), exit) > map.tile) return fail('TOO_FAR');
    const dest = MAPS[exit.to];
    if (!dest || !ZONES[dest.zoneId]) return fail('INVALID_REQUEST');
    const at = tileCenter(dest, exit.arriveX, exit.arriveY);
    st.run.mapId = dest.id;
    st.run.zoneId = dest.zoneId;
    st.run.x = at.x;
    st.run.y = at.y;
    st.run.facing = exit.x === 0 ? 'left' : 'right';
    st.events.push({ type: 'ADVENTURE_AREA_ENTERED', mapId: dest.id, via: 'exit' });
    return { ok: true };
  });
}

/** Back to the camp from anywhere outside a battle (no penalty, spec §2): a trip that beat its boss counts as a win. */
export function returnToCamp(world: WorldSave, ctx: ActionContext): AdventureResult {
  return onFoot(world, null, ctx, (st) => {
    finish(st, st.run.bossBeaten || (st.run.rift?.floor ?? 0) > 0 ? 'win' : 'retreat');
    return { ok: true };
  });
}

/** The tip of an area has been read (it shows once a save, decision 039). */
export function seeTip(world: WorldSave, args: { tipId: string }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (!ENGAGEMENT.tips.some((t) => t.id === args.tipId)) return { ok: false, error: 'INVALID_REQUEST' };
    if (a.tipsSeen.includes(args.tipId)) return { ok: false, error: 'ALREADY_OPENED' };
    return { ok: true, world: put(w, { ...a, tipsSeen: [...a.tipsSeen, args.tipId] }), events: [{ type: 'ADVENTURE_TIP_SEEN', tipId: args.tipId }] };
  });
}
