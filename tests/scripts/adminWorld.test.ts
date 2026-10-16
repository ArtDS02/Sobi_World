// Admin tools: time travel on a save (⏩ Tua thời gian, GĐ2) and the content editor "Nội dung game" (decision 036):
// the catalog covers every content file, shipped ids stay, names in the string tables, the schema-driven forms.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CONTENT_FILES, EDITABLE_FILES, TEXT_TABLES } from '../../scripts/admin/contentCatalog';
import { schemaProblems } from '../../scripts/admin/contentFiles';
import { idProblems, missingNames } from '../../scripts/admin/contentSave';
import { entriesOf, readEntries, readRowTexts, writeEntries } from '../../scripts/admin/i18nText';
import { IDS_FILE, listIn } from '../../scripts/content/ids';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { aquariumOf } from '../../src/areas/aquarium/logic/save/lens';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { mulberry32, sequenceRng } from '../../src/core/rng';
import { rewindFarm } from '../../tools/admin/farmEdits';
import { defaultOf, durationHint, freeId, schemaAt, toJsonSchema } from '../../tools/admin/schemaModel';
import * as W from '../../tools/admin/worldEdits';
import { makePig } from '../unit/pigFactory';
import { makeState } from '../unit/stateFactory';

const H = 3_600_000;
const DAY = 24 * H;
const T = 1_790_000_000_000;
const rng = () => sequenceRng([1 - 1e-12]);

describe('⏩ time travel on a save', () => {
  const farmAt = (t: number) => ({
    ...makeState(
      [makePig({ id: 'a', lastTickedAt: t, createdAt: t - 5 * DAY, growthProgress: 30, lastFedAt: t - H }), makePig({ id: 'b', slotIndex: 1, lastTickedAt: t, createdAt: t, hunger: 70 })],
      60,
    ),
    createdAt: t - 10 * DAY,
    updatedAt: t,
    trough: { food: 60, capacity: 80, level: 2, lastResolvedAt: t },
    gifts: { nextAt: t + 2 * H, boxes: [] },
    orders: [],
  });

  it('every moment moves back by the same amount; absent fields stay absent', () => {
    const s = farmAt(T);
    const r = rewindFarm(DAY)(s);
    expect(r.pigs[0]).toMatchObject({ lastTickedAt: T - DAY, createdAt: T - 6 * DAY, lastFedAt: T - DAY - H });
    expect(r.pigs[1]!.lastFedAt).toBeUndefined();
    expect(Object.hasOwn(r.pigs[1]!, 'lastFedAt')).toBe(false);
    expect(r.trough.lastResolvedAt).toBe(T - DAY);
    expect(r.gifts.nextAt).toBe(T + 2 * H - DAY);
    expect(r.createdAt).toBe(T - 11 * DAY);
  });

  it('the game then catches up exactly as if it had been closed for that long', () => {
    // A save left at T, opened a day later (reference) …
    const reference = advanceWorld(farmAt(T), T + DAY, rng(), 0, 'offline').state;
    // … is the same as the save rewound a day, opened at T.
    const viaAdmin = advanceWorld(rewindFarm(DAY)(farmAt(T)), T, rng(), 0, 'offline').state;
    expect(viaAdmin.trough.food).toBe(reference.trough.food);
    expect(viaAdmin.manure).toBe(reference.manure);
    for (const [i, p] of reference.pigs.entries()) {
      for (const key of ['hunger', 'cleanliness', 'growthProgress', 'energy'] as const) {
        expect(viaAdmin.pigs[i]![key], `${p.id}.${key}`).toBeCloseTo(p[key]!, 6);
      }
    }
  });

  it('+7 days of neglect on an old, unfed farm ends with the pig ill and, once online past the grace, gone', () => {
    const bare = { ...farmAt(T), trough: { food: 0, capacity: 30, level: 1, lastResolvedAt: T }, createdAt: T - 30 * DAY };
    const week = advanceWorld(rewindFarm(7 * DAY)(bare), T, rng(), 0, 'offline').state;
    expect(week.pigs.every((p) => p.isSick)).toBe(true);
    expect(week.graceUntil).toBe(T + 12 * H);
    expect(advanceWorld(week, T + 13 * H, rng()).state.pigs).toEqual([]);
  });
});

describe('⏩ time travel on the world', () => {
  it('every Area moves back together and the save stays valid', () => {
    const rng = mulberry32(2);
    let w = SAVE_CODEC.newWorld({ now: T, rng });
    w = W.apply(w, W.setUnlockedAreas(['sobi_farm', 'sobi_garden', 'sobi_aquarium', 'sobi_cloud', 'sobi_adventure'], T, rng));
    const back = W.apply(w, W.rewind(DAY));
    expect(farmOf(back).trough.lastResolvedAt).toBe(farmOf(w).trough.lastResolvedAt - DAY);
    expect(aquariumOf(back).lastTickedAt).toBe(aquariumOf(w).lastTickedAt - DAY);
    expect(W.saveProblems(back)).toEqual([]);
  });
});

const schemaOf = async (file: string) => {
  const def = EDITABLE_FILES.find((f) => f.file === file)!;
  const mod = (await import(/* @vite-ignore */ `../..${def.schemaPath}`)) as Record<string, unknown>;
  return mod[def.exportName!] as z.ZodType;
};

describe('Nội dung game: the catalog', () => {
  it('lists every content file (each one editable here or on its own page)', () => {
    const files = ['shared', 'breeding', 'farm', 'plaza', 'garden', 'aquarium', 'cloud', 'adventure'].flatMap((d) =>
      readdirSync(`content/${d}`).filter((f) => f.endsWith('.json')).map((f) => `${d}/${f}`));
    expect(CONTENT_FILES.map((f) => f.file).sort()).toEqual(files.sort());
    for (const f of CONTENT_FILES) expect(!!f.page !== !!f.schemaPath, f.file).toBe(true);
  });

  it('every editable file passes its own schema as shipped, and its form schema converts', async () => {
    for (const { file } of EDITABLE_FILES) {
      const schema = await schemaOf(file);
      expect(schemaProblems(schema, JSON.parse(readFileSync(`content/${file}`, 'utf8'))), file).toEqual([]);
      expect(toJsonSchema(schema).type, file).toBe('object');
    }
  });

  it('a value the schema forbids is caught before anything is written', async () => {
    const schema = await schemaOf('shared/health.json');
    const value = JSON.parse(readFileSync('content/shared/health.json', 'utf8'));
    expect(schemaProblems(schema, { ...value, criticalAfterMs: value.deathAfterMs + 1 })).not.toEqual([]);
  });
});

describe('Nội dung game: ids and names', () => {
  const items = JSON.parse(readFileSync('content/shared/items.json', 'utf8')) as { items: { id: string }[] };
  const shipped = listIn(readFileSync(IDS_FILE, 'utf8'), 'ITEM_ID_VALUES');
  it('a shipped id cannot be removed; duplicates and bad ids are refused; a new row is fine', () => {
    expect(idProblems('shared/items.json', items, shipped)).toEqual([]);
    expect(idProblems('shared/items.json', { items: items.items.slice(1) }, shipped).join()).toMatch(/Không được xoá/);
    expect(idProblems('shared/items.json', { items: [...items.items, items.items[0]] }, shipped).join()).toMatch(/Trùng id/);
    expect(idProblems('shared/items.json', { items: [...items.items, { id: '1 bad' }] }, shipped).join()).toMatch(/chỉ được dùng/);
    expect(idProblems('shared/items.json', { items: [...items.items, { id: 'item_honey' }] }, shipped)).toEqual([]);
    expect(idProblems('garden/crops.json', { crops: [] }, [])).toEqual([]); // not an id-list file
  });

  it('every item, decoration and achievement has a name in both languages; a new row needs one', () => {
    for (const [file, table] of Object.entries(TEXT_TABLES)) {
      const value = JSON.parse(readFileSync(`content/${file}`, 'utf8')) as Record<string, { id: string }[]>;
      const ids = value[table.rowsKey]!.map((r) => r.id);
      const current = readRowTexts(table, ids);
      expect(missingNames(file, value, {}, current), file).toEqual([]);
      const added = { ...value, [table.rowsKey]: [...value[table.rowsKey]!, { id: 'NEW_ROW' }] };
      expect(missingNames(file, added, {}, current).join()).toMatch(/NEW_ROW/);
      expect(missingNames(file, added, { NEW_ROW: { vi: 'Mới', en: 'New' } }, current)).toEqual([]);
    }
  });

  it('string-table entries are replaced in place or added before the block closes; the rest is untouched', () => {
    const text = ['  shop: {', '    title: "Cửa hàng",', '    FOOD_BASIC: "Thức ăn",', '    nested: {', '      FOOD_BASIC: "x",', '    },', '  },', '  other: {', '    FOOD_BASIC: "y",', '  },'].join('\n');
    const out = writeEntries(text, 'shop', { FOOD_BASIC: 'Cám "ngon"', item_honey: 'Mật ong' });
    expect(readEntries(out, 'shop', ['FOOD_BASIC', 'item_honey', 'title'])).toEqual({ FOOD_BASIC: 'Cám "ngon"', item_honey: 'Mật ong', title: 'Cửa hàng' });
    expect(readEntries(out, 'other', ['FOOD_BASIC'])).toEqual({ FOOD_BASIC: 'y' });
    expect(out).toContain('      FOOD_BASIC: "x",');
    expect(writeEntries(text, 'shop', { FOOD_BASIC: 'Thức ăn' })).toBe(text);
    expect(() => writeEntries(text, 'missing', {})).toThrow(/missing/);
    expect(entriesOf({ a: { vi: 'A', en: 'A', viDesc: 'd', enDesc: 'e' } }, TEXT_TABLES['shared/items.json']!, 'en')).toEqual({ a: 'A', a_desc: 'e' });
    expect(() => entriesOf({ a: { vi: 'A', en: ' ' } }, TEXT_TABLES['farm/decor.json']!, 'en')).toThrow(/tiếng Anh/);
  });
});

describe('Nội dung game: the schema-driven forms', () => {
  it('a new row / field starts from a value its schema accepts', async () => {
    for (const file of ['garden/hybrids.json', 'shared/recipes.json', 'adventure/zones.json', 'shared/festivals.json']) {
      const schema = toJsonSchema(await schemaOf(file));
      const value = JSON.parse(readFileSync(`content/${file}`, 'utf8')) as Record<string, unknown>;
      for (const [key, list] of Object.entries(value)) {
        if (!Array.isArray(list) || !list.length) continue;
        const row = schemaAt(schema, value, [key, 0]);
        expect(typeof defaultOf(row, schema), `${file} ${key}`).not.toBe('undefined');
      }
    }
    const s = toJsonSchema(z.object({ a: z.number().min(3), b: z.string().nullable(), c: z.array(z.boolean()).min(2), d: z.enum(['X', 'Y']).optional() }));
    expect(defaultOf(s, s)).toEqual({ a: 3, b: null, c: [false, false] });
  });

  it('ids for copies, readable durations', () => {
    expect(freeId('item_honey', new Set(['item_honey', 'item_honey_2']))).toBe('item_honey_3');
    expect(durationHint('criticalAfterMs', 172_800_000)).toBe('≈ 2 ngày');
    expect(durationHint('growHours', 1.5)).toBe('≈ 1 giờ 30 phút');
    expect(durationHint('price', 5)).toBeNull();
  });
});
