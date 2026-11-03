// Map Builder GĐ8 (decision 047): the content as the builder leaves it keeps every player's save whole. A real Adventure slice from
// before the builder carries through every migration and each id it holds — chests, gates, lit portals, lore, cleared zones — is still
// in the game; a trip saved standing at any arrival point of any area (the named spawns the builder added) loads and stays put.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { startRun } from '../../src/areas/adventure/logic/actions/run';
import { MAP_LIST, ZONES } from '../../src/areas/adventure/logic/config/content';
import { tileCenter } from '../../src/areas/adventure/logic/maps';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { settleWalker } from '../../src/areas/adventure/logic/simulate';
import { adventureStateSchema } from '../../src/areas/adventure/logic/state';
import { parseWorldSave } from '../../src/app/saveCodec';
import { savedMapIds } from '../../scripts/admin/mapIds';
import { T0, adventureWorld, ctxAt, keys, migrateOn, ok, squad } from './adventureKit';

type Raw = Record<string, unknown>;

const ids = (key: 'chests' | 'gates' | 'lore') => new Set(MAP_LIST.flatMap((m) => m[key].map((r) => r.id)));

describe('saves with the Map Builder content', () => {
  it('a real slice from before the builder keeps every id it holds (but the chests decision 045 dropped)', () => {
    const fixture = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'adventure-slice-v2-real.json'), 'utf8')) as { slice: Raw };
    const a = adventureStateSchema.parse(migrateOn(2, fixture.slice));
    expect(a.openedChests.length).toBeGreaterThan(0);
    // Five chests went with the map layouts v2 (decision 045, before the builder): a save still loads, the id is just unused. Any other
    // id gone would be a loss the builder must never cause.
    const goneBy045 = ['chest_f2_island', 'chest_f3_hollow', 'chest_m1_crevice', 'chest_m3_ledge', 'chest_r3_reliquary'];
    expect(a.openedChests.filter((id) => !ids('chests').has(id))).toEqual(goneBy045);
    for (const id of a.openedGates) expect(ids('gates').has(id), id).toBe(true);
    for (const id of a.loreFound) expect(ids('lore').has(id), id).toBe(true);
    for (const id of a.activePortals) expect(MAP_LIST.some((m) => m.id === id), id).toBe(true);
    for (const z of Object.keys(a.cleared)) expect(ZONES[z], z).toBeDefined();
  });

  it('a trip saved at any arrival point of any area loads and stands where it stood', () => {
    const w0 = ok(startRun(adventureWorld(), { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));
    const run = adventureOf(w0).run!;
    let checked = 0;
    for (const m of MAP_LIST) {
      for (const p of [m.spawn, ...(m.spawns ?? [])]) {
        const at = tileCenter(m, p.x, p.y);
        const w = withAdventure(w0, { ...adventureOf(w0), run: { ...run, mapId: m.id, zoneId: m.zoneId, ...at } });
        const loaded = parseWorldSave(JSON.stringify(w));
        expect(loaded.ok, m.id).toBe(true);
        if (!loaded.ok) continue;
        const a = adventureOf(loaded.save);
        expect(settleWalker(a), `${m.id} ${p.x},${p.y}`).toBe(a);
        checked += 1;
      }
    }
    expect(checked).toBe(MAP_LIST.length + MAP_LIST.reduce((n, m) => n + (m.spawns?.length ?? 0), 0));
  });
});

describe('ids a save may hold', () => {
  it('are never dropped from the content, whatever tool writes it (the Admin refuses too: scripts/admin/mapIds.ts)', () => {
    const shipped = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'adventure-saved-ids.json'), 'utf8')) as { maps: string[]; zones: string[] };
    const now = savedMapIds(JSON.parse(readFileSync('content/adventure/maps.json', 'utf8')));
    expect(shipped.maps.filter((id) => !now.has(id))).toEqual([]);
    expect(shipped.zones.filter((id) => !ZONES[id])).toEqual([]);
  });
});
