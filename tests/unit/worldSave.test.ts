// World save v8 (ARCHITECTURE §9, AUDIT_AND_PLAN §d): migration from Sobi Farm saves, validation of
// the world and of each Area slice, the farm lens, and the store's backup before a migrated write.
import { describe, expect, it } from 'vitest';
import realV7 from '../fixtures/save-v7-real.json';
import v1Fixture from '../fixtures/save-v1.json';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { breedPigs } from '../../src/areas/farm/logic/actions/breedPigs';
import { migrateFarmSave } from '../../src/areas/farm/logic/save/legacy';
import { FARM_AREA_ID, farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { fakeClock } from '../../src/core/clock';
import { migrate, parseSave } from '../../src/core/save/migrate';
import type { BackupStore, LoadResult, SaveStorage } from '../../src/core/save/port';
import { WORLD_SAVE_VERSION, type WorldSave } from '../../src/core/save/world';
import { mulberry32 } from '../../src/core/rng';
import { makePig } from './pigFactory';
import { createFarmGameStore, world } from './worldKit';
import { inv } from './stateFactory';

const T0 = 1_700_000_000_000;
const ctx = (now = T0) => ({ now, rng: mulberry32(3) });

/** A v7 farm with something in every field. */
function richFarm(): FarmGame {
  let s = newGame(ctx());
  for (const [i, gender] of (['FEMALE', 'MALE'] as const).entries()) {
    const r = buyPig(s, { breed: 'PIG_EARTH_PINK', gender }, { now: T0, rng: mulberry32(10 + i) });
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  const grown: FarmGame = {
    ...s,
    player: { ...s.player, xp: 1500, gold: 123_456 },
    pigs: s.pigs.map((p) => ({ ...p, growthProgress: 100, hunger: 90, cleanliness: 90 })),
    decor: ['DECOR_HAY_BALE'],
    progress: { stats: { pigsBought: 2, births: 3 }, claimed: { FIRST_PIG: T0 }, daily: { lastDay: 19000, streak: 4 } },
    inventory: inv({ FOOD_BASIC: 7, MEDICINE_COMMON: 2 }),
  };
  const bred = breedPigs(grown, { pigAId: grown.pigs[0]!.id, pigBId: grown.pigs[1]!.id }, ctx());
  if (!bred.ok) throw new Error(bred.error);
  return bred.state;
}

describe('world save v8: migration', () => {
  it('a v7 farm keeps every pig, coin, item, xp, achievement and setting', () => {
    const farm = richFarm();
    const r = migrate(farm, SAVE_CODEC);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fromVersion).toBe(7);
    const w = r.save;
    expect(w.schemaVersion).toBe(WORLD_SAVE_VERSION);
    expect(w.wallet).toEqual({ coins: farm.player.gold, gems: 0, eventTokens: 0 });
    expect(w.inventory.items).toEqual(farm.inventory);
    expect(w.progression.areas[FARM_AREA_ID]).toEqual({ xp: farm.player.xp });
    expect(w.progression.stats).toEqual(farm.progress.stats);
    expect(w.progression.claimed).toEqual(farm.progress.claimed);
    expect(w.progression.daily).toEqual(farm.progress.daily);
    expect(w.collection.discovered.breed).toEqual(farm.collection.discoveredBreeds);
    expect(w.transactions.map(({ currency, ...t }) => [currency, t])).toEqual(
      farm.transactions.map((t) => ['coins', t]),
    );
    expect(w.settings).toEqual(farm.settings);
    expect(w.meta).toEqual({ createdAt: farm.createdAt, updatedAt: farm.updatedAt, lastSavedAt: farm.updatedAt });
    expect(w.world).toEqual({ currentArea: FARM_AREA_ID, unlockedAreas: [FARM_AREA_ID] });
    // Read back through the lens, the farm is exactly what was saved (pregnancy, records included).
    const { transactions, ...rest } = farmOf(w);
    const { transactions: before, ...farmRest } = farm;
    expect(rest).toEqual(farmRest);
    expect(transactions.map(({ currency: _c, ...t }) => t)).toEqual(before);
  });

  it('the real Sobi Farm save (v7) migrates without losing its pig, gold or items', () => {
    const r = parseSave(JSON.stringify(realV7), SAVE_CODEC);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const farm = farmOf(r.save);
    expect(r.save.wallet.coins).toBe(realV7.player.gold);
    expect(farm.player.xp).toBe(realV7.player.xp);
    expect(farm.pigs.map((p) => [p.id, p.name, p.breed])).toEqual(realV7.pigs.map((p) => [p.id, p.name, p.breed]));
    expect(farm.inventory).toEqual(inv({ ...realV7.inventory })) // items added since count as none;
    expect(farm.orders).toEqual(realV7.orders);
    expect(r.save.transactions).toHaveLength(realV7.transactions.length);
  });

  it('a v1 save goes through every Sobi Farm step and lands in the current version', () => {
    const legacy = migrateFarmSave(v1Fixture);
    const r = migrate(v1Fixture, SAVE_CODEC);
    expect(legacy.ok && r.ok).toBe(true);
    if (!legacy.ok || !r.ok) return;
    expect(r.fromVersion).toBe(1);
    expect(farmOf(r.save).pigs).toEqual(legacy.save.pigs);
    expect(r.save.wallet.coins).toBe(legacy.save.player.gold);
  });

  it('a current-version save round-trips through JSON unchanged', () => {
    const w = world(richFarm());
    expect(parseSave(JSON.stringify(w), SAVE_CODEC)).toEqual({ ok: true, save: w, fromVersion: WORLD_SAVE_VERSION });
  });

  it('refuses newer, broken and invalid saves', () => {
    const w = world(richFarm());
    expect(migrate({ ...w, schemaVersion: WORLD_SAVE_VERSION + 1 }, SAVE_CODEC)).toEqual({ ok: false, error: 'SAVE_TOO_NEW' });
    expect(parseSave('{nope', SAVE_CODEC)).toEqual({ ok: false, error: 'SAVE_CORRUPT' });
    expect(migrate({ ...w, wallet: { ...w.wallet, coins: -1 } }, SAVE_CODEC).ok).toBe(false);
    expect(migrate({ ...w, meta: undefined }, SAVE_CODEC).ok).toBe(false);
    // A broken Area slice fails the whole save (the store then tries the backups).
    const farm = w.areas[FARM_AREA_ID] as { unlockedSlots: number };
    expect(migrate({ ...w, areas: { [FARM_AREA_ID]: { ...farm, unlockedSlots: 0 } } }, SAVE_CODEC).ok).toBe(false);
  });

  it('keeps data it does not know: other Areas, other items, gems', () => {
    const w = world(richFarm());
    const extended: WorldSave = {
      ...w,
      wallet: { ...w.wallet, gems: 12 },
      inventory: { items: { ...w.inventory.items, item_future: 5 } },
      areas: { ...w.areas, sobi_future: { plots: [1, 2] } },
    };
    const r = parseSave(JSON.stringify(extended), SAVE_CODEC);
    expect(r.ok && r.save).toEqual(extended);
  });
});

describe('farm lens', () => {
  it('writing back an unchanged view returns the same world', () => {
    const w = world(richFarm());
    expect(withFarm(w, farmOf(w))).toBe(w);
    expect(farmOf(w)).toBe(farmOf(w)); // one view per world
  });

  it('a farm action changes coins and items but keeps gems, other items and other Areas', () => {
    const base = world(newGame(ctx()));
    const w: WorldSave = {
      ...base,
      wallet: { ...base.wallet, gems: 3 },
      inventory: { items: { ...base.inventory.items, item_carrot: 2 } },
      areas: { ...base.areas, sobi_garden: { ok: true } },
    };
    const r = buyPig(farmOf(w), { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx());
    if (!r.ok) throw new Error(r.error);
    const next = withFarm(w, r.state);
    expect(next.wallet).toEqual({ coins: r.state.player.gold, gems: 3, eventTokens: 0 });
    expect(next.inventory.items.item_carrot).toBe(2);
    expect(next.areas.sobi_garden).toEqual({ ok: true });
    expect(farmOf(next).pigs).toHaveLength(1);
    expect(next.transactions.some((t) => t.type === 'PIG_PURCHASE' && t.currency === 'coins')).toBe(true);
  });
});

describe('store: backup before the first write of a migrated save (ARCHITECTURE §9)', () => {
  function platform(start: LoadResult, failBackup = false) {
    const log: string[] = [];
    const storage: SaveStorage = {
      load: async () => start,
      save: async (s) => void log.push(`write:v${s.schemaVersion}`),
    };
    const backups: BackupStore = {
      list: async () => [],
      restore: async () => {},
      backupBeforeReset: async () => {},
      backupBeforeMigration: async (v) => {
        if (failBackup) throw new Error('disk full');
        log.push(`backup:v${v}`);
      },
    };
    const instanceGuard = { start: async () => true, isReadOnly: () => false, close() {} };
    return { storage, backups, instanceGuard, log };
  }
  const quiet = { page: null, every: () => 0, cancel: () => {}, sleep: () => new Promise<void>(() => {}) };
  const legacyFarm = () => {
    const r = migrate(newGame(ctx()), SAVE_CODEC);
    if (!r.ok) throw new Error(r.error);
    return r;
  };

  it('copies the old file once, before the first write', async () => {
    const r = legacyFarm();
    const p = platform({ kind: 'ok', save: r.save, source: 'primary', fromVersion: r.fromVersion });
    const store = createFarmGameStore({ ...p, ...quiet, clock: fakeClock(T0), rng: mulberry32(2) });
    await store.init();
    await store.dispatch((s, c) => buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, c));
    await store.persistNow();
    expect(p.log).toEqual(['backup:v7', 'write:v9', 'write:v9']);
  });

  it('a failed copy fails the write: the migrated save is never written without it', async () => {
    const r = legacyFarm();
    const p = platform({ kind: 'ok', save: r.save, source: 'primary', fromVersion: r.fromVersion }, true);
    const store = createFarmGameStore({ ...p, ...quiet, clock: fakeClock(T0), rng: mulberry32(2) });
    await store.init();
    await store.dispatch((s, c) => buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, c));
    expect(p.log).toEqual([]);
    expect(store.getSnapshot().saveError).toBe(true);
  });

  it('a save already in the current version is written without a migration copy; lastSavedAt is stamped', async () => {
    const w = world(newGame(ctx()));
    const p = platform({ kind: 'ok', save: w, source: 'primary', fromVersion: WORLD_SAVE_VERSION });
    const writes: WorldSave[] = [];
    p.storage.save = async (s) => void writes.push(s);
    const store = createFarmGameStore({ ...p, ...quiet, clock: fakeClock(T0 + 5000), rng: mulberry32(2) });
    await store.init();
    await store.persistNow();
    expect(p.log).toEqual([]);
    expect(writes.at(-1)?.meta.lastSavedAt).toBe(T0 + 5000);
  });
});

it('the pig factory pig is a valid farm member of a world', () => {
  const farm = { ...newGame(ctx()), pigs: [makePig()] };
  expect(migrate(world(farm), SAVE_CODEC).ok).toBe(true);
});
