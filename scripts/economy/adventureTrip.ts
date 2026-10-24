// How the balance bot walks a trip (decision 037): area by area it beats every group it can reach (normal ones, the guardian, the boss),
// drinks the spring when the team is hurt, opens the treasure chests it can reach with the gates it has opened (and opens the gates its
// party's elements allow), plays every battle on Auto, takes the exit to the next area, and goes home by the portal after the boss — or
// as soon as it is too hurt to go on. It stands where a player would walk to (the actions check the ground, not the path).
import { battleAct, closeReport, engage, interact, returnToCamp, takeExit } from '../../src/areas/adventure/logic/actions/run';
import { stepNode } from '../../src/areas/adventure/logic/actions/growth';
import { MAPS, TREES, ZONES, identityOf } from '../../src/areas/adventure/logic/config/content';
import { classOf } from '../../src/areas/adventure/logic/fighters';
import { reachableTiles, thingsOf, tileCenter, type Thing } from '../../src/areas/adventure/logic/maps';
import { adventureOf } from '../../src/areas/adventure/logic/save/lens';
import { whyNotStep } from '../../src/areas/adventure/logic/tree';
import { AREAS } from '../../src/app/areas';
import type { Bot } from './week';

const run = (b: Bot) => adventureOf(b.world).run;

/** A walkable tile next to a thing (or on an exit), reachable from the spawn with the gates open now. */
function standBy(b: Bot, mapId: string, t: Pick<Thing, 'x' | 'y' | 'w' | 'h' | 'kind'>): { x: number; y: number } | null {
  const map = MAPS[mapId]!;
  const reach = reachableTiles(map, map.spawn, new Set(adventureOf(b.world).openedGates));
  for (let y = t.y - 1; y <= t.y + t.h; y += 1) {
    for (let x = t.x - 1; x <= t.x + t.w; x += 1) {
      const inside = x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h;
      if (inside !== (t.kind === 'exit')) continue;
      if (reach.has(y * map.cols + x)) return tileCenter(map, x, y);
    }
  }
  return null;
}

function fight(b: Bot) {
  for (let guard = 0; guard < 300; guard += 1) {
    const r = run(b);
    if (!r || r.phase !== 'battle') break;
    if (!b.act('adventure', (w, c) => battleAct(w, { action: 'auto' }, c))) break;
  }
  // The battle board is read and closed, as a player would.
  if (run(b)?.report) b.act('adventure', (w, c) => closeReport(w, c));
}

const hurt = (b: Bot) => {
  const team = run(b)?.team ?? [];
  return team.reduce((n, m) => n + m.hp, 0) / Math.max(1, team.reduce((n, m) => n + m.stats.hp, 0));
};

function use(b: Bot, mapId: string, kinds: Thing['kind'][]) {
  for (const t of thingsOf(MAPS[mapId]!)) {
    if (!kinds.includes(t.kind)) continue;
    const at = standBy(b, mapId, t);
    if (at) b.act('adventure', (w, c) => interact(w, { ...at, id: t.id }, c));
  }
}

/** Walks the trip that just started; returns when it is over. */
export function walkTrip(b: Bot) {
  const zone = ZONES[run(b)?.zoneId ?? '']!;
  for (let i = zone.maps.indexOf(run(b)!.mapId); i < zone.maps.length && i >= 0; i += 1) {
    const mapId = zone.maps[i]!;
    if (run(b)?.mapId !== mapId || run(b)?.phase !== 'explore') return;
    use(b, mapId, ['gate']);
    use(b, mapId, ['chest', 'node', 'npc', 'lore', 'shrine']);
    const map = MAPS[mapId]!;
    const order = [...map.groups].sort((a, c) => ({ normal: 0, elite: 1, boss: 2 })[a.kind] - ({ normal: 0, elite: 1, boss: 2 })[c.kind]);
    for (const g of order) {
      if (run(b)?.phase !== 'explore') return;
      if (hurt(b) < 0.5) use(b, mapId, ['spring']);
      if (g.kind === 'normal' && hurt(b) < 0.3) continue;
      const at = tileCenter(map, g.x, g.y);
      if (b.act('adventure', (w, c) => engage(w, { ...at, groupId: g.id }, c))) fight(b);
    }
    if (run(b)?.phase !== 'explore') return;
    const exit = map.exits.find((e) => e.to === zone.maps[i + 1]);
    if (!exit || hurt(b) < 0.25) break;
    const at = standBy(b, mapId, { ...exit, kind: 'exit' });
    if (!at || !b.act('adventure', (w, c) => takeExit(w, { ...at, exitId: exit.id }, c))) break;
  }
  if (run(b)?.phase === 'explore') b.act('adventure', (w, c) => returnToCamp(w, c));
}

/** Spends every fighter's SP along its class tree (lower tiers first). */
export function spendSp(b: Bot) {
  const roster = AREAS.roster(b.world);
  for (const entry of roster) {
    const identity = identityOf(entry);
    const f = adventureOf(b.world).fighters[entry.key];
    if (!identity || !f || f.sp <= 0) continue;
    const classId = classOf(f, identity);
    for (let guard = 0; guard < 30; guard += 1) {
      const now = adventureOf(b.world).fighters[entry.key]!;
      const node = [...TREES[classId]].sort((a, c) => a.tier - c.tier).find((n) => whyNotStep(now, classId, n.id) === null);
      if (!node || !b.act('adventure', (w, c) => stepNode(w, { key: entry.key, nodeId: node.id, roster }, c))) break;
    }
  }
}
