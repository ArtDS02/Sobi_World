import { describe, expect, it } from 'vitest';
import { FARM_VIEW } from '../../src/core/config/farmView';
import { UI_ICON } from '../../src/core/config/assetIds';
import manifestJson from '../../public/assets/manifest/assets.json';
import { mixTint } from '../../src/game/prefabs/SickTint';
import { ambientKind, driftX } from '../../src/game/view/ambientMotion';

describe('ambient motion (R12A)', () => {
  it('clouds drift, trees and grass sway, the rest stays still', () => {
    expect(ambientKind('env_cloud_1')).toBe('drift');
    expect(ambientKind('env_cloud_2')).toBe('drift');
    expect(ambientKind('env_trees_mid')).toBe('sway');
    expect(ambientKind('env_ground_grass')).toBe('sway');
    expect(ambientKind('env_sky')).toBeNull();
    expect(ambientKind('prop_pig_house')).toBeNull();
  });

  it('a cloud moves right at cloudSpeedPx and wraps around once fully off-scene', () => {
    expect(driftX(100, 50, 1600, 1000)).toBeCloseTo(100 + FARM_VIEW.AMBIENT.cloudSpeedPx);
    expect(driftX(1649, 50, 1600, 1000)).toBe(-50);
  });
});

describe('sick tint fade (§11.3 PIG_TREATED)', () => {
  it('blends from white to the sick tint', () => {
    expect(mixTint(FARM_VIEW.SICK_TINT, 0)).toBe(0xffffff);
    expect(mixTint(FARM_VIEW.SICK_TINT, 1)).toBe(FARM_VIEW.SICK_TINT);
    const half = mixTint(0x000000, 0.5);
    expect(half).toBe(0x808080);
  });
});

describe('ui icons (R12A)', () => {
  it('every UI_ICON id exists in manifest.ui', () => {
    const ids = new Set(manifestJson.ui.map((r) => r.id));
    for (const id of Object.values(UI_ICON)) expect(ids.has(id), id).toBe(true);
  });
});
