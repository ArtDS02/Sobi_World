import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { parseManifest, type AssetManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry, troughState } from '../../src/core/assets/registry';
import { AUDIO_KEYS, FX_IDS } from '../../src/core/config/assetIds';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
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

  it('covers scope: one art row per species, fx, audio keys', () => {
    const m = manifest();
    // Outfits were removed in A2 (DECISIONS A2-1): pig rows are species art only.
    expect(m.pigs).toHaveLength(BREED_IDS.length);
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

  it('pig texture is the species art row', () => {
    const t = reg.pigTexture('PIG_STRIPED_MELON');
    expect(t.artId).toBe('pig_watermelon');
    expect(t.url).toBe(reg.url('pig_watermelon'));
  });

  it('missing art row → url null (flat fill)', () => {
    const m = manifest();
    m.pigs = m.pigs.filter((p) => p.id !== 'pig_watermelon');
    expect(createAssetRegistry(m).pigTexture('PIG_STRIPED_MELON')).toMatchObject({
      artId: 'pig_watermelon',
      url: null,
    });
  });

  it('sleep: own frame when present, else idle + fx_zzz (DECISIONS Q5)', () => {
    const withSleep = manifest();
    withSleep.pigs.find((p) => p.id === 'pig_classic')!.sleepAsset =
      'pigs/base/pig_classic_sleep.png';
    expect(
      createAssetRegistry(withSleep).pigTexture('PIG_EARTH_PINK', true),
    ).toEqual({
      artId: 'pig_classic',
      url: 'assets/pigs/base/pig_classic_sleep.png',
      overlay: null,
    });
    // Art without its own sleep frame (AI pack §3.3).
    const m = manifest();
    m.pigs.find((p) => p.id === 'pig_white')!.sleepAsset = null;
    const noSleep = createAssetRegistry(m);
    const white = noSleep.pigTexture('PIG_WHITE', true);
    expect(white.url).toBe(noSleep.url('pig_white'));
    expect(white.overlay).toBe('fx_zzz');
    expect(noSleep.pigTexture('PIG_WHITE').overlay).toBeNull();
  });

  it('trough state by food: 0 → empty, ≤ half → half, else full', () => {
    expect(troughState(0, 20)).toBe('empty');
    expect(troughState(10, 20)).toBe('half');
    expect(troughState(11, 20)).toBe('full');
    expect(reg.troughUrl(0, 20)).toBe('assets/props/prop_feed_trough_empty.png');
  });

  it('buildings and props: every row has its file, decor cut at catalogue size (A4)', () => {
    const m = manifest();
    for (const row of [...m.buildings, ...m.props]) {
      expect(row.status, row.id).not.toBe('placeholder');
      expect(reg.url(row.id, row.asset ? 'asset' : 'full'), row.id).not.toBeNull();
    }
    for (const id of ['prop_red_tree', 'prop_sunflower', 'prop_bush', 'prop_mushroom'])
      expect(m.layout.placements.some((p) => p.id === id), id).toBe(true);
  });

  it('a painted sign replaces the text tag only on clickable objects (A4)', () => {
    for (const p of reg.placements().filter((x) => x.signed)) expect(p.action, p.id).toBeDefined();
    // The pig house art (user art, farm layout rework) carries its own "Chuồng Heo" sign.
    expect(reg.placements().find((p) => p.id === 'prop_pig_house')?.signed).toBe(true);
  });

  it('placements sorted back to front, filterable by layer, roles present', () => {
    const layers = reg.placements().map((p) => p.layer);
    expect(layers).toEqual([...layers].sort((a, b) => a - b));
    expect(reg.placements(0).every((p) => p.layer === 0)).toBe(true);
    expect(reg.placements().find((p) => p.role === 'trough')?.id).toBe('prop_feed_trough');
  });

  it('every species has an art row; pig rows are species art only (DECISIONS A2-1)', () => {
    const arts = new Set(Object.values(BREEDS).map((b) => b.artId));
    for (const id of arts) expect(reg.resolve(id)?.section, id).toBe('pigs');
    for (const row of reg.manifest.pigs) expect(arts.has(row.id), row.id).toBe(true);
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
