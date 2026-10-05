import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { anchorOffset, anchorPoint, parseAnchors } from '../../src/core/assets/anchors';
import { parseManifest, type AssetManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { DEFAULT_ANCHORS, FARM_ACTIONS, PIG_FEET_Y } from '../../src/core/config/assetIds';
import { FARM_VIEW } from '../../src/core/config/farmView';
import { pigScale, pigSpot, pigView } from '../../src/areas/farm/scene/view/pigView';
import { groundLineY, placementDepth, placementView } from '../../src/areas/farm/scene/view/sceneLayout';
import {
  farmLoadList,
  fallbackPigKey,
  artLoadList,
  textureKey,
  troughTextureKey,
} from '../../src/areas/farm/scene/view/textureKeys';
import { makePig } from './pigFactory';

function manifest(): AssetManifest {
  const r = parseManifest(structuredClone(manifestJson));
  if (!r.ok) throw new Error(r.message);
  return r.manifest;
}
const reg = createAssetRegistry(manifest());
const layout = reg.manifest.layout;

describe('pigView (spec §11.2)', () => {
  it('idle pig: own species texture, feet inside the walk area, depth = y', () => {
    const v = pigView(makePig(), 0, layout, reg);
    expect(v.textureId).toBe('pig_classic');
    expect(v.fallbackId).toBe(fallbackPigKey('PIG_EARTH_PINK'));
    expect(v.visualState).toBe('idle');
    expect(v.overlays).toEqual([]);
    const w = layout.walkArea;
    const { width, height } = layout.designSize;
    expect(v.x).toBeGreaterThanOrEqual(w.x * width);
    expect(v.x).toBeLessThanOrEqual((w.x + w.width) * width);
    expect(v.y).toBeGreaterThanOrEqual(w.y * height);
    expect(v.y).toBeLessThanOrEqual((w.y + w.height) * height);
    expect(v.depth).toBe(v.y);
  });

  it('is deterministic per pig and spreads pigs by slot', () => {
    const a = pigView(makePig({ id: 'a', slotIndex: 0 }), 0, layout, reg);
    expect(pigView(makePig({ id: 'a', slotIndex: 0 }), 999, layout, reg)).toEqual(a);
    const xs = [0, 1, 2, 3, 4].map((i) => pigSpot({ id: `p${i}`, slotIndex: i }, layout).x);
    expect(new Set(xs.map((x) => x.toFixed(3))).size).toBe(5);
  });

  it('scale = growth × Y: baby smaller than adult, back smaller than front', () => {
    const w = layout.walkArea;
    const { min, max } = layout.pigScaleByY;
    const g = FARM_VIEW.PIG_GROWTH_SCALE;
    expect(pigScale(0, w.y + w.height, layout)).toBeCloseTo(g.baby * max);
    expect(pigScale(100, w.y + w.height, layout)).toBeCloseTo(g.adult * max);
    expect(pigScale(100, w.y, layout)).toBeCloseTo(g.adult * min);
    expect(pigScale(50, w.y, layout)).toBeLessThan(pigScale(50, w.y + w.height, layout));
    const baby = pigView(makePig({ growthProgress: 0 }), 0, layout, reg);
    const adult = pigView(makePig({ growthProgress: 100 }), 0, layout, reg);
    expect(baby.scale).toBeLessThan(adult.scale);
  });

  it('sick and pregnant add their shared overlays', () => {
    const v = pigView(
      makePig({
        isSick: true,
        pregnancy: {
          startedAt: 0,
          endsAt: 1,
          fatherId: 'f',
          childBreed: 'PIG_EARTH_PINK',
          childGender: 'MALE',
        },
      }),
      0,
      layout,
      reg,
    );
    expect(v.visualState).toBe('sick');
    expect(v.overlays).toEqual(['fx_sick', 'fx_pregnant']);
  });

  it('species art texture; no art at all → breed fallback texture', () => {
    expect(pigView(makePig(), 0, layout, reg).textureId).toBe('pig_classic');
    const none = { artTexture: () => ({ artId: 'x', url: null, overlay: null }) };
    expect(pigView(makePig({ breed: 'PIG_MYTHICAL' }), 0, layout, none).textureId).toBe(
      fallbackPigKey('PIG_MYTHICAL'),
    );
  });
});

describe('trough texture (environment catalogue §1)', () => {
  it('0 → empty, ≤ cap/2 → half, > cap/2 → full', () => {
    expect(troughTextureKey(0, 20)).toBe('prop_feed_trough_empty');
    expect(troughTextureKey(1, 20)).toBe('prop_feed_trough_half');
    expect(troughTextureKey(10, 20)).toBe('prop_feed_trough_half');
    expect(troughTextureKey(10.5, 20)).toBe('prop_feed_trough_full');
    expect(troughTextureKey(20, 20)).toBe('prop_feed_trough_full');
  });
});

describe('anchors (art standard §5)', () => {
  it('missing file → defaults; partial / invalid entries fall back per anchor; feet.y fixed', () => {
    expect(parseAnchors(undefined)).toEqual(DEFAULT_ANCHORS);
    const a = parseAnchors({
      head: { x: 0.6, y: 0.2 },
      face: { x: 2, y: 0 },
      feet: { x: 0.4, y: 0.5 },
    });
    expect(a.head).toEqual({ x: 0.6, y: 0.2 });
    expect(a.face).toEqual(DEFAULT_ANCHORS.face);
    expect(a.feet).toEqual({ x: 0.4, y: PIG_FEET_Y });
  });

  it('mirrors x → 1 − x when flipped', () => {
    const a = parseAnchors({ hand_prop: { x: 0.64, y: 0.61 } });
    expect(anchorPoint(a, 'hand_prop', false)).toEqual({ x: 0.64, y: 0.61 });
    expect(anchorPoint(a, 'hand_prop', true).x).toBeCloseTo(0.36);
    expect(anchorPoint(a, 'hand_prop', true).y).toBe(0.61);
  });

  it('offset from the feet origin in display pixels', () => {
    const a = parseAnchors(undefined);
    const off = anchorOffset(a, 'fx_above', false, 200, 200);
    expect(off.x).toBeCloseTo(0);
    expect(off.y).toBeCloseTo((0.1 - PIG_FEET_Y) * 200);
    expect(anchorOffset(a, 'face', true, 100, 100).x).toBeCloseTo((1 - 0.58 - 0.5) * 100);
  });
});

describe('scene layout (spec §11.1)', () => {
  it('back layers sit below every actor, actors Y-sorted, overlays on top', () => {
    const p = (layer: number, y = 0.5) => ({ id: 'x', layer, x: 0.5, y });
    const back = [0, 1, 2, 3].map((l) => placementDepth(p(l), 0, layout));
    expect(back).toEqual([...back].sort((a, b) => a - b));
    expect(Math.max(...back)).toBeLessThan(0);
    expect(placementDepth(p(4, 0.76), 0, layout)).toBeCloseTo(0.76 * layout.designSize.height);
    expect(placementDepth(p(5), 0, layout)).toBeGreaterThan(layout.designSize.height);
  });

  it('positions in design px; default origin centre-bottom', () => {
    const v = placementView({ id: 'x', layer: 3, x: 0.25, y: 0.5 }, 0, layout);
    expect(v).toMatchObject({ x: 0.25 * 1600, y: 0.5 * 900, originX: 0.5, originY: 1 });
    expect(placementView({ id: 'x', layer: 0, x: 0, y: 0, originY: 0 }, 0, layout).originY).toBe(0);
    const isEnv = (id: string) => reg.resolve(id)?.section === 'environment';
    expect(groundLineY(layout, isEnv)).toBeCloseTo(0.56 * 900);
  });
});

describe('preload list (spec §11)', () => {
  it('has environment, all trough states, fx, ui icons and the requested pig art only', () => {
    // Fixture: the classic art with its own sleep frame (cut art may have none).
    const m = manifest();
    m.pigs.find((p) => p.id === 'pig_classic')!.sleepAsset = 'pigs/base/pig_classic_sleep.png';
    const list = farmLoadList(createAssetRegistry(m), ['pig_classic', 'pig_classic']);
    const keys = list.images.map((i) => i.key);
    for (const k of ['env_sky', 'env_ground_grass', 'prop_pig_house', 'fx_sick', 'ui_icon_gold'])
      expect(keys).toContain(k);
    // fx_zzz has 3 frames in the manifest: loaded as a sprite sheet, animated (§11.4, Q5).
    expect(keys).not.toContain('fx_zzz');
    // Seasonal FX strips (fx_env_*, MU-2) are sheets too: one frame per variant.
    expect(list.sheets.filter((s) => !s.key.startsWith('fx_env_'))).toEqual([
      expect.objectContaining({ key: 'fx_zzz', frameWidth: 256, frameHeight: 256, count: 3 }),
    ]);
    for (const s of ['empty', 'half', 'full'])
      expect(keys).toContain(textureKey('prop_feed_trough', s));
    expect(keys.filter((k) => k === 'pig_classic')).toHaveLength(1);
    expect(keys).toContain('pig_classic_sleep');
    expect(keys.some((k) => k.startsWith('pig_') && !k.startsWith('pig_classic'))).toBe(false);
    expect(keys.some((k) => k.startsWith('music_') || k.startsWith('acc_'))).toBe(false);
  });

  it('art list carries the anchors json when the row has one', () => {
    const m = manifest();
    m.pigs[0]!.anchors = 'pigs/base/pig_classic.anchors.json';
    expect(parseManifest(m).ok).toBe(true);
    const s = artLoadList(createAssetRegistry(m), m.pigs[0]!.id);
    expect(s.json).toEqual([
      { key: 'pig_classic_anchors', url: 'assets/pigs/base/pig_classic.anchors.json' },
    ]);
    expect(artLoadList(reg, 'env_sky')).toEqual({ images: [], json: [], sheets: [] });
  });
});

describe('clickable world objects (DECISIONS R05C-1)', () => {
  it('every farm action is on exactly one placement, and that asset exists', () => {
    for (const action of FARM_ACTIONS) {
      const hits = layout.placements.filter((p) => p.action === action);
      expect(hits, action).toHaveLength(1);
      expect(reg.resolve(hits[0]!.id), action).toBeDefined();
    }
    expect(layout.placements.find((p) => p.action === 'shop')?.id).toBe('prop_shop_stall');
    expect(layout.placements.find((p) => p.action === 'trough')?.role).toBe('trough');
  });

  it('rejects an unknown action', () => {
    const bad = structuredClone(manifestJson) as { layout: { placements: { action?: string }[] } };
    bad.layout.placements[0]!.action = 'teleport';
    expect(parseManifest(bad).ok).toBe(false);
  });
});
