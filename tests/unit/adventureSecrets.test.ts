// Hidden places (decision 045): an overhead cover is found for good the first time the party stands under it (once, with its event),
// it counts in the zone's discovery, a false wall that gives way says it was a hidden place, and an area's checks refuse a cover over
// the way in. The save gains `foundSecrets` (v6).
import { describe, expect, it } from 'vitest';
import { interact, moveTo, startRun } from '../../src/areas/adventure/logic/actions/run';
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { coverAt, mapProblems, reachableTiles, tileCenter } from '../../src/areas/adventure/logic/maps';
import { ADVENTURE_MIGRATIONS } from '../../src/areas/adventure/logic/migrations';
import { discovery } from '../../src/areas/adventure/logic/progress';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import type { AdventureState } from '../../src/areas/adventure/logic/state';
import type { WorldSave } from '../../src/core/save/world';
import { T0, adventureWorld, ctxAt, keys, ok, squad, standBy, strong } from './adventureKit';

const F1 = MAPS.map_forest_edge!;
const start = () => ok(startRun(strong(adventureWorld()), { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));

/** A walkable tile under the cover, reachable from the spawn. */
function underCover(map = F1) {
  const c = map.covers[0]!;
  const reach = reachableTiles(map, map.spawn, new Set(map.gates.map((g) => g.id)));
  for (let y = c.y; y < c.y + c.h; y += 1) for (let x = c.x; x < c.x + c.w; x += 1) if (reach.has(y * map.cols + x)) return tileCenter(map, x, y);
  throw new Error('no ground under the cover');
}

/** Puts the trip on another area of its zone (as if walked there). */
function onMap(w: WorldSave, mapId: string): WorldSave {
  const a = adventureOf(w);
  const map = MAPS[mapId]!;
  const at = tileCenter(map, map.spawn.x, map.spawn.y);
  return withAdventure(w, { ...a, run: { ...a.run!, mapId, x: at.x, y: at.y } });
}

describe('overhead covers', () => {
  it('every area of the content has a cover over ground one can walk to', () => {
    for (const map of Object.values(MAPS)) {
      expect(map.covers.length, map.id).toBeGreaterThan(0);
      expect(() => underCover(map), map.id).not.toThrow();
    }
  });
  it('standing under a cover finds the hidden place once, for good', () => {
    const w0 = start();
    const r1 = moveTo(w0, underCover(), ctxAt(T0));
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const cover = F1.covers[0]!;
    expect(adventureOf(r1.state).foundSecrets).toEqual([cover.id]);
    expect(r1.events).toContainEqual({ type: 'ADVENTURE_SECRET_FOUND', mapId: F1.id, secretId: cover.id, kind: 'cover' });
    const r2 = moveTo(r1.state, underCover(), ctxAt(T0));
    expect(r2.ok && r2.events.some((e) => e.type === 'ADVENTURE_SECRET_FOUND')).toBe(false);
  });
  it('the spawn is under no cover', () => {
    for (const map of Object.values(MAPS)) expect(coverAt(map, tileCenter(map, map.spawn.x, map.spawn.y)), map.id).toBeUndefined();
  });
  it('a cover counts in the discovery', () => {
    const base: Pick<AdventureState, 'openedChests' | 'openedGates' | 'loreFound' | 'activePortals' | 'foundSecrets'> = { openedChests: [], openedGates: [], loreFound: [], activePortals: [], foundSecrets: [] };
    const before = discovery(base, [F1.id]);
    const after = discovery({ ...base, foundSecrets: [F1.covers[0]!.id] }, [F1.id]);
    expect(after.total).toBe(before.total);
    expect(after.found).toBe(before.found + 1);
  });
  it('an area check refuses a cover over the spawn', () => {
    const bad = { ...F1, covers: [{ id: 'cover_bad', x: F1.spawn.x, y: F1.spawn.y, w: 2, h: 2, look: 'canopy' as const }] };
    expect(mapProblems(bad).some((p) => p.includes('cover_bad hides the spawn'))).toBe(true);
  });
});

describe('false walls', () => {
  it('a false wall that gives way to its element is a hidden place found', () => {
    const map = Object.values(MAPS).find((m) => m.gates.some((g) => g.look === 'crack'))!;
    const gate = map.gates.find((g) => g.look === 'crack')!;
    let w = onMap(start(), map.id);
    const a = adventureOf(w);
    w = withAdventure(w, { ...a, run: { ...a.run!, team: a.run!.team.map((m, i) => (i === 0 ? { ...m, element: gate.element } : m)) } });
    const r = interact(w, { ...standBy(w, map.id, gate.id), id: gate.id }, ctxAt(T0));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(adventureOf(r.state).openedGates).toContain(gate.id);
    expect(r.events).toContainEqual({ type: 'ADVENTURE_SECRET_FOUND', mapId: map.id, secretId: gate.id, kind: 'wall' });
  });
});

describe('the save (v6)', () => {
  it('a v5 slice gains no hidden place found', () => {
    const a = adventureOf(start());
    const v5: Record<string, unknown> = { ...a, version: 5 };
    delete v5.foundSecrets;
    expect(ADVENTURE_MIGRATIONS[5]!(v5)).toEqual({ ...a, version: 6, foundSecrets: [] });
  });
});
