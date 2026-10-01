import { describe, expect, expectTypeOf, it } from 'vitest';
import v1Fixture from '../fixtures/save-v1.json';
import { BALANCE } from '../../src/core/config/balance';
import { SAVE } from '../../src/core/config/save';
import { changeGold } from '../../src/core/engine/gold';
import { mulberry32 } from '../../src/core/rng';
import {
  exportFileName,
  exportReminderDue,
  exportSave,
  importSave,
} from '../../src/core/save/exportImport';
import { migrate, parseSave } from '../../src/core/save/migrate';
import { newGame } from '../../src/core/save/newGame';
import { saveGameSchema, type SaveGameParsed } from '../../src/core/save/schema';
import type { SaveGame } from '../../src/core/types';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

const ctx = (now = 1_000) => ({ now, rng: mulberry32(1) });
const valid = (s: unknown) => saveGameSchema.safeParse(s).success;

describe('schema (§5.1, §5.5)', () => {
  it('matches the SaveGame type', () => {
    expectTypeOf<SaveGameParsed>().toEqualTypeOf<SaveGame>();
  });

  it('accepts a valid save and round-trips through JSON', () => {
    const s = makeState([makePig()], 5);
    expect(valid(s)).toBe(true);
    const back = parseSave(JSON.stringify(s));
    expect(back).toEqual({ ok: true, save: s });
  });

  const base = () => makeState([makePig()], 5);
  it.each<[string, (s: SaveGame) => void]>([
    ['negative gold', (s) => (s.player.gold = -1)],
    ['negative inventory', (s) => (s.inventory.FOOD_BASIC = -1)],
    ['negative trough food', (s) => (s.trough.food = -1)],
    ['trough over capacity', (s) => (s.trough.food = s.trough.capacity + 1)],
    ['hunger > 100', (s) => (s.pigs[0]!.hunger = 100.01)],
    ['cleanliness < 0', (s) => (s.pigs[0]!.cleanliness = -0.1)],
    ['growth > 100', (s) => (s.pigs[0]!.growthProgress = 101)],
    ['slotIndex >= unlockedSlots', (s) => (s.pigs[0]!.slotIndex = 4)],
    ['duplicate slotIndex', (s) => s.pigs.push(makePig({ id: 'pig-2' }))],
    ['skin not owned', (s) => (s.pigs[0]!.skinId = 'pig_witch')],
    ['too many orders', (s) => (s.orders = Array.from({ length: 7 }, (_, i) => order(i)))],
    [
      'pigs + pregnancies exceed slots',
      (s) => {
        s.player.unlockedSlots = 2;
        s.pigs = [makePig({ pregnancy: preg }), makePig({ id: 'pig-2', slotIndex: 1 })];
      },
    ],
    ['wrong schemaVersion', (s) => ((s as { schemaVersion: number }).schemaVersion = 3)],
  ])('rejects: %s', (_, mutate) => {
    const s = base();
    mutate(s);
    expect(valid(s)).toBe(false);
  });

  it('allows up to ORDER_MAX_ACTIVE = 6 orders (DECISIONS C1)', () => {
    const s = base();
    s.orders = Array.from({ length: BALANCE.ORDER_MAX_ACTIVE }, (_, i) => order(i));
    expect(valid(s)).toBe(true);
  });
});

const preg = {
  startedAt: 0,
  endsAt: 1,
  fatherId: 'x',
  childBreed: 'PIG_EARTH_PINK' as const,
  childGender: 'MALE' as const,
};
const order = (i: number) => ({
  id: `0:${i}`,
  createdAt: 0,
  expiresAt: 1,
  wantBreed: 'PIG_EARTH_PINK' as const,
  wantGender: null,
  minHappiness: 0,
  rewardGold: 1800,
  rewardXp: 25,
  fulfilledAt: null,
});

describe('migrate (§9.2)', () => {
  it('v1 (v3 save) → v2 adds trough, orders, collection, ownedSkins, reduceMotion, pig skins', () => {
    const res = migrate(structuredClone(v1Fixture));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const s = res.save;
    expect(s.schemaVersion).toBe(2);
    expect(s.player.ownedSkins).toEqual([
      'pig_classic',
      'pig_watermelon',
      'pig_superhero',
      'pig_thienlong',
    ]);
    expect(s.trough).toEqual({ food: 0, capacity: 30, lastResolvedAt: v1Fixture.updatedAt }); // xp 120 → level 2
    expect(s.orders).toEqual([]);
    expect(s.collection.discoveredBreeds.sort()).toEqual(['PIG_EARTH_PINK', 'PIG_STRIPED_MELON']);
    expect(s.settings.reduceMotion).toBe(false);
    for (const p of s.pigs) {
      expect(p.skinId).toBe('pig_classic');
      expect(p.cosmetics).toEqual({});
    }
    // Untouched data survives.
    expect(s.player.gold).toBe(3800);
    expect(s.pigs[0]!.pregnancy?.childBreed).toBe('PIG_STRIPED_MELON');
    expect(s.transactions).toHaveLength(4);
    expect(s.inventory.FOOD_BASIC).toBe(5);
  });

  it('v2 passes through unchanged', () => {
    const s = makeState([makePig()], 3);
    expect(migrate(structuredClone(s))).toEqual({ ok: true, save: s });
  });

  it('future schemaVersion → SAVE_TOO_NEW', () => {
    expect(migrate({ ...makeState(), schemaVersion: SAVE.SCHEMA_VERSION + 1 })).toEqual({
      ok: false,
      error: 'SAVE_TOO_NEW',
    });
  });

  it.each([
    null,
    42,
    'x',
    [],
    {},
    { schemaVersion: 0 },
    { schemaVersion: 1.5 },
    { schemaVersion: 1 },
  ])('garbage %j → SAVE_CORRUPT', (raw) => {
    expect(migrate(raw)).toEqual({ ok: false, error: 'SAVE_CORRUPT' });
  });
});

describe('newGame (D7)', () => {
  it('starter kit with an INITIAL_GOLD transaction', () => {
    const s = newGame(ctx(5_000));
    expect(valid(s)).toBe(true);
    expect(s.player).toMatchObject({ gold: 5000, xp: 0, unlockedSlots: 4 });
    expect(s.pigs).toEqual([]);
    expect(s.inventory).toEqual({ FOOD_BASIC: 10, MEDICINE_COMMON: 1 });
    expect(s.trough).toEqual({ food: 0, capacity: 20, lastResolvedAt: 5_000 });
    expect(s.transactions).toEqual([
      { id: expect.any(String), at: 5_000, type: 'INITIAL_GOLD', amount: 5000 },
    ]);
  });
});

describe('changeGold (§8.16)', () => {
  it('writes a transaction for every change, newest first, max 200', () => {
    let s = newGame(ctx());
    for (let i = 0; i < 250; i++) {
      const r = changeGold(s, -1, 'SHOP_PURCHASE', ctx(i));
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    expect(s.player.gold).toBe(4750);
    expect(s.transactions).toHaveLength(SAVE.TRANSACTIONS_MAX);
    expect(s.transactions[0]!.at).toBe(249);
  });

  it('refuses to go negative and changes nothing', () => {
    const s = newGame(ctx());
    expect(changeGold(s, -5001, 'PIG_PURCHASE', ctx())).toEqual({
      ok: false,
      error: 'INSUFFICIENT_GOLD',
    });
  });
});

describe('export / import (§9.3)', () => {
  it('file name un-in-save-YYYYMMDD-HHmm.json from the passed date', () => {
    expect(exportFileName(new Date(2026, 9, 1, 3, 7))).toBe('un-in-save-20261001-0307.json');
  });

  it('export stamps lastExportAt and the JSON imports back to the same save', () => {
    const at = new Date(2026, 0, 2, 13, 45);
    const out = exportSave(makeState([makePig()], 2), at);
    expect(out.save.settings.lastExportAt).toBe(at.getTime());
    expect(importSave(out.json)).toEqual({ ok: true, save: out.save });
  });

  it('import rejects invalid JSON and invalid schema', () => {
    expect(importSave('{not json')).toEqual({ ok: false, error: 'SAVE_CORRUPT' });
    expect(importSave(JSON.stringify({ ...makeState(), player: null }))).toEqual({
      ok: false,
      error: 'SAVE_CORRUPT',
    });
  });

  it('export reminder after 7 days', () => {
    const s = makeState();
    expect(exportReminderDue(s, 0)).toBe(true);
    const day = 24 * 3600 * 1000;
    s.settings.lastExportAt = 0;
    expect(exportReminderDue(s, 7 * day)).toBe(false);
    expect(exportReminderDue(s, 7 * day + 1)).toBe(true);
  });
});
