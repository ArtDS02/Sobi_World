// How the areas hang together (decision 043): every area sits in exactly one zone, on its main road or as a side area (no boss there);
// every exit has a way back from where it leads (unless it is one-way on purpose, decision 047); a shortcut can be opened from its other side (the way back is no shortcut too); every
// area of a zone is walked to from its entrance. Pure; the content is passed in so the checks can be tried on broken copies.
import { MAP_LIST, ZONE_LIST, zoneAreas, type AreaMap, type Zone } from './config/content';

export function mapGraphProblems(maps: readonly AreaMap[] = MAP_LIST, zones: readonly Zone[] = ZONE_LIST): string[] {
  const out: string[] = [];
  const byId = new Map(maps.map((m) => [m.id, m]));
  const listed = new Map<string, string>();
  for (const z of zones) {
    for (const m of zoneAreas(z)) {
      if (listed.has(m)) out.push(`${m} is listed twice (${listed.get(m)}, ${z.id})`);
      listed.set(m, z.id);
    }
    for (const m of z.branches ?? []) if (byId.get(m)?.groups.some((g) => g.kind === 'boss')) out.push(`${m}: a side area holds a boss`);
  }
  for (const m of maps) {
    if (!listed.has(m.id)) out.push(`${m.id} is in no zone`);
    for (const e of m.exits) {
      const back = byId.get(e.to)?.exits.filter((x) => x.to === m.id) ?? [];
      if (back.length === 0) {
        if (!e.oneWay) out.push(`${m.id}: exit ${e.id} has no way back from ${e.to}`);
      }
      else if (e.lock === 'shortcut' && back.every((x) => x.lock === 'shortcut')) out.push(`${m.id}: shortcut ${e.id} can never be opened (no plain way back)`);
    }
  }
  for (const z of zones) {
    const seen = new Set([z.maps[0]!]);
    const queue = [z.maps[0]!];
    while (queue.length > 0) {
      for (const e of byId.get(queue.shift()!)?.exits ?? []) {
        if (seen.has(e.to) || byId.get(e.to)?.zoneId !== z.id) continue;
        seen.add(e.to);
        queue.push(e.to);
      }
    }
    for (const m of zoneAreas(z)) if (!seen.has(m)) out.push(`${z.id}: ${m} cannot be walked to from ${z.maps[0]}`);
  }
  return out;
}
