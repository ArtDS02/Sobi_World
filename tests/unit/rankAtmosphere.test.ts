// Decision 056: a rank's look is atmosphere (light and life added by code), not pasted sprites; plus the skin backdrops.
import { describe, expect, it } from 'vitest';
import { PLOT_SKINS, skinBackdropArt, skinBuildingArt, SKIN_BACKDROP_IDS, SKIN_BACKDROP_READY, SKIN_BUILDING_IDS, SKIN_BUILDING_PARTS, SKIN_BUILDING_READY } from '../../src/core/config/plotSkins';
import { ATMOSPHERE, atmosphereAt, ATMOSPHERE_MAX, breathe, particleCounts } from '../../src/systems/animation/rankAtmosphere';
import { RANK_SPRITES_ON } from '../../src/systems/animation/rankScenery';

describe('atmosphere by rank', () => {
  it('rank 1 adds nothing; every figure rises (never falls) with the rank', () => {
    expect(Object.values(atmosphereAt(1)).every((v) => v === 0)).toBe(true);
    for (let r = 2; r <= 5; r += 1) {
      const a = atmosphereAt(r);
      const b = atmosphereAt(r - 1);
      for (const k of Object.keys(a) as (keyof typeof a)[]) expect(a[k], `${k} at rank ${r}`).toBeGreaterThanOrEqual(b[k]);
    }
  });
  it('never asks for more than the scene builds', () => {
    for (const a of ATMOSPHERE) {
      expect(a.rays).toBeLessThanOrEqual(ATMOSPHERE_MAX.rays);
      expect(a.sparkles).toBeLessThanOrEqual(ATMOSPHERE_MAX.sparkles);
      expect(a.petals).toBeLessThanOrEqual(ATMOSPHERE_MAX.petals);
      expect(a.fireflies).toBeLessThanOrEqual(ATMOSPHERE_MAX.fireflies);
      expect(a.glow).toBeLessThan(0.3); // a bloom that stays gentle over the plots
    }
    for (let r = 1; r <= 5; r += 1) for (const k of ['petal', 'firefly', 'both', 'none'] as const) {
      const c = particleCounts(r, k);
      expect(c.petals).toBeLessThanOrEqual(ATMOSPHERE_MAX.petals);
      expect(c.fireflies).toBeLessThanOrEqual(ATMOSPHERE_MAX.fireflies);
    }
  });
  it('a skin picks its particles: petals only, fireflies only, both, or none', () => {
    expect(particleCounts(5, 'none')).toEqual({ petals: 0, fireflies: 0 });
    expect(particleCounts(5, 'petal').fireflies).toBe(0);
    expect(particleCounts(5, 'petal').petals).toBeGreaterThan(0);
    expect(particleCounts(5, 'firefly').petals).toBe(0);
    expect(particleCounts(5, 'firefly').fireflies).toBeGreaterThan(0);
    expect(particleCounts(2, 'petal')).toEqual({ petals: 0, fireflies: 0 });
  });
  it('breathing is constant when motion is reduced and moves otherwise', () => {
    expect(breathe(0, 1000, 0, true)).toBe(breathe(777, 1000, 0, true));
    expect(breathe(0, 1000)).not.toBe(breathe(250, 1000));
  });
  it('the pasted sprites are off in the game', () => {
    expect(RANK_SPRITES_ON).toBe(false);
  });
});

describe('skin backdrops', () => {
  it('only delivered skins have one; an undelivered skin keeps the plain backdrop', () => {
    for (const s of PLOT_SKINS) {
      const ready = SKIN_BACKDROP_READY.includes(s.id);
      expect(skinBackdropArt(s.id, 'cloud') !== null).toBe(ready);
    }
    expect(skinBackdropArt(null, 'cloud')).toBeNull();
    expect(SKIN_BACKDROP_IDS('garden')).toEqual(SKIN_BACKDROP_READY.map((id) => `bg_garden_${id}`));
  });
});

describe('skin buildings', () => {
  it('a building keeps its plain art unless the skin\'s themed set was delivered for that Area', () => {
    expect(skinBuildingArt('bld_feed_mill', null, 'garden')).toBe('bld_feed_mill');
    expect(skinBuildingArt('bld_feed_mill', 'nope', 'garden')).toBe('bld_feed_mill');
    for (const area of ['cloud', 'garden'] as const) {
      expect(SKIN_BUILDING_IDS(area)).toHaveLength(SKIN_BUILDING_READY[area].length * SKIN_BUILDING_PARTS[area].length);
      for (const skin of SKIN_BUILDING_READY[area]) expect(skinBuildingArt(SKIN_BUILDING_PARTS[area][0]!, skin, area)).toBe(`${SKIN_BUILDING_PARTS[area][0]}_${skin}`);
    }
  });
  it('lists the buildings of each Area that a skin re-themes', () => {
    expect(SKIN_BUILDING_PARTS.cloud).toEqual(['bld_cloud_spring', 'bld_cauldron']);
    expect(SKIN_BUILDING_PARTS.garden).toEqual(['bld_feed_mill', 'bld_composter', 'bld_sprinkler']);
  });
});
