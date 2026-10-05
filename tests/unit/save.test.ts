import { describe, expect, expectTypeOf, it } from 'vitest';
import v1Fixture from '../fixtures/save-v1.json';
import { BALANCE } from '../../src/core/config/balance';
import { SAVE, V3_SKIN_REFUND_GOLD, V5_OUTFIT_PRICES } from '../../src/core/config/save';
import { changeGold } from '../../src/areas/farm/logic/gold';
import { mulberry32 } from '../../src/core/rng';
import {
  exportFileName,
  exportReminderDue,
  exportSave,
  importSave,
} from '../../src/core/save/exportImport';
import { migrateFarmSave, parseFarmSave } from '../../src/areas/farm/logic/save/legacy';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import { farmGameSchema, type FarmGameParsed } from '../../src/areas/farm/logic/save/farmSchema';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';
import { world } from './worldKit';
import { SAVE_CODEC } from '../../src/app/saveCodec';

const ctx = (now = 1_000) => ({ now, rng: mulberry32(1) });
const valid = (s: unknown) => farmGameSchema.safeParse(s).success;

describe('schema (§5.1, §5.5)', () => {
  it('matches the FarmGame type', () => {
    expectTypeOf<FarmGameParsed>().toEqualTypeOf<FarmGame>();
  });

  it('accepts a valid save and round-trips through JSON', () => {
    const s = makeState([makePig()], 5);
    expect(valid(s)).toBe(true);
    const back = parseFarmSave(JSON.stringify(s));
    expect(back).toEqual({ ok: true, save: s });
  });

  const base = () => makeState([makePig()], 5);
  it.each<[string, (s: FarmGame) => void]>([
    ['negative gold', (s) => (s.player.gold = -1)],
    ['negative inventory', (s) => (s.inventory.FOOD_BASIC = -1)],
    ['negative trough food', (s) => (s.trough.food = -1)],
    ['trough over capacity', (s) => (s.trough.food = s.trough.capacity + 1)],
    ['hunger > 100', (s) => (s.pigs[0]!.hunger = 100.01)],
    ['cleanliness < 0', (s) => (s.pigs[0]!.cleanliness = -0.1)],
    ['growth > 100', (s) => (s.pigs[0]!.growthProgress = 101)],
    ['slotIndex >= unlockedSlots', (s) => (s.pigs[0]!.slotIndex = 4)],
    ['duplicate slotIndex', (s) => s.pigs.push(makePig({ id: 'pig-2' }))],
    ['too many orders', (s) => (s.orders = Array.from({ length: 7 }, (_, i) => order(i)))],
    [
      'pigs exceed slots',
      (s) => {
        s.player.unlockedSlots = 1;
        s.pigs = [makePig({ pregnancy: preg }), makePig({ id: 'pig-2', slotIndex: 1 })];
      },
    ],
    [
      'a nursery pig shares an id with a farm pig (BR-1)',
      (s) => {
        s.nursery = [
          {
            id: s.pigs[0]!.id,
            breed: 'PIG_EARTH_PINK',
            name: 'Bé',
            gender: 'MALE',
            generation: 2,
            bornAt: 0,
            parents: { motherId: 'a', fatherId: 'b', motherBreed: 'PIG_EARTH_PINK', fatherBreed: 'PIG_EARTH_PINK' },
          },
        ];
      },
    ],
    ['wrong schemaVersion', (s) => ((s as { schemaVersion: number }).schemaVersion = 99)],
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
  it('v1 (v3 save) → current adds trough, orders, collection, reduceMotion; no skin fields', () => {
    const res = migrateFarmSave(structuredClone(v1Fixture));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const s = res.save;
    expect(s.schemaVersion).toBe(SAVE.SCHEMA_VERSION);
    expect(s.player).not.toHaveProperty('ownedSkins');
    expect(s.trough).toEqual({ food: 0, capacity: 30, lastResolvedAt: v1Fixture.updatedAt }); // xp 120 → level 2
    expect(s.orders).toEqual([]);
    expect(s.collection.discoveredBreeds.sort()).toEqual(['PIG_EARTH_PINK', 'PIG_STRIPED_MELON']);
    expect(s.settings.reduceMotion).toBe(false);
    for (const p of s.pigs) {
      expect(p).not.toHaveProperty('skinId');
      expect(p).not.toHaveProperty('cosmetics');
    }
    // Untouched data survives.
    expect(s.player.gold).toBe(3800);
    expect(s.pigs[0]!.pregnancy?.childBreed).toBe('PIG_STRIPED_MELON');
    expect(s.transactions).toHaveLength(4);
    expect(s.inventory.FOOD_BASIC).toBe(5);
  });

  it('the current version passes through unchanged', () => {
    const s = makeState([makePig()], 3);
    expect(migrateFarmSave(structuredClone(s))).toEqual({ ok: true, save: s });
  });

  /** A pig as saves before v5 stored it: with skin and cosmetic fields. */
  const worn = (skinId: string, o: Parameters<typeof makePig>[0]) => ({
    ...makePig(o),
    skinId,
    cosmetics: {},
  });

  describe('v2 → v3: species-looking skins become species (U00-1 D3)', () => {
    const v2 = () => {
      const s = makeState([], 3);
      const old = ['pig_classic', 'pig_watermelon', 'pig_superhero', 'pig_thienlong'];
      return {
        ...s,
        schemaVersion: 2,
        pigs: [
          worn('pig_black', { id: 'a', slotIndex: 0, breed: 'PIG_EARTH_PINK' }),
          worn('pig_white', { id: 'b', slotIndex: 1, breed: 'PIG_STRIPED_MELON' }),
          worn('pig_farmer', { id: 'c', slotIndex: 2, breed: 'PIG_EARTH_PINK' }),
        ],
        player: {
          ...s.player,
          gold: 1000,
          ownedSkins: [...old, 'pig_black', 'pig_white', 'pig_brown', 'pig_farmer'],
        },
        collection: { discoveredBreeds: ['PIG_EARTH_PINK'], discoveredSkins: ['pig_classic'] },
      };
    };

    it('a pink pig wearing a species skin becomes that species; others keep theirs', () => {
      const res = migrateFarmSave(v2());
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const breed = (id: string) => res.save.pigs.find((p) => p.id === id)!;
      expect(breed('a').breed).toBe('PIG_BLACK');
      expect(breed('b').breed).toBe('PIG_STRIPED_MELON');
      expect(breed('c').breed).toBe('PIG_EARTH_PINK');
    });

    it('owned species skins become discovered species', () => {
      const res = migrateFarmSave(v2());
      if (!res.ok) throw new Error(res.error);
      expect([...res.save.collection.discoveredBreeds].sort()).toEqual(
        ['PIG_BLACK', 'PIG_BROWN', 'PIG_EARTH_PINK', 'PIG_STRIPED_MELON', 'PIG_WHITE'].sort(),
      );
    });

    it('unworn species skin (v3) and the outfit (v5) are refunded once, through transactions', () => {
      const res = migrateFarmSave(v2());
      if (!res.ok) throw new Error(res.error);
      expect(res.save.player.gold).toBe(1000 + V3_SKIN_REFUND_GOLD + V5_OUTFIT_PRICES.pig_farmer!);
      const refunds = res.save.transactions.filter((t) => t.type === 'SKIN_REFUND');
      expect(refunds).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ amount: V3_SKIN_REFUND_GOLD, refId: 'pig_brown' }),
          expect.objectContaining({ amount: 2000, refId: 'pig_farmer' }),
        ]),
      );
      expect(refunds).toHaveLength(2);
      // Loading the migrated save again changes nothing.
      expect(migrateFarmSave(structuredClone(res.save))).toEqual(res);
    });
  });

  describe('v4 → v5: outfits removed (DECISIONS A2-1)', () => {
    const v4 = () => {
      const s = makeState([], 3);
      return {
        ...s,
        schemaVersion: 4,
        pigs: [
          worn('pig_robot', { id: 'a', slotIndex: 0, breed: 'PIG_EARTH_PINK' }),
          worn('pig_unicorn', { id: 'b', slotIndex: 1, breed: 'PIG_WHITE' }),
          worn('pig_tiger', { id: 'c', slotIndex: 2, breed: 'PIG_TIGER' }),
        ],
        player: {
          ...s.player,
          gold: 1000,
          ownedSkins: ['pig_classic', 'pig_tiger', 'pig_robot', 'pig_unicorn', 'pig_ninja'],
        },
        collection: { discoveredBreeds: ['PIG_TIGER'], discoveredSkins: ['pig_robot'] },
      };
    };

    it('a pink pig in a body outfit becomes that species; other pigs keep theirs', () => {
      const res = migrateFarmSave(v4());
      if (!res.ok) throw new Error(res.error);
      expect(res.save.pigs.map((p) => p.breed)).toEqual(['PIG_ROBOT', 'PIG_WHITE', 'PIG_TIGER']);
      for (const p of res.save.pigs) {
        expect(p).not.toHaveProperty('skinId');
        expect(p).not.toHaveProperty('cosmetics');
      }
      expect(res.save.player).not.toHaveProperty('ownedSkins');
      expect(res.save.collection).toEqual({
        discoveredBreeds: ['PIG_TIGER', 'PIG_ROBOT', 'PIG_WHITE'],
      });
    });

    it('every other owned outfit is refunded at its price, once', () => {
      const res = migrateFarmSave(v4());
      if (!res.ok) throw new Error(res.error);
      expect(res.save.player.gold).toBe(1000 + 6000 + 6000); // unicorn (worn by a white pig) + ninja
      const refunds = res.save.transactions.filter((t) => t.type === 'SKIN_REFUND');
      expect(refunds.map((t) => t.refId).sort()).toEqual(['pig_ninja', 'pig_unicorn']);
      expect(migrateFarmSave(structuredClone(res.save))).toEqual(res);
    });
  });

  it('future schemaVersion → SAVE_TOO_NEW', () => {
    expect(migrateFarmSave({ ...makeState(), schemaVersion: SAVE.SCHEMA_VERSION + 1 })).toEqual({
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
    expect(migrateFarmSave(raw)).toEqual({ ok: false, error: 'SAVE_CORRUPT' });
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
  it('file name sobi-farm-save-YYYYMMDD-HHmm.json from the passed date', () => {
    expect(exportFileName(new Date(2026, 9, 1, 3, 7))).toBe('sobi-farm-save-20261001-0307.json');
  });

  it('export stamps lastExportAt and the JSON imports back to the same save', () => {
    const at = new Date(2026, 0, 2, 13, 45);
    const out = exportSave(world(makeState([makePig()], 2)), at);
    expect(out.save.settings.lastExportAt).toBe(at.getTime());
    expect(importSave(out.json, SAVE_CODEC)).toEqual({ ok: true, save: out.save, fromVersion: 8 });
  });

  it('import rejects invalid JSON and invalid schema', () => {
    expect(importSave('{not json', SAVE_CODEC)).toEqual({ ok: false, error: 'SAVE_CORRUPT' });
    expect(importSave(JSON.stringify({ ...makeState(), player: null }), SAVE_CODEC)).toEqual({
      ok: false,
      error: 'SAVE_CORRUPT',
    });
  });

  it('export reminder after 7 days', () => {
    const s = world(makeState());
    expect(exportReminderDue(s, 0)).toBe(true);
    const day = 24 * 3600 * 1000;
    s.settings.lastExportAt = 0;
    expect(exportReminderDue(s, 7 * day)).toBe(false);
    expect(exportReminderDue(s, 7 * day + 1)).toBe(true);
  });
});
