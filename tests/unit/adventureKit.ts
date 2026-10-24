// Shared fixtures of the Adventure V2 tests: a world with the Adventure open, a squad of roster entries, strong fighters, and a walk of a
// whole trip the way a player would (every group, the springs, the exits, home by the portal).
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { adventureArea } from '../../src/areas/adventure';
import { battleAct, closeReport, engage, interact, returnToCamp, takeExit } from '../../src/areas/adventure/logic/actions/run';
import { MAPS, ZONES } from '../../src/areas/adventure/logic/config/content';
import { newFighter } from '../../src/areas/adventure/logic/fighters';
import { reachableTiles, thingsOf, tileCenter } from '../../src/areas/adventure/logic/maps';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import type { Fighter } from '../../src/areas/adventure/logic/state';
import type { RosterEntry } from '../../src/core/area-registry/registry';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';

export const H = 3_600_000;
export const T0 = 20_000 * 86_400_000;
export const ctxAt = (now: number, seed = 7): ActionContext => ({ now, rng: mulberry32(seed) });
export const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};
export const err = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);

export const entry = (id: string, over: Partial<RosterEntry> = {}): RosterEntry => ({
  key: `sobi_farm:${id}`,
  areaId: 'sobi_farm',
  id,
  kind: 'pig',
  name: id,
  speciesId: 'PIG_KNIGHT',
  family: 'ADVENTURE',
  rarity: 'COMMON',
  hearts: 0,
  sick: false,
  adult: true,
  purpose: 'ADVENTURE',
  artId: 'pig_knight',
  ...over,
});

/** A Metal striker (knight), a Nature support (meadow sheep), a Metal tanker (job). */
export const squad = [entry('a'), entry('b', { speciesId: 'PIG_SHEEP', family: 'MEADOW' }), entry('c', { speciesId: 'PIG_CHEF', family: 'JOB' })];
export const keys = squad.map((e) => e.key);

/** A world with the adventure open at T0, a rich wallet (level 8 reached) and the given bag. */
export function adventureWorld(bag: Record<string, number> = {}): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt(T0));
  const rich = { ...fresh, progression: { ...fresh.progression, areas: { ...fresh.progression.areas, sobi_farm: { xp: 1_000_000 } } } };
  const opened = adventureArea.init(rich, ctxAt(T0));
  return { ...opened, wallet: { ...opened.wallet, coins: 100_000 }, inventory: { items: { ...bag } } };
}

/** The squad at `level` with fair gear. */
export function strong(world: WorldSave, level = 15, patch: Partial<Fighter> = {}): WorldSave {
  const a = adventureOf(world);
  const fighters = { ...a.fighters };
  for (const e of squad) fighters[e.key] = { ...newFighter(T0), level, sp: 0, loadout: { weapon: 'item_equip_iron_sword', armor: 'item_equip_bark_armor', charm: 'item_equip_wind_feather' }, ...patch };
  return withAdventure(world, { ...a, fighters });
}

/** A walkable tile next to a thing (or on an exit), reachable from the spawn with the gates open now. */
export function standBy(w: WorldSave, mapId: string, thingId: string): { x: number; y: number } {
  const map = MAPS[mapId]!;
  const t = thingsOf(map).find((x) => x.id === thingId)!;
  const reach = reachableTiles(map, map.spawn, new Set(adventureOf(w).openedGates));
  for (let y = t.y - 1; y <= t.y + t.h; y += 1) {
    for (let x = t.x - 1; x <= t.x + t.w; x += 1) {
      const inside = x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h;
      if (inside !== (t.kind === 'exit')) continue;
      if (reach.has(y * map.cols + x)) return tileCenter(map, x, y);
    }
  }
  throw new Error(`no tile by ${thingId}`);
}

/** Plays a battle on Auto to its end. */
export function fight(w0: WorldSave, now = T0, seed = 1): WorldSave {
  let w = w0;
  for (let i = 0; i < 400 && adventureOf(w).run?.phase === 'battle'; i += 1) w = ok(battleAct(w, { action: 'auto' }, ctxAt(now, seed + i)));
  // The battle board (adventure-big-update-1 §10) is read and closed, as the player would.
  if (adventureOf(w).run?.report) w = ok(closeReport(w, ctxAt(now)));
  return w;
}

/** Walks the whole trip that is on (every group, a spring when hurt, the exits), then goes home. */
export function walkTrip(w0: WorldSave, now = T0): WorldSave {
  let w = w0;
  const zone = ZONES[adventureOf(w).run!.zoneId]!;
  for (const mapId of zone.maps) {
    const run = adventureOf(w).run;
    if (!run || run.phase !== 'explore' || run.mapId !== mapId) break;
    const map = MAPS[mapId]!;
    for (const g of [...map.groups].sort((a, b) => ({ normal: 0, elite: 1, boss: 2 })[a.kind] - ({ normal: 0, elite: 1, boss: 2 })[b.kind])) {
      if (adventureOf(w).run?.phase !== 'explore') return w;
      const team = adventureOf(w).run!.team;
      if (team.reduce((n, m) => n + m.hp, 0) < team.reduce((n, m) => n + m.stats.hp, 0) * 0.5 && map.springs[0]) {
        const r = interact(w, { ...standBy(w, mapId, map.springs[0].id), id: map.springs[0].id }, ctxAt(now));
        if (r.ok) w = r.state;
      }
      const r = engage(w, { ...tileCenter(map, g.x, g.y), groupId: g.id }, ctxAt(now));
      if (r.ok) w = fight(r.state, now);
    }
    if (adventureOf(w).run?.phase !== 'explore') return w;
    const exit = map.exits.find((e) => e.to === zone.maps[zone.maps.indexOf(mapId) + 1]);
    if (!exit) break;
    w = ok(takeExit(w, { ...standBy(w, mapId, exit.id), exitId: exit.id }, ctxAt(now)));
  }
  return adventureOf(w).run?.phase === 'explore' ? ok(returnToCamp(w, ctxAt(now))) : w;
}
