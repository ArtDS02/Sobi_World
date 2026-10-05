// U06: gift boxes land inside the farm, clear of objects, pigs and each other.
import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { parseManifest } from '../../src/core/assets/manifestSchema';
import { FARM_VIEW } from '../../src/core/config/farmView';
import { giftSpot, type Rect } from '../../src/areas/farm/scene/view/giftPlacement';

const parsed = parseManifest(manifestJson);
if (!parsed.ok) throw new Error(parsed.message);
const layout = parsed.manifest.layout;
const { width, height } = layout.designSize;

describe('giftSpot (U06)', () => {
  it('is deterministic per seed and inside the walk area', () => {
    for (let seed = 1; seed < 200; seed += 7) {
      const p = giftSpot(seed, layout, { obstacles: [], pigHomes: [], gifts: [] });
      expect(giftSpot(seed, layout, { obstacles: [], pigHomes: [], gifts: [] })).toEqual(p);
      const w = layout.walkArea;
      expect(p.x).toBeGreaterThanOrEqual(w.x * width);
      expect(p.x).toBeLessThanOrEqual((w.x + w.width) * width);
      expect(p.y).toBeGreaterThanOrEqual(w.y * height);
      expect(p.y).toBeLessThanOrEqual((w.y + w.height) * height);
    }
  });

  it('avoids obstacles, pig homes and other gifts when there is room', () => {
    // Inside the walk ellipse (centre 800, 580).
    const trough: Rect = { x: 700, y: 560, width: 200, height: 100 };
    const pigHomes = [
      { x: 300, y: 700 },
      { x: 1200, y: 760 },
    ];
    const S = FARM_VIEW.GIFT_SPOT;
    for (let seed = 1; seed < 300; seed += 11) {
      const gifts = [{ x: 500, y: 800 }];
      const p = giftSpot(seed, layout, { obstacles: [trough], pigHomes, gifts });
      const inX = p.x > trough.x - S.clearPx && p.x < trough.x + trough.width + S.clearPx;
      const inY = p.y > trough.y - S.clearPx && p.y < trough.y + trough.height + S.clearPx;
      expect(inX && inY, `seed ${seed}`).toBe(false);
      for (const h of pigHomes)
        expect(Math.hypot(h.x - p.x, h.y - p.y)).toBeGreaterThanOrEqual(S.pigHomePx);
      expect(Math.hypot(500 - p.x, 800 - p.y)).toBeGreaterThanOrEqual(S.giftPx);
    }
  });

  it('a full farm still returns a spot (the roomiest try), never throws', () => {
    const everything: Rect = { x: 0, y: 0, width, height };
    const p = giftSpot(42, layout, { obstacles: [everything], pigHomes: [], gifts: [] });
    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
  });
});
