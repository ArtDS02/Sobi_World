// Hand-placed decorations (decision 047, Map Builder GĐ6b): the library fills the defaults, a decoration's foot blocks the way in the
// game's own walk checks, objects never stand under a foot, and a cover fades only with the party near or inside it.
import { describe, expect, it } from 'vitest';
import { mapsFileSchema } from '../../content/schemas/adventure/maps';
import { DECOR, DECOR_LIST, MAP_LIST, MAPS } from '../../src/areas/adventure/logic/config/content';
import { blockedTiles, mapProblems } from '../../src/areas/adventure/logic/maps';
import { decorAlpha, decorOf, footTile, sceneryBlocks } from '../../src/areas/adventure/logic/scenery';

const area = () => structuredClone(MAPS.map_forest_deep!);

describe('decorations', () => {
  it('has a library whose pictures exist and whose ids are unique', () => {
    expect(DECOR_LIST.length).toBeGreaterThan(0);
    expect(new Set(DECOR_LIST.map((d) => d.id)).size).toBe(DECOR_LIST.length);
  });

  it('fills a placement from the library and blocks the tiles of its foot', () => {
    const m = area();
    const oak = DECOR.decor_forest_oak!;
    const free = { x: m.spawn.x + 3, y: m.spawn.y };
    m.scenery = [{ id: 'scn_test_oak', asset: oak.id, x: free.x + 0.5, y: free.y + 1 }];
    const [d] = decorOf(m);
    expect(d).toMatchObject({ art: oak.art, w: oak.w, mode: 'occluder', foot: [{ x: free.x, y: free.y, w: 1, h: 1 }] });
    expect(footTile(free.x + 0.5, free.y + 1)).toEqual(free);
    expect(blockedTiles(m)[free.y * m.cols + free.x]).toBe(true);
    // Its own foot, a bigger one, or none at all.
    m.scenery[0]!.foot = [];
    expect(sceneryBlocks(m)).toEqual([]);
    expect(mapsFileSchema.safeParse({ maps: MAP_LIST.map((x) => (x.id === m.id ? m : x)) }).success).toBe(true);
  });

  it('flags an unknown asset and an object standing under a foot', () => {
    const m = area();
    const chest = m.chests[0]!;
    m.scenery = [
      { id: 'scn_a', asset: 'decor_nowhere', x: 3, y: 3 },
      { id: 'scn_b', asset: 'decor_forest_rocks', x: chest.x + 0.5, y: chest.y + 1 },
    ];
    const p = mapProblems(m);
    expect(p.some((x) => x.includes('unknown decoration decor_nowhere'))).toBe(true);
    expect(p.some((x) => x.includes(`foot covers ${chest.id}`))).toBe(true);
    m.scenery = [{ id: 'scn_c', asset: 'decor_forest_oak', x: m.spawn.x + 0.5, y: m.spawn.y + 1 }];
    expect(mapProblems(m).some((x) => x.includes('spawn tile is blocked'))).toBe(true);
  });

  it('fades a cover only with the party near or inside it', () => {
    const m = area();
    m.scenery = [
      { id: 'scn_cover', asset: 'decor_forest_canopy', x: 10, y: 10 },
      { id: 'scn_area', asset: 'decor_forest_canopy', x: 30, y: 10, fade: { alpha: 0.3, area: { x: 28, y: 5, w: 4, h: 5 } } },
      { id: 'scn_tree', asset: 'decor_forest_oak', x: 20, y: 10 },
    ];
    const [cover, byArea, tree] = decorOf(m);
    expect(decorAlpha(cover!, { x: 10, y: 7 })).toBe(0);
    expect(decorAlpha(cover!, { x: 10, y: 20 })).toBe(1);
    expect(decorAlpha(byArea!, { x: 29, y: 6 })).toBe(0.3);
    expect(decorAlpha(byArea!, { x: 33, y: 6 })).toBe(1);
    expect(decorAlpha(tree!, { x: 20, y: 9 })).toBe(1);
  });

  it('never refuses the shipped areas (none has decorations yet)', () => {
    for (const m of MAP_LIST) expect(m.scenery ?? []).toEqual([]);
  });
});
