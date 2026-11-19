import { describe, expect, it } from 'vitest';
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { tileCenter } from '../../src/areas/adventure/logic/maps';
import { coverUnder } from '../../src/areas/adventure/scene/coverUnder';

describe('coverUnder', () => {
  const withCovers = Object.values(MAPS).filter((m) => m.covers.length > 0);

  it('names the cover whose tiles the party stands on, and none in the open', () => {
    expect(withCovers.length).toBeGreaterThan(0);
    for (const map of withCovers) {
      for (const c of map.covers) {
        expect(coverUnder(map, tileCenter(map, c.x, c.y))).toBeTruthy();
        expect(coverUnder(map, tileCenter(map, c.x + c.w - 1, c.y + c.h - 1))).toBeTruthy();
      }
      expect(coverUnder(map, tileCenter(map, map.spawn.x, map.spawn.y)), map.id).toBeNull();
    }
  });

  it('finds the cover a point lies in and not the one next to it', () => {
    const map = withCovers[0]!;
    const c = map.covers[0]!;
    expect(coverUnder(map, tileCenter(map, c.x, c.y))).toBe(map.covers.find((x) => c.x >= x.x && c.x < x.x + x.w && c.y >= x.y && c.y < x.y + x.h)!.id);
    expect(coverUnder(map, { x: -10, y: -10 })).toBeNull();
  });
});
