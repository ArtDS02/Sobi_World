// PG-1 relief, PG-3 decorations, save v5 -> v6 (the daily reward and the achievements are the world's: goals.test.ts).
import { describe, expect, it } from 'vitest';
import { buyDecor } from '../../src/areas/farm/logic/actions/buyDecor';
import { claimRelief } from '../../src/areas/farm/logic/actions/claimRelief';
import { fillTrough } from '../../src/areas/farm/logic/actions/fillTrough';
import { sellPig } from '../../src/areas/farm/logic/actions/sellPig';
import { DECORS } from '../../src/areas/farm/logic/config/decor';
import { RELIEF } from '../../src/areas/farm/logic/config/relief';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { decorBonus } from '../../src/areas/farm/logic/decor';
import { happiness } from '../../src/areas/farm/logic/happiness';
import { reliefNeed } from '../../src/areas/farm/logic/relief';
import { sellPrice } from '../../src/areas/farm/logic/pricing';
import { mulberry32 } from '../../src/core/rng';
import { migrateFarmSave } from '../../src/areas/farm/logic/save/legacy';
import { farmGameSchema } from '../../src/areas/farm/logic/save/farmSchema';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';
import { inv, makeState } from './stateFactory';

const broke = (patch: Partial<FarmGame> = {}): FarmGame => {
  const s = farm([makePig({ hunger: 0 })]);
  return {
    ...s,
    player: { ...s.player, gold: 10 },
    inventory: inv(),
    trough: { ...s.trough, food: 0 },
    ...patch,
  };
};

describe('relief (PG-1)', () => {
  it('helps a farm with no food, no gold and nothing to sell', () => {
    const s = broke();
    expect(reliefNeed(s)).toEqual({ gold: 0, food: RELIEF.FOOD, medicine: 0 });
    const r = expectOk(claimRelief(s, {}, ctx()));
    expect(r.state.inventory.FOOD_BASIC).toBe(RELIEF.FOOD);
    expect(r.state.player.gold).toBe(10); // food only: no transaction
    expect(r.events).toContainEqual({ type: 'RELIEF_CLAIMED', gold: 0, food: RELIEF.FOOD, medicine: 0 });
    // Food in stock: not stuck any more.
    expectError((x) => claimRelief(x, {}, ctx()), r.state, 'NOT_STUCK');
  });

  it('gets a stuck farm back to a sale (the soft-lock is gone)', () => {
    let s = broke({ pigs: [makePig({ hunger: 0 })] });
    s = expectOk(claimRelief(s, {}, ctx())).state;
    s = expectOk(fillTrough(s, { units: RELIEF.FOOD }, ctx())).state;
    const later = 50 * 3_600_000; // a COMMON pig takes 48 h of fed time to grow up
    s = advanceWorld(s, later, mulberry32(3)).state;
    expect(s.pigs[0]!.growthProgress).toBe(100);
    const sold = expectOk(sellPig(s, { pigId: 'pig-1' }, ctx(later)));
    expect(sold.state.player.gold).toBeGreaterThan(500);
  });

  it('adds medicine for sick pigs, capped', () => {
    const pigs = [1, 2, 3, 4].map((i) => makePig({ id: `p${i}`, slotIndex: i - 1, isSick: true }));
    const s = broke({ pigs });
    expect(reliefNeed(s)?.medicine).toBe(RELIEF.MEDICINE_MAX);
  });

  it('is not offered when something can still be sold, is coming, or can be bought', () => {
    expect(reliefNeed(broke({ pigs: [makePig({ growthProgress: 100 })] }))).toBeNull();
    const gift = { id: 'g', spawnedAt: 0, seed: 1, gold: 50, xp: 5 };
    expect(reliefNeed(broke({ gifts: { nextAt: null, boxes: [gift] } }))).toBeNull();
    expect(reliefNeed({ ...broke(), player: { ...broke().player, gold: 25 } })).toBeNull();
    expect(reliefNeed(farm())).toBeNull(); // empty farm with starter gold
  });

  it('funds a pig and some food for an empty, broke farm', () => {
    const s = { ...broke(), pigs: [] };
    const need = reliefNeed(s)!;
    expect(need.gold).toBe(500 + RELIEF.START_FOOD * 25 - 10);
    const r = expectOk(claimRelief(s, {}, ctx()));
    expect(r.state.player.gold).toBe(500 + RELIEF.START_FOOD * 25);
    expect(r.state.transactions[0]).toMatchObject({ type: 'RELIEF', amount: need.gold });
  });
});

describe('decorations (PG-3)', () => {
  const rich = (xp: number) => {
    const s = farm([makePig({ growthProgress: 100, hunger: 50, cleanliness: 50 })]);
    return { ...s, player: { ...s.player, xp, gold: 100_000 } };
  };

  it('buying spends gold once, needs the level, and raises happiness and price', () => {
    const s = rich(WORLD_LEVELS.xp[1]!); // level 2
    expectError((x) => buyDecor(x, { decorId: 'DECOR_WINDMILL' }, ctx()), s, 'LEVEL_TOO_LOW');
    const r = expectOk(buyDecor(s, { decorId: 'DECOR_HAY_BALE' }, ctx()));
    expect(r.state.player.gold).toBe(100_000 - DECORS.DECOR_HAY_BALE.priceGold);
    expect(r.state.decor).toEqual(['DECOR_HAY_BALE']);
    expect(r.state.transactions[0]!.type).toBe('DECOR_PURCHASE');
    expectError((x) => buyDecor(x, { decorId: 'DECOR_HAY_BALE' }, ctx()), r.state, 'ALREADY_OWNED');
    const pig = r.state.pigs[0]!;
    const bonus = decorBonus(r.state);
    expect(bonus).toBe(DECORS.DECOR_HAY_BALE.happyBonus);
    expect(happiness(pig, bonus)).toBe(happiness(pig) + bonus);
    // Decorations lift the mood a pig lives in, and with it the Quality it ships at.
    const ordinary = makePig({ growthProgress: 100, hunger: 59, cleanliness: 59, energy: 59 }); // mood 59: Good, 60 with decorations: Great
    const at = { now: 0, dayOffsetMs: 0 };
    expect(sellPrice(ordinary, { ...at, decorBonus: bonus })).toBeGreaterThan(sellPrice(ordinary, { ...at, decorBonus: 0 }));
  });

  it('happiness with a bonus is still capped at 100', () => {
    expect(happiness({ cleanliness: 100, hunger: 100, isSick: false }, 10)).toBe(100);
  });
});

describe('save v5 -> v6', () => {
  it('adds empty progress and decor; past births count', () => {
    const s = makeState([], 0);
    const record = {
      id: 'r',
      at: 0,
      motherId: 'm',
      fatherId: 'f',
      motherBreed: 'PIG_EARTH_PINK',
      fatherBreed: 'PIG_EARTH_PINK',
      childBreed: 'PIG_EARTH_PINK',
      childGender: 'MALE',
      bornAt: 10,
    };
    const v5: Record<string, unknown> = { ...s, schemaVersion: 5, breedingRecords: [record] };
    delete v5.progress;
    delete v5.decor;
    const res = migrateFarmSave(v5);
    if (!res.ok) throw new Error(res.error);
    expect(res.save.schemaVersion).toBe(7);
    expect(res.save.nursery).toEqual([]); // v6 -> v7 (BR-1)
    expect(res.save.progress).toEqual({
      stats: { births: 1 },
      claimed: {},
      daily: { lastDay: null, streak: 0 },
    });
    expect(res.save.decor).toEqual([]);
    expect(farmGameSchema.safeParse(res.save).success).toBe(true);
    expect(migrateFarmSave(structuredClone(res.save))).toEqual(res);
  });
});

