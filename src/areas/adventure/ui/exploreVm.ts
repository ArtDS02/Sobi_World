// What the exploration screen shows over the map, as plain data (no DOM, spec §3, §17): the area and its discovery, the team's bars, the
// shrine blessings, the key hint for the thing in reach (what Space does there, or why it cannot), the last thing that happened (a
// traveller, a lore stone, a shrine), the small map, and the portal's destinations. Pure.
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import type { Element } from '../../../systems/combat/types';
import { vi } from '../../../i18n/vi';
import { portalLit } from '../logic/actions/trip';
import { AB, EVENTS, MAPS, ZONE_LIST, ZONES, type AreaMap } from '../logic/config/content';
import { blockedTiles, thingsOf, type Thing } from '../logic/maps';
import { discovery } from '../logic/progress';
import { adventureOf } from '../logic/save/lens';
import type { Run } from '../logic/state';
import { elementLabel, pct } from './vmKit';

export interface MemberBarVm {
  key: string;
  name: string;
  art: string;
  hpText: string;
  hpPercent: number;
  mpPercent: number;
  ragePercent: number;
  down: boolean;
}

export interface PromptVm {
  thingId: string;
  kind: Thing['kind'];
  label: string;
  /** Why Space does nothing here (greyed), or null. */
  reason: string | null;
}

export interface MinimapVm {
  cols: number;
  rows: number;
  /** One char per tile: `.` walk, `#` blocked, `~` water, `P` portal, `C` chest (closed), `c` chest (open), `G` closed gate, `>` exit. */
  tiles: string[];
  player: { x: number; y: number };
}

export interface ExploreVm {
  mapName: string;
  zoneName: string;
  explored: string;
  exploredPct: number;
  team: MemberBarVm[];
  /** The shrine blessings carried: the element and the words. */
  blessings: { element: Element; text: string }[];
  prompt: PromptVm | null;
  event: { title: string; text: string } | null;
  portal: { lit: boolean; destinations: { mapId: string; label: string }[] };
}

const pctOf = (a: number, b: number) => (b <= 0 ? 0 : Math.round((a / b) * 100));

/** What Space on `thing` would do now, or why not. */
export function promptFor(world: WorldSave, run: Run, map: AreaMap, thing: Thing): PromptVm {
  const a = adventureOf(world);
  const E = vi.adventure.explore;
  const key = `${map.id}/${thing.id}`;
  const base = { thingId: thing.id, kind: thing.kind };
  switch (thing.kind) {
    case 'chest':
      return { ...base, label: E.chest, reason: a.openedChests.includes(thing.id) ? E.chestOpen : null };
    case 'node': {
      const node = map.nodes.find((n) => n.id === thing.id)!;
      return { ...base, label: node.kind === 'herb' ? E.herb : E.ore, reason: run.harvested.includes(key) ? E.spotUsed : null };
    }
    case 'gate': {
      const gate = map.gates.find((g) => g.id === thing.id)!;
      const label = t(E.gate, { element: elementLabel(gate.element) });
      const ok = run.team.some((m) => m.hp > 0 && (m.element === gate.element || m.element2 === gate.element));
      return { ...base, label, reason: ok ? null : t(E.gateNeed, { element: elementLabel(gate.element) }) };
    }
    case 'spring':
      return { ...base, label: t(E.spring, { pct: pct(AB.explore.springPct) }), reason: run.springs.includes(map.id) ? E.springUsed : null };
    case 'npc':
      return { ...base, label: E.npc, reason: run.harvested.includes(key) ? E.spotUsed : null };
    case 'lore':
      return { ...base, label: E.lore, reason: null };
    case 'shrine':
      return { ...base, label: t(E.shrine, { element: elementLabel(map.shrine!.element) }), reason: run.harvested.includes(key) ? E.shrineDone : null };
    case 'portal': {
      const lit = portalLit(world, a, map.id);
      const guard = map.groups.some((g) => g.kind === 'boss') ? E.portalBoss : E.portalGuard;
      return { ...base, label: E.portal, reason: lit ? null : t(E.portalOff, { foe: guard }) };
    }
    case 'exit':
      return { ...base, label: MAPS[map.exits.find((e) => e.id === thing.id)?.to ?? '']?.nameVi ?? '', reason: null };
  }
}

export function exploreVm(world: WorldSave, run: Run, focus: string | null): ExploreVm | null {
  const map = MAPS[run.mapId];
  if (!map) return null;
  const a = adventureOf(world);
  const zone = ZONES[map.zoneId];
  const thing = focus ? thingsOf(map).find((x) => x.id === focus) : undefined;
  let event: ExploreVm['event'] = null;
  if (run.lastEvent?.kind === 'npc') {
    const npc = map.npcs.find((n) => n.id === run.lastEvent!.id);
    const ev = npc ? EVENTS[npc.event] : undefined;
    if (ev) event = { title: ev.nameVi, text: ev.textVi };
  } else if (run.lastEvent?.kind === 'lore' || (thing?.kind === 'lore' && a.loreFound.includes(thing.id))) {
    const id = run.lastEvent?.kind === 'lore' ? run.lastEvent.id : thing!.id;
    const lore = map.lore.find((l) => l.id === id);
    if (lore) event = { title: vi.adventure.explore.lore, text: lore.textVi };
  }
  const lit = portalLit(world, a, map.id);
  const destinations = lit
    ? [
        { mapId: 'camp', label: vi.adventure.explore.portalCamp },
        ...ZONE_LIST.flatMap((z) => z.maps.filter((m) => m !== map.id && portalLit(world, a, m)).map((m) => ({ mapId: m, label: t(vi.adventure.explore.portalGo, { map: `${z.nameVi} · ${MAPS[m]!.nameVi}` }) }))),
      ]
    : [];
  return {
    mapName: map.nameVi,
    zoneName: zone?.nameVi ?? '',
    explored: t(vi.adventure.explore.mapTitle, { map: map.nameVi, pct: discovery(a, [map.id]).percent }),
    exploredPct: discovery(a, [map.id]).percent,
    team: run.team.map((m) => ({
      key: m.key,
      name: m.name,
      art: m.art,
      hpText: `${formatInt(m.hp)}/${formatInt(m.stats.hp)}`,
      hpPercent: pctOf(m.hp, m.stats.hp),
      mpPercent: pctOf(m.mp, m.stats.mp),
      ragePercent: pctOf(m.rage, AB.rage.max),
      down: m.hp <= 0,
    })),
    blessings: Object.entries(run.blessings).map(([el, n]) => ({ element: el as Element, text: t(vi.adventure.explore.blessing, { element: elementLabel(el as Element), pct: pct(n) }) })),
    prompt: thing ? promptFor(world, run, map, thing) : null,
    event,
    portal: { lit, destinations },
  };
}

/** The small map of the area the party walks (§3.9). */
export function minimapVm(world: WorldSave, run: Run): MinimapVm | null {
  const map = MAPS[run.mapId];
  if (!map) return null;
  const a = adventureOf(world);
  const blocked = blockedTiles(map, new Set(a.openedGates));
  const rows: string[][] = map.terrain.map((row, y) => [...row].map((c, x) => (c === '~' ? '~' : blocked[y * map.cols + x] ? '#' : '.')));
  for (const th of thingsOf(map)) {
    const mark = th.kind === 'portal' ? 'P' : th.kind === 'chest' ? (a.openedChests.includes(th.id) ? 'c' : 'C') : th.kind === 'gate' && !a.openedGates.includes(th.id) ? 'G' : th.kind === 'exit' ? '>' : null;
    if (!mark) continue;
    for (let y = th.y; y < th.y + th.h; y += 1) for (let x = th.x; x < th.x + th.w; x += 1) rows[y]![x] = mark;
  }
  return { cols: map.cols, rows: map.rows, tiles: rows.map((r) => r.join('')), player: { x: Math.floor(run.x / map.tile), y: Math.floor(run.y / map.tile) } };
}
