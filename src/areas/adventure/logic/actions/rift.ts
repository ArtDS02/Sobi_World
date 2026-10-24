// The Umbraflux Rift's trip (decision 039): the party enters (energy as for a zone), fights floor after floor (one battle each), rests a
// little between two, and leaves whenever it likes keeping what it won; a loss ends it like a lost trip. The best floor, the day's best
// and the Nightmare bosses beaten stay in the save; each fighter keeps its own deepest floor for its titles.
import { hashSeed, mulberry32 } from '../../../../core/rng';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { startBattle } from '../../../../systems/combat';
import type { BattleState } from '../../../../systems/combat/types';
import { AB, COMBAT_CONTEXT, LOOT_TABLES, RIFT, RIFT_RULES, ZONES } from '../config/content';
import { addCount, playEnemies, randInt, rollTable } from '../encounter';
import { floorReward, nightmareAt, riftAlly, riftDay, riftEnemies, riftOpen, ruleOfDay } from '../rift';
import { credit, put, runAdventure, type AdventureResult } from './kit';
import { chargeParty, type PartyArgs } from './start';
import { carryOver, cheer, commit, finish, freshRun, giveExp, recordFeats, stepOf, updateFeats, type Step } from './trip';

/** Into the Rift with the fighters `keys`, under the rule of today. */
export function startRift(world: WorldSave, args: PartyArgs, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    if (!riftOpen(a)) return { ok: false, error: 'ZONE_NOT_CLEARED' };
    const party = chargeParty(w, a, args, ctx);
    if (!party.ok) return party;
    const zone = ZONES[RIFT.requiresCleared]!;
    const rule = ruleOfDay(riftDay(ctx.now, ctx.dayOffsetMs));
    const run = freshRun({
      zoneId: zone.id,
      mapId: zone.maps.at(-1)!,
      x: 0,
      y: 0,
      seed: Math.floor(ctx.rng.next() * 2 ** 31),
      team: party.team,
      prep: party.prep,
      startedAt: ctx.now,
      rift: { floor: 0, ruleId: rule.id },
    });
    return { ok: true, world: put(party.world, { ...a, fighters: party.fighters, run }), events: [{ type: 'ADVENTURE_RIFT_STARTED', ruleId: rule.id, team: args.keys, prep: party.prep }] };
  });
}

/** The next floor's battle starts. */
export function riftNext(world: WorldSave, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    const st = stepOf(w, a, ctx);
    if (!st) return { ok: false, error: 'NO_RUN' };
    const { run } = st;
    if (!run.rift || run.phase !== 'explore') return { ok: false, error: 'WRONG_PHASE' };
    if (!run.team.some((m) => m.hp > 0)) return { ok: false, error: 'WRONG_PHASE' };
    const floor = run.rift.floor + 1;
    const rule = RIFT_RULES[run.rift.ruleId] ?? ruleOfDay(riftDay(ctx.now, ctx.dayOffsetMs));
    run.encounters += 1;
    const started = startBattle(hashSeed('rift-battle', run.seed, floor), [...run.team.map((m) => riftAlly(m, rule)), ...riftEnemies(run.seed, floor, rule)], COMBAT_CONTEXT);
    const events = [...started.events];
    const battle = playEnemies(started.state, events);
    run.log = events;
    run.lastEvent = null;
    run.fighting = `rift/${floor}`;
    run.phase = 'battle';
    run.battle = battle;
    st.events.push({ type: 'ADVENTURE_BATTLE_STARTED', boss: !!nightmareAt(floor), elite: false, rift: floor });
    recordFeats(st, events);
    if (battle.outcome) settleRiftFloor(st, battle);
    return commit(st);
  });
}

/** A floor's battle is over: a loss ends the trip; a win pays the floor, maybe a chest and a Nightmare's gems, then a short rest. */
export function settleRiftFloor(st: Step, battle: BattleState) {
  const { run } = st;
  const rift = run.rift!;
  carryOver(st, battle);
  run.battle = null;
  run.phase = 'explore';
  run.fighting = null;
  if (battle.outcome !== 'win') {
    finish(st, 'lose');
    return;
  }
  const floor = rift.floor + 1;
  run.rift = { ...rift, floor };
  const rng = mulberry32(hashSeed('rift-drops', run.seed, floor));
  const reward = floorReward(floor);
  let gems = 0;
  st.w = credit(st.w, 'coins', reward.coins, 'ADVENTURE_LOOT', st.ctx, `rift:${floor}`);
  run.coins += reward.coins;
  giveExp(st, reward.exp);
  const nightmare = nightmareAt(floor);
  const first = !!nightmare && !st.a.rift.nightmares.includes(nightmare.enemy);
  if (nightmare && first) {
    gems += randInt(rng, nightmare.gems);
    st.a = { ...st.a, rift: { ...st.a.rift, nightmares: [...st.a.rift.nightmares, nightmare.enemy] } };
  }
  if (floor % RIFT.chestEvery === 0 && LOOT_TABLES[RIFT.table]) {
    const drawn = rollTable(rng, LOOT_TABLES[RIFT.table]!);
    for (const [id, n] of Object.entries(drawn.items)) addCount(run.loot, id, n);
    st.w = credit(st.w, 'coins', drawn.coins, 'ADVENTURE_LOOT', st.ctx, RIFT.table);
    run.coins += drawn.coins;
    gems += drawn.gems;
    st.events.push({ type: 'ADVENTURE_CHEST_OPENED', items: drawn.items, coins: drawn.coins, gems: 0, treasure: true });
  }
  st.w = credit(st.w, 'gems', gems, 'ADVENTURE_LOOT', st.ctx, `rift:${floor}`);
  run.gems += gems;
  updateFeats(st, (feats) => ({
    ...feats,
    battles: feats.battles + 1,
    rift: Math.max(feats.rift, floor),
    nightmares: nightmare && !feats.nightmares.includes(nightmare.enemy) ? [...feats.nightmares, nightmare.enemy] : feats.nightmares,
  }));
  for (const m of run.team) {
    m.hp = Math.min(m.stats.hp, m.hp + Math.round(m.stats.hp * RIFT.restPct));
    m.mp = Math.min(m.stats.mp, m.mp + Math.round(m.stats.mp * RIFT.restPct));
  }
  const day = riftDay(st.ctx.now, st.ctx.dayOffsetMs);
  const best = floor > st.a.rift.best;
  st.a = {
    ...st.a,
    battlesWon: st.a.battlesWon + 1,
    rift: { ...st.a.rift, best: Math.max(st.a.rift.best, floor), day, dayBest: st.a.rift.day === day ? Math.max(st.a.rift.dayBest, floor) : floor },
  };
  st.xp += AB.xp.battleWin;
  const enemies = battle.combatants.filter((c) => c.side === 'enemy').length;
  st.events.push({ type: 'ADVENTURE_BATTLE_WON', zoneId: run.zoneId, boss: !!nightmare, elite: false, enemies, exp: reward.exp, coins: reward.coins, gems, rift: true });
  st.events.push({ type: 'ADVENTURE_RIFT_FLOOR', floor, coins: reward.coins, exp: reward.exp, gems, nightmare: nightmare?.enemy ?? null, first, best });
  cheer(st, !!nightmare);
}
