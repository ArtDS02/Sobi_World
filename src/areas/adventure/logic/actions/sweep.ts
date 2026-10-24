// A quick trip through a cleared zone (spec §2 "Đi nhanh"): the party pays its energy as for a trip and brings back a share of what
// the zone's normal groups and guardians give — experience, coins, drops — without walking. No treasure chest, no boss, no risk. The
// summary waits like a trip's.
import { hashSeed, mulberry32 } from '../../../../core/rng';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { AB, ENEMIES, MAPS, ZONES } from '../config/content';
import { addCount } from '../encounter';
import { credit, runAdventure, type AdventureResult } from './kit';
import { chargeParty, type PartyArgs } from './start';
import { commit, freshRun, giveExp, groupEnemies, type Step } from './trip';

export function sweepZone(world: WorldSave, args: PartyArgs & { zoneId: string }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const zone = ZONES[args.zoneId];
    if (!zone) return { ok: false, error: 'INVALID_REQUEST' };
    if (!a.cleared[zone.id]) return { ok: false, error: 'ZONE_NOT_CLEARED' };
    const party = chargeParty(w, a, args, ctx);
    if (!party.ok) return party;
    const seed = Math.floor(ctx.rng.next() * 2 ** 31);
    const first = MAPS[zone.maps[0]!]!;
    const run = freshRun({ zoneId: zone.id, mapId: first.id, x: 0, y: 0, seed, team: party.team, prep: party.prep, startedAt: ctx.now });
    const st: Step = { w: party.world, a: { ...a, fighters: party.fighters }, run, events: [{ type: 'ADVENTURE_RUN_STARTED', zoneId: zone.id, team: args.keys, prep: party.prep }], xp: 0, ctx };
    const rng = mulberry32(hashSeed('sweep', seed));
    const share = AB.sweep.share;
    let exp = 0;
    let coins = 0;
    for (const mapId of zone.maps) {
      const map = MAPS[mapId]!;
      for (const g of map.groups) {
        if (g.kind === 'boss') continue;
        for (const id of groupEnemies(seed, mapId, g)) {
          const e = ENEMIES[id]!;
          exp += e.exp * share;
          coins += e.coins * share;
          for (const d of e.drops) if (rng.next() < d.chance * share) addCount(run.loot, d.itemId, d.min + Math.floor(rng.next() * (d.max - d.min + 1)));
        }
      }
    }
    coins = Math.round(coins);
    st.w = credit(st.w, 'coins', coins, 'ADVENTURE_LOOT', ctx, `sweep:${zone.id}`);
    run.coins = coins;
    giveExp(st, Math.round(exp));
    run.phase = 'done';
    run.result = 'sweep';
    const pending = { ...st.a.pending };
    for (const [id, n] of Object.entries(run.loot)) addCount(pending, id, n);
    st.a = { ...st.a, pending };
    st.events.push({ type: 'ADVENTURE_SWEPT', zoneId: zone.id, exp: Math.round(exp), coins });
    st.events.push({ type: 'ADVENTURE_RUN_ENDED', zoneId: zone.id, result: 'sweep' });
    return commit(st);
  });
}
