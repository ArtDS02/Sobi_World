import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { parseManifest, type AssetManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry, troughState } from '../../src/core/assets/registry';
import { AUDIO_KEYS, FX_IDS } from '../../src/core/config/assetIds';
import { BREEDS } from '../../src/core/config/breeds';
import { SKINS } from '../../src/core/config/skins';
import { loadAssetRegistry, MANIFEST_URL } from '../../src/platform/assetSource';

function manifest(): AssetManifest {
  const r = parseManifest(structuredClone(manifestJson));
  if (!r.ok) throw new Error(r.message);
  return r.manifest;
}

describe('manifest v2 (art standard §7.2)', () => {
  it('the shipped manifest passes the schema', () => {
    expect(parseManifest(manifestJson).ok).toBe(true);
  });

  it('rejects bad ids, unknown sections shapes and wrong version, with paths in the message', () => {
    const bad = structuredClone(manifestJson) as Record<string, unknown> & {
      pigs: { id: string }[];
    };
    bad.pigs[0]!.id = 'Pig-Classic';
    bad.version = 1;
    const r = parseManifest(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('pigs.0.id');
      expect(r.message).toContain('version');
    }
  });

  it('a prop needs exactly one of asset / states', () => {
    const bad = structuredClone(manifestJson) as { props: Record<string, unknown>[] };
    bad.props[1]!.states = { full: 'props/x.png' };
    expect(parseManifest(bad).ok).toBe(false);
  });

  it('covers v1 scope: 4 defaults + 13 P1 skins, 8 fx, 12 audio keys', () => {
    const m = manifest();
    expect(m.pigs).toHaveLength(17);
    expect(m.fx.map((f) => f.id).sort()).toEqual([...FX_IDS].sort());
    expect(m.audio.map((a) => a.id)).toEqual([...AUDIO_KEYS]);
    expect(m.layout.designSize).toEqual({ width: 1600, height: 900 });
  });
});

describe('asset registry (spec §11.4)', () => {
  const reg = createAssetRegistry(manifest());

  it('resolve and url go through the manifest; url is relative', () => {
    expect(reg.resolve('fx_zzz')?.section).toBe('fx');
    expect(reg.url('pig_classic')).toBe('assets/pigs/base/pig_classic.png');
    expect(reg.url('prop_feed_trough', 'half')).toBe('assets/props/prop_feed_trough_half.png');
    expect(reg.url('nope')).toBeNull();
  });

  it('unknown skin falls back to the breed default', () => {
    const t = reg.pigTexture('pig_does_not_exist', 'PIG_STRIPED_MELON');
    expect(t.skinId).toBe('pig_watermelon');
    expect(t.url).toBe(reg.url('pig_watermelon'));
  });

  it('sleep: own frame when present, else idle + fx_zzz (DECISIONS Q5)', () => {
    const withSleep = manifest();
    withSleep.pigs.find((p) => p.id === 'pig_classic')!.sleepAsset =
      'pigs/base/pig_classic_sleep.png';
    expect(
      createAssetRegistry(withSleep).pigTexture('pig_classic', 'PIG_EARTH_PINK', true),
    ).toEqual({
      skinId: 'pig_classic',
      url: 'assets/pigs/base/pig_classic_sleep.png',
      overlay: null,
    });
    // A skin without its own sleep frame (rarer skins, AI pack §3.3).
    const m = manifest();
    m.pigs.find((p) => p.id === 'pig_white')!.sleepAsset = null;
    const noSleep = createAssetRegistry(m);
    const white = noSleep.pigTexture('pig_white', 'PIG_EARTH_PINK', true);
    expect(white.url).toBe(noSleep.url('pig_white'));
    expect(white.overlay).toBe('fx_zzz');
    expect(noSleep.pigTexture('pig_white', 'PIG_EARTH_PINK').overlay).toBeNull();
  });

  it('trough state by food: 0 → empty, ≤ half → half, else full', () => {
    expect(troughState(0, 20)).toBe('empty');
    expect(troughState(10, 20)).toBe('half');
    expect(troughState(11, 20)).toBe('full');
    expect(reg.troughUrl(0, 20)).toBe('assets/props/prop_feed_trough_empty.png');
  });

  it('placements sorted back to front, filterable by layer, roles present', () => {
    const layers = reg.placements().map((p) => p.layer);
    expect(layers).toEqual([...layers].sort((a, b) => a - b));
    expect(reg.placements(0).every((p) => p.layer === 0)).toBe(true);
    expect(reg.placements().find((p) => p.role === 'trough')?.id).toBe('prop_feed_trough');
  });

  it('SkinRegistry reads prices, rarity and unlocks from the manifest (DECISIONS C2)', () => {
    expect(reg.skins.forSale()).toHaveLength(13);
    expect(reg.skins.get('pig_tet')).toMatchObject({
      priceGold: 2000,
      rarity: 'P1',
      unlock: { kind: 'LEVEL', level: 3 },
    });
    expect(reg.skins.get('pig_classic')?.priceGold).toBeNull();
  });

  it('breed defaults in skins.ts agree with their manifest rows', () => {
    for (const breed of Object.values(BREEDS)) {
      const fromConfig = SKINS[breed.defaultSkin]!;
      const fromManifest = reg.skins.get(breed.defaultSkin)!;
      expect(fromManifest).toMatchObject({
        nameVi: fromConfig.nameVi,
        rarity: fromConfig.rarity,
        priceGold: null,
      });
    }
  });
});

describe('asset source (src/platform)', () => {
  const ok = (body: unknown) => async () => ({ ok: true, status: 200, json: async () => body });

  it('fetches the relative manifest URL and builds the registry', async () => {
    const urls: string[] = [];
    const r = await loadAssetRegistry(async (u) => {
      urls.push(u);
      return ok(manifestJson)();
    });
    expect(urls).toEqual(['assets/manifest/assets.json']);
    expect(MANIFEST_URL.startsWith('/')).toBe(false);
    expect(r.ok && r.registry.resolve('pig_classic')).toBeTruthy();
  });

  it('invalid manifest, HTTP error and network error become a message', async () => {
    expect(await loadAssetRegistry(ok({ version: 2 }))).toMatchObject({ ok: false });
    expect(
      await loadAssetRegistry(async () => ({ ok: false, status: 404, json: async () => null })),
    ).toEqual({ ok: false, message: `${MANIFEST_URL}: HTTP 404` });
    const r = await loadAssetRegistry(async () => {
      throw new Error('offline');
    });
    expect(r).toEqual({ ok: false, message: `${MANIFEST_URL}: offline` });
  });
});

describe('no asset file names in src/ (spec §14.9)', () => {
  it('no .png / .ogg / .mp3 literal outside the manifest', () => {
    const sources = import.meta.glob<string>('/src/**/*.{ts,scss}', {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    const hits = Object.entries(sources).filter(([, text]) => /\.(png|ogg|mp3)\b/.test(text));
    expect(Object.keys(sources).length).toBeGreaterThan(20);
    expect(hits.map(([f]) => f)).toEqual([]);
  });
});
