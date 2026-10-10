// Admin tools of GĐ2: time travel on a save (⏩ Tua thời gian) and the numbers editor (Số liệu).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { schemaProblems } from '../../scripts/admin/contentFiles';
import { NUMBER_FILES, onlyNumbersDiffer } from '../../scripts/admin/numbers';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { sequenceRng } from '../../src/core/rng';
import * as E from '../../tools/admin/userEdits';
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
    const r = E.rewind(DAY)(s);
    expect(r.pigs[0]).toMatchObject({ lastTickedAt: T - DAY, createdAt: T - 6 * DAY, lastFedAt: T - DAY - H });
    expect(r.pigs[1]!.lastFedAt).toBeUndefined();
    expect(Object.hasOwn(r.pigs[1]!, 'lastFedAt')).toBe(false);
    expect(r.trough.lastResolvedAt).toBe(T - DAY);
    expect(r.gifts.nextAt).toBe(T + 2 * H - DAY);
    expect(r.createdAt).toBe(T - 11 * DAY);
    expect(E.saveProblems(r)).toEqual([]);
  });

  it('the game then catches up exactly as if it had been closed for that long', () => {
    // A save left at T, opened a day later (reference) …
    const reference = advanceWorld(farmAt(T), T + DAY, rng(), 0, 'offline').state;
    // … is the same as the save rewound a day, opened at T.
    const viaAdmin = advanceWorld(E.rewind(DAY)(farmAt(T)), T, rng(), 0, 'offline').state;
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
    const week = advanceWorld(E.rewind(7 * DAY)(bare), T, rng(), 0, 'offline').state;
    expect(week.pigs.every((p) => p.isSick)).toBe(true);
    expect(week.graceUntil).toBe(T + 12 * H);
    expect(advanceWorld(week, T + 13 * H, rng()).state.pigs).toEqual([]);
  });
});

describe('Số liệu: the numbers editor', () => {
  it('every editable file loads and passes the game\'s own schema as shipped', async () => {
    for (const [file, { schemaPath, exportName }] of Object.entries(NUMBER_FILES)) {
      const mod = (await import(/* @vite-ignore */ `../..${schemaPath}`)) as Record<string, unknown>;
      const value = JSON.parse(readFileSync(`content/${file}`, 'utf8'));
      expect(schemaProblems(mod[exportName], value), file).toEqual([]);
    }
  });

  it('only numbers may differ: a changed number passes, anything else is refused', () => {
    const before = { a: 1, list: [{ n: 2, label: 'x' }], flag: true };
    expect(onlyNumbersDiffer(before, { a: 5, list: [{ n: 9, label: 'x' }], flag: true })).toBeNull();
    expect(onlyNumbersDiffer(before, { a: 1, list: [{ n: 2, label: 'y' }], flag: true })).toMatch(/list\[0\]\.label/);
    expect(onlyNumbersDiffer(before, { a: 1, list: [], flag: true })).toMatch(/list/);
    expect(onlyNumbersDiffer(before, { a: 1, list: [{ n: 2, label: 'x' }], flag: true, extra: 1 })).not.toBeNull();
    expect(onlyNumbersDiffer(before, { a: 'one', list: [{ n: 2, label: 'x' }], flag: true })).toMatch(/phải là số/);
    expect(onlyNumbersDiffer(before, { a: Number.NaN, list: [{ n: 2, label: 'x' }], flag: true })).toMatch(/phải là số/);
  });

  it('the GĐ6 files are editable: the orders, goals, achievements, Codex, decorations, bond and the world level', () => {
    for (const file of ['shared/orders.json', 'shared/goals.json', 'shared/achievements.json', 'shared/codex.json', 'farm/decor.json', 'shared/bond.json', 'shared/progression.json', 'shared/npcs.json']) {
      expect(Object.keys(NUMBER_FILES), file).toContain(file);
    }
  });

  it('the NPC words can change but their structure cannot; other files stay numbers-only', () => {
    const before = JSON.parse(readFileSync('content/shared/npcs.json', 'utf8')) as { npcs: { nameVi: string; id: string; topics: { textVi: string }[] }[] };
    const after = structuredClone(before);
    after.npcs[0]!.topics[0]!.textVi = 'Lời mới';
    after.npcs[0]!.nameVi = 'Tên mới';
    expect(onlyNumbersDiffer(before, after, '', true)).toBeNull();
    expect(onlyNumbersDiffer(before, after)).toMatch(/chỉ sửa được số/); // not for a numbers-only file
    const renamed = structuredClone(before);
    renamed.npcs[0]!.id = 'npc_other';
    expect(onlyNumbersDiffer(before, renamed, '', true)).toMatch(/.id/); // an id is never a word
    const blank = structuredClone(before);
    blank.npcs[0]!.nameVi = '  ';
    expect(onlyNumbersDiffer(before, blank, '', true)).toMatch(/không để trống/);
    const fewer = structuredClone(before);
    fewer.npcs[0]!.topics.pop();
    expect(onlyNumbersDiffer(before, fewer, '', true)).toMatch(/số phần tử/);
  });

  it('a number the schema forbids is caught before anything is written', async () => {
    const { schemaPath, exportName } = NUMBER_FILES['shared/health.json']!;
    const mod = (await import(/* @vite-ignore */ `../..${schemaPath}`)) as Record<string, unknown>;
    const value = JSON.parse(readFileSync('content/shared/health.json', 'utf8'));
    expect(schemaProblems(mod[exportName], { ...value, criticalAfterMs: value.deathAfterMs + 1 })).not.toEqual([]);
    expect(schemaProblems(mod[exportName], { ...value, risk: { ...value.risk, perHour: { starving: 0.6, dirty: 0.3, lowMood: 0.2 } } })).not.toEqual([]);
  });
});

describe('Số liệu: advanced breeding (GĐ7)', () => {
  it('the trait table, the breeding rules and the Breeder gossip are editable', () => {
    for (const file of ['breeding/traits.json', 'breeding/balance.json', 'breeding/rumors.json']) {
      expect(Object.keys(NUMBER_FILES), file).toContain(file);
    }
  });

  it('trait names, descriptions and rumour sentences can change; ids, tiers and structure cannot', () => {
    const traits = JSON.parse(readFileSync('content/breeding/traits.json', 'utf8')) as { traits: { id: string; nameVi: string; descVi: string; tier: string; weight: number }[] };
    const edited = structuredClone(traits);
    edited.traits[0]!.nameVi = 'Tên khác';
    edited.traits[0]!.descVi = 'Mô tả khác';
    edited.traits[0]!.weight = 99;
    expect(onlyNumbersDiffer(traits, edited, '', true)).toBeNull();
    const retier = structuredClone(traits);
    retier.traits[0]!.tier = 'EPIC';
    expect(onlyNumbersDiffer(traits, retier, '', true)).toMatch(/tier/);
    const rumors = JSON.parse(readFileSync('content/breeding/rumors.json', 'utf8')) as { recipeTemplates: string[]; tips: string[]; rarityWords: Record<string, string> };
    const words = structuredClone(rumors);
    words.recipeTemplates[0] = 'Câu mới {parentA} {parentB}';
    words.tips[0] = 'Mẹo mới';
    words.rarityWords.RARE = 'hiếm lắm';
    expect(onlyNumbersDiffer(rumors, words, '', true)).toBeNull();
    const extra = structuredClone(rumors);
    extra.tips.push('thêm câu');
    expect(onlyNumbersDiffer(rumors, extra, '', true)).toMatch(/số phần tử/);
  });
});
