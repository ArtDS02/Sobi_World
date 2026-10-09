import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { parseManifest, type AssetManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { SEASON_BY_MONTH, SEASON_IDS, SEASON_LOOKS } from '../../src/core/config/seasons';
import { activeSeason, parseSeason, seasonFile, seasonOfMonth } from '../../src/core/engine/season';
import { farmLoadList, seasonLoadList, seasonalTextureKey } from '../../src/areas/farm/scene/view/textureKeys';

function manifest(): AssetManifest {
  const r = parseManifest(structuredClone(manifestJson));
  if (!r.ok) throw new Error(r.message);
  return r.manifest;
}
const reg = createAssetRegistry(manifest());

describe('season of the farm (SE-1)', () => {
  it('every month has a season and every season has months and a look', () => {
    for (let m = 1; m <= 12; m++) expect(SEASON_IDS).toContain(SEASON_BY_MONTH[m]);
    for (const s of SEASON_IDS) {
      expect(Object.values(SEASON_BY_MONTH)).toContain(s);
      expect(SEASON_LOOKS[s].backdrop.hills.length).toBeGreaterThan(0);
    }
    expect(seasonOfMonth(2)).toBe('spring');
    expect(seasonOfMonth(10)).toBe('autumn');
    expect(seasonOfMonth(12)).toBe('winter');
    expect(seasonOfMonth(13)).toBe('summer');
  });

  it('a preview wins over the calendar; parse rejects unknown names', () => {
    expect(activeSeason(7, 'winter')).toBe('winter');
    expect(activeSeason(7, null)).toBe('summer');
    expect(parseSeason('autumn')).toBe('autumn');
    expect(parseSeason('monsoon')).toBeNull();
    expect(parseSeason(null)).toBeNull();
  });
});

describe('seasonal art (SE-1)', () => {
  it('main buildings have all four seasons; a row without variants falls back to its default', () => {
    for (const id of ['prop_pig_house', 'prop_hay_shed', 'prop_shop_stall', 'prop_order_board']) {
      for (const s of SEASON_IDS) {
        expect(reg.seasonalFile(id, s)).toBe(seasonFile(s));
        expect(seasonalTextureKey(reg, id, s)).toBe(`${id}_season_${s}`);
      }
    }
    expect(reg.seasonalFile('prop_mud_puddle', 'winter')).toBe('asset');
    expect(seasonalTextureKey(reg, 'prop_mud_puddle', 'winter')).toBe('prop_mud_puddle');
  });

  it('preload carries only the current season; a season list has only its own variants', () => {
    const keys = (s?: 'winter') => farmLoadList(reg, [], s).images.map((i) => i.key);
    expect(keys().some((k) => k.includes('_season_'))).toBe(false);
    const winter = keys('winter');
    expect(winter).toContain('prop_pig_house_season_winter');
    expect(winter).toContain('prop_pig_house'); // the default stays loaded as fallback
    expect(winter.some((k) => /_season_(spring|summer|autumn)$/.test(k))).toBe(false);
    const spring = seasonLoadList(reg, 'spring').images.map((i) => i.key);
    expect(spring.length).toBeGreaterThan(0);
    expect(spring.every((k) => k.endsWith('_season_spring'))).toBe(true);
  });

  it('the manifest rejects an unknown season key', () => {
    const m = manifest() as unknown as { buildings: { seasons?: Record<string, string> }[] };
    m.buildings[0]!.seasons = { monsoon: 'buildings/x.png' };
    expect(parseManifest(m).ok).toBe(false);
  });
});
