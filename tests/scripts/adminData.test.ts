import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { appendPigRowsText, type SpeciesRowData } from '../../scripts/admin/speciesText';
import { readContent, speciesFileValue } from '../../scripts/admin/contentFiles';
import { contentJson } from '../../scripts/content/format';
import { artState, validateSpecies, type PigArtRow, type ValidateInput } from '../../scripts/admin/validate';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { FAMILY_VALUES, RARITY_TIER } from '../../src/areas/farm/logic/config/breeds';
import { BREED_ID_VALUES } from '../../src/areas/farm/logic/config/ids';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { SPECIES_ROWS } from '../../src/areas/farm/logic/config/speciesTable';

const MANIFEST = 'public/assets/manifest/assets.json';
const pigs = (JSON.parse(readFileSync(MANIFEST, 'utf8')) as { pigs: PigArtRow[] }).pigs;
const files = new Set(readdirSync('public/assets/pigs/base').map((f) => `pigs/base/${f}`));
const rows = SPECIES_ROWS.map((r) => ({ ...r })) as SpeciesRowData[];
const input = (patch: Partial<ValidateInput> = {}): ValidateInput => ({
  rows,
  pigs,
  files,
  savedIds: BREED_ID_VALUES,
  rarities: RARITY_VALUES,
  families: FAMILY_VALUES,
  tiers: RARITY_TIER,
  maxLevel: BALANCE.MAX_LEVEL,
  ...patch,
});
const errors = (i: ValidateInput) => validateSpecies(i).filter((x) => x.level === 'error');
const withRow = (id: string, patch: Partial<SpeciesRowData>) =>
  rows.map((r) => (r.id === id ? { ...r, ...patch } : r));

describe('admin species text', () => {
  it('re-renders content/farm/species.json byte for byte (admin saves leave no noise)', () => {
    const file = readFileSync('content/farm/species.json', 'utf8').replace(/\r\n/g, '\n');
    expect(contentJson(speciesFileValue(rows, readContent('farm/species.json')))).toBe(file);
  });

  it('a new species gets no traits; existing ones keep theirs', () => {
    const value = speciesFileValue([...rows, { ...rows[0]!, id: 'PIG_ZZ', artId: 'pig_zz' }], readContent('farm/species.json'));
    expect(value.species.at(-1)).toMatchObject({ id: 'PIG_ZZ', traits: [] });
    expect(value.species[0]!.traits).toEqual(['pink', 'farm']);
  });

  it('appends manifest pig rows that parse and keep the other sections', () => {
    const text = readFileSync(MANIFEST, 'utf8');
    const next = JSON.parse(
      appendPigRowsText(text, [{ id: 'pig_zz', nameVi: 'Heo Z', asset: 'pigs/base/pig_zz.png', tags: ['species', 'new'] }]),
    ) as { pigs: PigArtRow[]; fx: unknown[] };
    expect(next.pigs.at(-1)).toMatchObject({ id: 'pig_zz', status: 'production', sleepAsset: null });
    expect(next.pigs.length).toBe(pigs.length + 1);
    expect(next.fx.length).toBeGreaterThan(0);
  });
});

describe('admin validation', () => {
  it('the shipped data has no errors and every species has its right-facing art', () => {
    expect(errors(input())).toEqual([]);
    for (const r of rows) expect(artState(r.artId, pigs, files).complete, r.id).toBe(true);
  });

  it('every pig file on disk is registered and every registered art exists', () => {
    for (const p of pigs) expect(existsSync(`public/assets/${p.asset}`), p.id).toBe(true);
    expect(validateSpecies(input()).filter((i) => i.text.startsWith('File chưa'))).toEqual([]);
  });

  it('catches duplicate ids, shared art, missing files and deleted species', () => {
    const dup = [...rows, { ...rows[0]!, artId: 'pig_nope' }];
    expect(errors(input({ rows: dup })).map((i) => i.text).join('\n')).toMatch(/Trùng ID/);
    expect(errors(input({ rows: withRow('PIG_WHITE', { artId: 'pig_classic' }) })).some((i) => /Trùng ảnh/.test(i.text))).toBe(true);
    expect(errors(input({ files: new Set() })).some((i) => /Thiếu file/.test(i.text))).toBe(true);
    expect(errors(input({ rows: rows.slice(1) })).some((i) => /Không được xoá/.test(i.text))).toBe(true);
  });

  it('enforces the config rules the unit tests check', () => {
    const bad = (id: string, patch: Partial<SpeciesRowData>) => errors(input({ rows: withRow(id, patch) }));
    expect(bad('PIG_EARTH_PINK', { buyGold: 5000 }).some((i) => /Giá mua/.test(i.text))).toBe(true);
    expect(bad('PIG_EARTH_PINK', { sellGold: 99999 }).some((i) => /Giá bán phải thấp hơn/.test(i.text))).toBe(true);
    expect(bad('PIG_MYTHICAL', { breedable: true }).length).toBeGreaterThan(0);
    expect(bad('PIG_EARTH_PINK', { unlockLevel: 99 }).some((i) => /Cấp mở khoá/.test(i.text))).toBe(true);
    expect(bad('PIG_EARTH_PINK', { family: 'NOPE' }).some((i) => /Nhóm/.test(i.text))).toBe(true);
  });
});
