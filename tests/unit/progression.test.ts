// PG-1 relief, PG-2 daily reward + achievements, PG-3 decorations, save v5 -> v6.
import { describe, expect, it } from 'vitest';
import { buyDecor } from '../../src/areas/farm/logic/actions/buyDecor';
import { claimAchievement } from '../../src/areas/farm/logic/actions/claimAchievement';
import { claimDaily } from '../../src/areas/farm/logic/actions/claimDaily';
import { claimRelief } from '../../src/areas/farm/logic/actions/claimRelief';
import { fillTrough } from '../../src/areas/farm/logic/actions/fillTrough';
import { sellPig } from '../../src/areas/farm/logic/actions/sellPig';
import { ACHIEVEMENTS } from '../../src/areas/farm/logic/config/achievements';
import { DAILY } from '../../src/areas/farm/logic/config/daily';
import { DECORS } from '../../src/areas/farm/logic/config/decor';
import { RELIEF } from '../../src/areas/farm/logic/config/relief';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { decorBonus } from '../../src/areas/farm/logic/decor';
import { happiness } from '../../src/areas/farm/logic/happiness';
import { claimable, progressStep, statOf } from '../../src/areas/farm/logic/progress';
import { reliefNeed } from '../../src/areas/farm/logic/relief';
import { sellPrice } from '../../src/areas/farm/logic/pricing';
import { mulberry32 } from '../../src/core/rng';
import { vi } from '../../src/i18n/vi';
import { localDay } from '../../src/ui/localDay';
import { achievementsVm, dailyVm, progressDot } from '../../src/areas/farm/ui/progressVm';
import { migrateFarmSave } from '../../src/areas/farm/logic/save/legacy';
import { farmGameSchema } from '../../src/areas/farm/logic/save/farmSchema';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

const broke = (patch: Partial<FarmGame> = {}): FarmGame => {
  const s = farm([makePig({ hunger: 0 })]);
  return {
    ...s,
    player: { ...s.player, gold: 10 },
    inventory: { FOOD_BASIC: 0, MEDICINE_COMMON: 0 },
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
    const later = 3 * 3_600_000; // a COMMON pig grows in 2 h of fed time
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

describe('daily reward (PG-2)', () => {
  it('pays once per day and grows the streak on consecutive days', () => {
    const s = farm();
    const d1 = expectOk(claimDaily(s, { day: 100 }, ctx()));
    expect(d1.state.player.gold).toBe(s.player.gold + DAILY.REWARDS[0]!.gold);
    expect(d1.state.progress.daily).toEqual({ lastDay: 100, streak: 1 });
    expectError((x) => claimDaily(x, { day: 100 }, ctx()), d1.state, 'DAILY_ALREADY_CLAIMED');
    expectError((x) => claimDaily(x, { day: 99 }, ctx()), d1.state, 'DAILY_ALREADY_CLAIMED');
    const d2 = expectOk(claimDaily(d1.state, { day: 101 }, ctx()));
    expect(d2.state.progress.daily.streak).toBe(2);
    expect(d2.state.inventory.FOOD_BASIC).toBe(s.inventory.FOOD_BASIC + DAILY.REWARDS[1]!.food);
    expect(statOf(d2.state, 'bestStreak')).toBe(2);
  });

  it('a missed day restarts the streak; the cycle repeats after 7', () => {
    let s = farm();
    for (let day = 1; day <= 8; day++) s = expectOk(claimDaily(s, { day }, ctx())).state;
    expect(s.progress.daily.streak).toBe(8);
    expect(s.transactions[0]!.amount).toBe(DAILY.REWARDS[0]!.gold); // day 8 = day 1 of the cycle
    const gap = expectOk(claimDaily(s, { day: 10 }, ctx()));
    expect(gap.state.progress.daily.streak).toBe(1);
    expect(statOf(gap.state, 'bestStreak')).toBe(8);
    expect(claimable(gap.state).map((d) => d.id)).toContain('STREAK_7');
  });
});

describe('achievements (PG-2)', () => {
  it('a sale counts, reports FIRST_SALE once, and pays once when claimed', () => {
    const s = farm([makePig({ growthProgress: 100 })]);
    const sold = expectOk(sellPig(s, { pigId: 'pig-1' }, ctx()));
    expect(statOf(sold.state, 'pigsSold')).toBe(1);
    expect(sold.events).toContainEqual({ type: 'ACHIEVEMENT_REACHED', id: 'FIRST_SALE' });
    const gold = sold.state.player.gold;
    const def = ACHIEVEMENTS.find((d) => d.id === 'FIRST_SALE')!;
    const c = expectOk(claimAchievement(sold.state, { id: 'FIRST_SALE' }, ctx(5)));
    expect(c.state.player.gold).toBe(gold + def.gold);
    expect(c.state.progress.claimed.FIRST_SALE).toBe(5);
    expectError((x) => claimAchievement(x, { id: 'FIRST_SALE' }, ctx()), c.state, 'ALREADY_CLAIMED');
    expectError((x) => claimAchievement(x, { id: 'SELLER_10' }, ctx()), c.state, 'ACHIEVEMENT_LOCKED');
    expectError((x) => claimAchievement(x, { id: 'NOPE' }, ctx()), c.state, 'INVALID_REQUEST');
  });

  it('births during the world catch-up count, and the step is idempotent', () => {
    const mother = makePig({
      growthProgress: 100,
      pregnancy: {
        startedAt: 0,
        endsAt: 1000,
        fatherId: 'x',
        childBreed: 'PIG_EARTH_PINK',
        childGender: 'MALE',
      },
    });
    const s = makeState([mother], 10);
    const w = advanceWorld(s, 2000, mulberry32(1));
    expect(statOf(w.state, 'births')).toBe(1);
    expect(w.events).toContainEqual({ type: 'ACHIEVEMENT_REACHED', id: 'FIRST_BIRTH' });
    const again = advanceWorld(w.state, 2000, mulberry32(1));
    expect(statOf(again.state, 'births')).toBe(1);
    expect(again.events.filter((e) => e.type === 'ACHIEVEMENT_REACHED')).toEqual([]);
  });

  it('state metrics (level, slots) are reached without a counter', () => {
    const s = farm();
    const rich = { ...s, player: { ...s.player, xp: 1400, unlockedSlots: 12 } };
    const step = progressStep(s, rich, []);
    expect(step.events.map((e) => (e.type === 'ACHIEVEMENT_REACHED' ? e.id : ''))).toEqual([
      'LEVEL_5',
      'SLOTS_12',
    ]);
  });

  it('every achievement and decoration has a unique id and a name', () => {
    const ids = ACHIEVEMENTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = vi.achievements as Record<string, string>;
    for (const id of ids) expect(names[id], id).toBeTruthy();
    for (const id of Object.keys(DECORS)) expect(vi.decor[id as keyof typeof DECORS]).toBeTruthy();
  });
});

describe('decorations (PG-3)', () => {
  const rich = (xp: number) => {
    const s = farm([makePig({ growthProgress: 100, hunger: 50, cleanliness: 50 })]);
    return { ...s, player: { ...s.player, xp, gold: 100_000 } };
  };

  it('buying spends gold once, needs the level, and raises happiness and price', () => {
    const s = rich(BALANCE.LEVEL_XP[1]!); // level 2
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
    expect(sellPrice(pig, bonus)).toBeGreaterThan(sellPrice(pig));
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

describe('achievements panel view-model (PG-2)', () => {
  // Local noon of some day; dailyVm reads the day number through localDay.
  const noon = new Date(2026, 9, 3, 12, 0, 0).getTime();
  const today = localDay(noon);

  it('daily strip: next day highlighted, then done after the claim', () => {
    const s = farm();
    const open = dailyVm(s, noon);
    expect(open.claim).not.toBeNull();
    expect(open.days.map((d) => d.state)).toEqual(['next', ...Array(6).fill('later')]);
    const claimed = expectOk(open.claim!(s, ctx(noon))).state;
    const after = dailyVm(claimed, noon);
    expect(after.claim).toBeNull();
    expect(after.days[0]!.state).toBe('done');
    expect(after.days[1]!.state).toBe('later');
    expect(claimed.progress.daily.lastDay).toBe(today);
  });

  it('dock dot counts today\'s gift plus claimable achievements', () => {
    const s = farm();
    expect(progressDot(s, noon)).toBe(1);
    const sold = { ...s, progress: { ...s.progress, stats: { pigsSold: 1 } } };
    expect(progressDot(sold, noon)).toBe(2);
    const list = achievementsVm(sold);
    expect(list.items[0]).toMatchObject({ id: 'FIRST_SALE', status: 'claimable', percent: 100 });
  });
});
