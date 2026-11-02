// Painted areas (map v3, docs/maps/v3/M2_PLAN.md): an area with `scene` is drawn from one picture cut into chunks that cover it edge to
// edge on whole tiles, each chunk a manifest row loaded only by the Adventure (never at boot); one without keeps its tiles. Walking stays
// on `terrain`, and the saved trip of a reshaped area settles on walkable ground.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { startRun } from '../../src/areas/adventure/logic/actions/run';
import { MAP_LIST, MAPS } from '../../src/areas/adventure/logic/config/content';
import { tileCenter, WALK_TILES } from '../../src/areas/adventure/logic/maps';
import { adventureOf } from '../../src/areas/adventure/logic/save/lens';
import { settleWalker } from '../../src/areas/adventure/logic/simulate';
import { sceneChunks } from '../../src/areas/adventure/scene/mapScene';
import { T0, adventureWorld, ctxAt, keys, ok, squad, strong } from './adventureKit';

const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as {
  environment: { id: string; asset: string }[];
};
const painted = MAP_LIST.filter((m) => m.scene);

describe('painted areas', () => {
  it('covers every area of the world (forest, mountain, ruins, coast)', () => {
    expect(painted.map((m) => m.id).sort()).toEqual(MAP_LIST.map((m) => m.id).sort());
  });

  it('cuts the picture into chunks that cover the area edge to edge on whole tiles', () => {
    for (const m of painted) {
      const chunks = sceneChunks(m);
      expect(chunks).toHaveLength(m.scene!.chunks[0] * m.scene!.chunks[1]);
      expect(chunks.reduce((a, c) => a + c.w * c.h, 0)).toBe(m.cols * m.tile * m.rows * m.tile);
      for (const c of chunks) {
        expect((c.x % m.tile) + (c.y % m.tile) + (c.w % m.tile) + (c.h % m.tile)).toBe(0);
        expect(c.x + c.w).toBeLessThanOrEqual(m.cols * m.tile);
        expect(c.y + c.h).toBeLessThanOrEqual(m.rows * m.tile);
        // At most 2048 source px a side at its own px per tile.
        expect((Math.max(c.w, c.h) / m.tile) * m.scene!.px).toBeLessThanOrEqual(2048);
      }
    }
  });

  it('has every chunk in the manifest, in the folder the boot preload leaves out', () => {
    const rows = new Map(manifest.environment.map((r) => [r.id, r.asset]));
    for (const m of painted)
      for (const c of sceneChunks(m))
        expect(rows.get(c.id)).toMatch(/^environment\/adventure_v3\//);
  });

  it('leaves an area without a picture on its tiles', () => {
    expect(sceneChunks({ ...MAPS.map_mountain_foot!, scene: undefined })).toEqual([]);
  });

  it('keeps an older save of M2 whole: its ids still name the same things, a walk left where the trail used to be goes to the spawn', () => {
    const m = MAPS.map_forest_deep!;
    // Ids a save made on the v2 layout holds (openedChests, openedGates, foundSecrets, beaten, loreFound).
    expect(m.chests.map((c) => c.id).sort()).toEqual([
      'chest_f2_boulder',
      'chest_f2_hidden',
      'chest_f2_vines',
    ]);
    expect(m.gates.map((g) => g.id).sort()).toEqual(['gate_f2_boulder', 'gate_f2_vines']);
    expect(m.covers.map((c) => c.id)).toEqual(['cover_f2_a']);
    expect(m.groups.find((g) => g.id === 'g_f2_elite')?.kind).toBe('elite');
    expect(m.lore.map((l) => l.id)).toEqual(['lore_f2_pond']);
    // The v2 east road ran along row 11 at x 40; that tile is water or forest now.
    expect(WALK_TILES.has(m.terrain[11]![40]!)).toBe(false);
    const a = adventureOf(
      ok(
        startRun(
          strong(adventureWorld()),
          { zoneId: 'zone_forest', keys, roster: squad },
          ctxAt(T0),
        ),
      ),
    );
    const stuck = { ...a, run: { ...a.run!, mapId: m.id, ...tileCenter(m, 40, 11) } };
    expect(settleWalker(stuck).run).toMatchObject({
      mapId: m.id,
      ...tileCenter(m, m.spawn.x, m.spawn.y),
    });
  });
});
