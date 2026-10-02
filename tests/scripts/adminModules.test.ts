// Admin dashboard modules (DECISIONS AD-1): list query, validation rules, source-block writers,
// layout model, user (save) edits, save folders and the asset → species → game texture chain.
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pngSize } from '../../scripts/admin/artFiles';
import { pairsBlock, productsBlock, replaceBlock, replacePlacementsText } from '../../scripts/admin/configBlocks';
import { layoutIssues, pairIssues, productIssues, type PairRuleRow, type ProductRow } from '../../scripts/admin/rules';
import { archiveProfile, listProfiles, readProfile, writeProfile } from '../../scripts/admin/saves';
import { appendPigRowsText } from '../../scripts/admin/speciesText';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { manifestSchema } from '../../src/core/assets/manifestSchema';
import { TROUGH_PROP_ID } from '../../src/core/config/assetIds';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import { PAIR_RULES } from '../../src/core/config/breedingPairs';
import { ITEM_ID_VALUES } from '../../src/core/config/ids';
import { CURRENCY_VALUES, PRODUCT_CATEGORY_VALUES, PRODUCTS } from '../../src/core/config/products';
import { mulberry32 } from '../../src/core/rng';
import { parseSave } from '../../src/core/save/migrate';
import { newGame } from '../../src/core/save/newGame';
import { History, add, duplicate, reorder, type Placement } from '../../tools/admin/layoutModel';
import { activeCount, byText, emptyState, fold, runQuery } from '../../tools/admin/listQuery';
import * as E from '../../tools/admin/userEdits';

const MANIFEST = 'public/assets/manifest/assets.json';
const manifestText = readFileSync(MANIFEST, 'utf8').replace(/\r\n/g, '\n');
const manifest = JSON.parse(manifestText) as Record<string, { id: string }[]> & { layout: { placements: Placement[] } };
const artIds = new Set(Object.entries(manifest).flatMap(([k, v]) => (Array.isArray(v) && k !== 'pigs' ? v.map((r) => r.id) : [])));

describe('list query', () => {
  const rows = [
    { id: 'PIG_DRAGON', name: 'Heo Rồng', family: 'MYTHIC' },
    { id: 'PIG_PINK', name: 'Heo Hồng', family: 'FARM' },
    { id: 'PIG_BOAR', name: 'Heo Rừng', family: 'WILD' },
  ];
  const q = {
    text: (r: (typeof rows)[number]) => [r.id, r.name],
    filters: [{ key: 'family', label: '', options: [], test: (r: (typeof rows)[number], v: string) => r.family === v }],
    sorts: [{ key: 'az', label: '', compare: byText((r: (typeof rows)[number]) => r.name) }],
    pageSize: 2,
  };
  it('searches accent-insensitively on every word, filters, sorts and pages', () => {
    expect(fold('Heo Rồng Đỏ')).toBe('heo rong do');
    expect(runQuery(rows, q, { ...emptyState('az'), q: 'heo rong' }).rows.map((r) => r.id)).toEqual(['PIG_DRAGON']);
    expect(runQuery(rows, q, { ...emptyState('az'), filters: { family: 'WILD' } }).rows.map((r) => r.id)).toEqual(['PIG_BOAR']);
    const p0 = runQuery(rows, q, emptyState('az'));
    expect([p0.total, p0.pages, p0.rows.map((r) => r.name)]).toEqual([3, 2, ['Heo Hồng', 'Heo Rồng']]);
    expect(runQuery(rows, q, { ...emptyState('az'), page: 9 }).page).toBe(1); // clamped
    expect(activeCount({ ...emptyState(), q: 'x', filters: { a: '1', b: '' } })).toBe(2);
  });
});

describe('product rules', () => {
  const rules = { itemIds: ITEM_ID_VALUES, categories: PRODUCT_CATEGORY_VALUES, currencies: CURRENCY_VALUES, assetIds: artIds, shippedIds: PRODUCTS.map((p) => p.id) };
  const rows = PRODUCTS.map((p) => ({ ...p })) as ProductRow[];
  const errors = (r: ProductRow[]) => productIssues(r, rules).filter((i) => i.level === 'error');
  it('the shipped products are valid', () => expect(errors(rows)).toEqual([]));
  it('refuses bad ids, prices, quantities, icons, duplicates and deleting a shipped product', () => {
    const bad = (patch: Partial<ProductRow>) => errors([...rows, { ...rows[0]!, id: 'NEW_ONE', ...patch }]).map((i) => i.text).join();
    expect(bad({ id: 'bad id' })).toMatch(/ID/);
    expect(bad({ priceGold: 0 })).toMatch(/Giá/);
    expect(bad({ quantity: 1000 })).toMatch(/Số lượng/);
    expect(bad({ icon: 'nope' })).toMatch(/Icon/);
    expect(bad({ itemId: 'GOLDEN_APPLE' })).toMatch(/Vật phẩm/);
    expect(bad({ id: rows[0]!.id })).toMatch(/Trùng/);
    expect(errors(rows.slice(1)).map((i) => i.text).join()).toMatch(/Không được xoá/);
  });
  it('rewrites the PRODUCTS block byte for byte', () => {
    const src = readFileSync('src/core/config/products.ts', 'utf8').replace(/\r\n/g, '\n');
    expect(replaceBlock(src, 'products', productsBlock(PRODUCTS))).toBe(src);
  });
});

describe('breeding pair rules', () => {
  const breeds = Object.fromEntries(BREED_IDS.map((id) => [id, { breedable: BREEDS[id].breedable, enabled: BREEDS[id].enabled }]));
  const r = (id: string, a: string, b: string, outcomes: [string, number][]): PairRuleRow => ({
    id, parents: [a, b], outcomes: outcomes.map(([breed, percent]) => ({ breed, percent })), active: true,
  });
  const errs = (rows: PairRuleRow[]) => pairIssues(rows, { breeds, epsilon: 0.01 }).filter((i) => i.level === 'error').map((i) => i.text);
  it('accepts a rule summing to 100 (decimals allowed)', () => {
    expect(errs([r('PAIR_001', 'PIG_WHITE', 'PIG_BLACK', [['PIG_WHITE', 33.33], ['PIG_BLACK', 33.33], ['PIG_PANDA', 33.34]])])).toEqual([]);
  });
  it('refuses a wrong total, A+B duplicated as B+A, repeated outcomes, unknown or unbreedable parents', () => {
    expect(errs([r('PAIR_001', 'PIG_WHITE', 'PIG_BLACK', [['PIG_WHITE', 90]])]).join()).toMatch(/Tổng tỷ lệ = 90/);
    const ab = r('PAIR_001', 'PIG_WHITE', 'PIG_BLACK', [['PIG_WHITE', 100]]);
    expect(errs([ab, { ...ab, id: 'PAIR_002', parents: ['PIG_BLACK', 'PIG_WHITE'] }]).join()).toMatch(/Trùng cặp/);
    expect(errs([r('PAIR_001', 'PIG_WHITE', 'PIG_BLACK', [['PIG_WHITE', 50], ['PIG_WHITE', 50]])]).join()).toMatch(/lặp/);
    expect(errs([r('PAIR_001', 'PIG_NOPE', 'PIG_BLACK', [['PIG_WHITE', 100]])]).join()).toMatch(/không tồn tại/);
    const legend = BREED_IDS.find((id) => !BREEDS[id].breedable)!;
    expect(errs([r('PAIR_001', legend, 'PIG_BLACK', [['PIG_WHITE', 100]])]).join()).toMatch(/không lai được/);
  });
  it('rewrites the PAIR_RULES block byte for byte and as parseable rows', () => {
    const src = readFileSync('src/core/config/breedingPairs.ts', 'utf8').replace(/\r\n/g, '\n');
    expect(replaceBlock(src, 'breedingPairs', pairsBlock(PAIR_RULES))).toBe(src);
    const one = pairsBlock([{ id: 'PAIR_001', parents: ['PIG_WHITE', 'PIG_BLACK'], outcomes: [{ breed: 'PIG_PANDA', percent: 100 }], active: true, note: 'x"y' }]);
    expect(one).toContain('{ id: "PAIR_001", parents: ["PIG_WHITE", "PIG_BLACK"], outcomes: [{ breed: "PIG_PANDA", percent: 100 }], active: true, note: "x\\"y" }');
  });
});

describe('layout', () => {
  const list = manifest.layout.placements;
  it('the shipped layout is valid and its placements text round-trips byte for byte', () => {
    expect(layoutIssues(list, { assetIds: artIds, troughId: TROUGH_PROP_ID }).filter((i) => i.level === 'error')).toEqual([]);
    expect(replacePlacementsText(manifestText, list)).toBe(manifestText);
  });
  it('writes edited placements that the manifest schema still parses', () => {
    const next = add(list, 'prop_rock', 800, 600, { width: 1600, height: 900 }, 4, 90).map((p, i) => (i === 0 ? { ...p, rotation: 12, flipX: true, visible: false } : p));
    const text = replacePlacementsText(manifestText, next);
    expect(manifestSchema.parse(JSON.parse(text)).layout.placements).toHaveLength(list.length + 1);
  });
  it('duplicate drops unique roles; a second trough is an error', () => {
    const t = list.findIndex((p) => p.role === 'trough');
    const dup = duplicate(list, t);
    expect(dup[t + 1]!.role).toBeUndefined();
    expect(layoutIssues([...list, list[t]!], { assetIds: artIds, troughId: TROUGH_PROP_ID }).some((i) => /1 máng/.test(i.text))).toBe(true);
  });
  it('reorders inside a layer and undoes', () => {
    const l: Placement[] = [{ id: 'a', layer: 4, x: 0, y: 0 }, { id: 'x', layer: 0, x: 0, y: 0 }, { id: 'b', layer: 4, x: 0, y: 0 }];
    expect(reorder(l, 0, 'up').list.map((p) => p.id)).toEqual(['x', 'b', 'a']);
    expect(reorder(l, 2, 'back').list.map((p) => p.id)).toEqual(['b', 'a', 'x']);
    const h = new History();
    h.push(l);
    expect(h.undo([])).toEqual(l);
    expect(h.redo(l)).toEqual([]);
  });
});

describe('user (save) edits', () => {
  const rng = mulberry32(3);
  const s0 = newGame({ now: 1000, rng });
  it('gold moves through one ADMIN_ADJUST transaction; XP keeps the trough rule', () => {
    const s = E.apply(s0, E.setGold(12345, 2000, rng));
    expect(s.player.gold).toBe(12345);
    expect(s.transactions[0]).toMatchObject({ type: 'ADMIN_ADJUST', amount: 12345 - s0.player.gold });
    const lv = E.apply(s, E.setXp(5700));
    expect(E.summary(lv).level).toBe(10);
    expect(lv.trough.capacity).toBeGreaterThan(s0.trough.capacity);
  });
  it('refuses edits the game could not load', () => {
    const withPig = E.apply(s0, E.addPig('PIG_EARTH_PINK', 'FEMALE', 'Mít', 1, 'p1'));
    const two = E.apply(withPig, E.addPig('PIG_BLACK', 'MALE', 'Đen', 1, 'p2'));
    expect(() => E.apply(two, E.setSlots(1))).toThrow(/ít nhất 2/);
    expect(() => E.apply(withPig, E.patchPig('p1', { name: '' }))).toThrow();
    expect(() => E.apply({ ...withPig, player: { ...withPig.player, unlockedSlots: 1 } }, E.addPig('PIG_EARTH_PINK', 'MALE', 'B', 1, 'p2'))).toThrow(/chuồng/);
    const reset = E.apply(withPig, E.resetSave(5, rng));
    expect(reset.pigs).toEqual([]);
    expect(parseSave(JSON.stringify(reset)).ok).toBe(true);
  });
});

describe('save folders', () => {
  const root = mkdtempSync(join(tmpdir(), 'unin-admin-'));
  const dir = join(root, 'Un In Homemade Dev', 'saves');
  mkdirSync(dir, { recursive: true });
  const save = newGame({ now: 1, rng: mulberry32(1) });
  writeFileSync(join(dir, 'save.json'), JSON.stringify(save));
  mkdirSync(join(root, 'Other App', 'saves'), { recursive: true });
  const ok = () => null;
  it('lists only the game folders and reads a save', () => {
    const [p, ...rest] = listProfiles(root);
    expect(rest).toEqual([]);
    expect(p!.app).toBe('Un In Homemade Dev');
    expect((readProfile(p!.id, root).body as { json: string }).json).toBe(JSON.stringify(save));
    expect(readProfile(Buffer.from('../../etc/saves').toString('base64url'), root).status).toBe(404);
  });
  it('writes with a backup first, refuses a stale base and archives instead of deleting', () => {
    const p = listProfiles(root)[0]!;
    const next = JSON.stringify({ ...save, player: { ...save.player, xp: 9 } });
    expect(writeProfile({ id: p.id, json: next, baseModifiedAt: p.modifiedAt - 5000 }, ok, root).status).toBe(409);
    expect(writeProfile({ id: p.id, json: next, baseModifiedAt: p.modifiedAt }, () => 'SAVE_CORRUPT', root).status).toBe(400);
    const r = writeProfile({ id: p.id, json: next, baseModifiedAt: p.modifiedAt }, ok, root, new Date(2026, 0, 2, 3, 4, 5));
    expect(r.body).toMatchObject({ ok: true, backup: 'save-20260102-030405.json' });
    expect(readFileSync(join(dir, 'save.json'), 'utf8')).toBe(next);
    expect(readFileSync(join(dir, 'backups', 'save-20260102-030405.json'), 'utf8')).toBe(JSON.stringify(save));
    expect(archiveProfile(p.id, root, new Date(2026, 0, 2, 3, 4, 5)).status).toBe(200);
    expect(readdirSync(join(dir, 'backups')).sort()).toEqual(['save-20260102-030405-1.json', 'save-20260102-030405.json']);
    expect(listProfiles(root)).toEqual([]);
    expect(statSync(dir).isDirectory()).toBe(true);
  });
});

describe('asset → species → game texture', () => {
  it('reads PNG sizes and refuses non-PNG bytes', () => {
    expect(pngSize(readFileSync('public/assets/pigs/base/pig_classic.png'))).toEqual({ width: 512, height: 512 });
    expect(pngSize(Buffer.from('not a png at all, really not'))).toBeNull();
  });
  it('a registered art row is a texture the game resolves for a species using it', () => {
    const text = appendPigRowsText(manifestText, [{ id: 'pig_test_new', nameVi: 'Heo Thử', asset: 'pigs/base/pig_test_new.png', tags: ['species', 'new'] }]);
    const reg = createAssetRegistry(manifestSchema.parse(JSON.parse(text)));
    expect(reg.resolve('pig_test_new')?.files.asset).toBe('pigs/base/pig_test_new.png');
    for (const id of BREED_IDS) expect(reg.pigTexture(id).url, id).not.toBeNull();
  });
});
