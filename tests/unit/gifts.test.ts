// U06: timed gift boxes — one farm timer, offline catch-up, rarity, cap, claim once, save.
import { describe, expect, it } from 'vitest';
import { openGift } from '../../src/core/actions/openGift';
import { BALANCE } from '../../src/core/config/balance';
import { GIFTS } from '../../src/core/config/gifts';
import { advanceWorld } from '../../src/core/engine/advanceWorld';
import { giftInterval, giftsPerSpawn, makeGift, resolveGifts } from '../../src/core/engine/gifts';
import { mulberry32 } from '../../src/core/rng';
import { migrate } from '../../src/core/save/migrate';
import type { Pig, SaveGame } from '../../src/core/types';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const H = 3_600_000;
const herd = (n: number, o: Partial<Pig> = {}) =>
  Array.from({ length: n }, (_, i) =>
    makePig({ id: `p${i}`, slotIndex: i, growthProgress: 100, ...o }),
  );
const withHerd = (n: number, o: Partial<Pig> = {}): SaveGame => ({
  ...farm(herd(n, o)),
  player: { ...farm().player, unlockedSlots: BALANCE.MAX_SLOTS },
});
/** Timer started at t=0. */
const started = (s: SaveGame) => resolveGifts(s, 0).state;

describe('gift timer (U06)', () => {
  it('no pigs: no timer, no boxes', () => {
    const r = resolveGifts(farm(), 10 * H);
    expect(r.state.gifts).toEqual({ nextAt: null, boxes: [] });
    expect(r.events).toEqual([]);
  });

  it('the first pig starts the timer; the box comes after one interval, not before', () => {
    const s = started(withHerd(1));
    expect(s.gifts.nextAt).toBe(GIFTS.BASE_INTERVAL_MS);
    expect(resolveGifts(s, GIFTS.BASE_INTERVAL_MS - 1).events).toEqual([]);
    const r = resolveGifts(s, GIFTS.BASE_INTERVAL_MS);
    expect(r.state.gifts.boxes).toHaveLength(1);
    expect(r.events).toEqual([{ type: 'GIFT_SPAWNED', giftId: r.state.gifts.boxes[0]!.id }]);
    expect(r.state.gifts.nextAt).toBe(2 * GIFTS.BASE_INTERVAL_MS);
  });

  it('is idempotent for the same now (advanceWorld rule)', () => {
    const once = resolveGifts(started(withHerd(3)), 5 * H).state;
    const twice = resolveGifts(once, 5 * H);
    expect(twice.state).toBe(once);
    expect(twice.events).toEqual([]);
  });

  it('20 pigs never mean 20 boxes: per-spawn and on-farm caps', () => {
    expect(giftsPerSpawn(1)).toBe(1);
    expect(giftsPerSpawn(6)).toBe(2);
    expect(giftsPerSpawn(20)).toBe(GIFTS.MAX_PER_SPAWN);
    const r = resolveGifts(started(withHerd(20)), GIFTS.BASE_INTERVAL_MS);
    expect(r.state.gifts.boxes).toHaveLength(GIFTS.MAX_PER_SPAWN);
  });

  it('offline for three days: the farm holds at most MAX_ON_FARM, the wait restarts from now', () => {
    const now = 72 * H;
    const r = resolveGifts(started(withHerd(4)), now);
    expect(r.state.gifts.boxes).toHaveLength(GIFTS.MAX_ON_FARM);
    expect(r.state.gifts.nextAt).toBe(now + GIFTS.BASE_INTERVAL_MS);
    expect(new Set(r.state.gifts.boxes.map((b) => b.id)).size).toBe(GIFTS.MAX_ON_FARM);
  });

  it('a clock set back spawns nothing and moves nothing', () => {
    const s = resolveGifts(started(withHerd(2)), 5 * H).state;
    expect(resolveGifts(s, 1 * H).state).toBe(s);
  });

  it('rarer herds wait longer (4 h common → 6 h legendary) but get more per box', () => {
    expect(giftInterval(herd(3))).toBe(4 * H);
    expect(giftInterval(herd(3, { breed: 'PIG_MYTHICAL' }))).toBe(6 * H);
    const common = makeGift(herd(3), 0, 0);
    const rare = makeGift(herd(3, { breed: 'PIG_TIGER' }), 0, 0);
    expect(rare.gold).toBeGreaterThan(common.gold);
    expect(rare.xp).toBeGreaterThan(common.xp);
  });

  it('rewards stay inside MIN/MAX whatever the herd', () => {
    const tiny = makeGift(herd(1, { growthProgress: 0 }), 0, 0);
    expect(tiny.gold).toBeGreaterThanOrEqual(GIFTS.MIN_GOLD);
    expect(tiny.xp).toBeGreaterThanOrEqual(GIFTS.MIN_XP);
    const huge = makeGift(herd(24, { breed: 'PIG_PHOENIX' }), 0, 0);
    expect(huge.gold).toBe(GIFTS.MAX_GOLD);
    expect(huge.xp).toBe(GIFTS.MAX_XP);
  });

  it('advanceWorld spawns gifts as step 5 and reports GIFT_SPAWNED', () => {
    const s = advanceWorld(withHerd(2), 0, mulberry32(1)).state;
    const r = advanceWorld(s, GIFTS.BASE_INTERVAL_MS, mulberry32(1));
    expect(r.events.filter((e) => e.type === 'GIFT_SPAWNED')).toHaveLength(1);
  });
});

describe('openGift (U06)', () => {
  const withBox = () => resolveGifts(started(withHerd(2)), GIFTS.BASE_INTERVAL_MS).state;

  it('pays the fixed reward through a GIFT_REWARD transaction and removes the box', () => {
    const s = withBox();
    const box = s.gifts.boxes[0]!;
    const r = expectOk(openGift(s, { giftId: box.id }, ctx(GIFTS.BASE_INTERVAL_MS)));
    expect(r.state.player.gold).toBe(s.player.gold + box.gold);
    expect(r.state.player.xp).toBe(s.player.xp + box.xp);
    expect(r.state.transactions[0]).toMatchObject({
      type: 'GIFT_REWARD',
      amount: box.gold,
      refId: box.id,
    });
    expect(r.state.gifts.boxes).toEqual([]);
    expect(r.events).toContainEqual({
      type: 'GIFT_OPENED',
      giftId: box.id,
      gold: box.gold,
      xp: box.xp,
    });
  });

  it('cannot be claimed twice', () => {
    const s = withBox();
    const id = s.gifts.boxes[0]!.id;
    const r = expectOk(openGift(s, { giftId: id }, ctx(GIFTS.BASE_INTERVAL_MS)));
    expectError(
      (x) => openGift(x, { giftId: id }, ctx(GIFTS.BASE_INTERVAL_MS)),
      r.state,
      'GIFT_NOT_FOUND',
    );
  });
});

describe('gift save (U06)', () => {
  it('boxes and the timer survive save → load', () => {
    const s = withHerd(2);
    const saved = resolveGifts(started(s), GIFTS.BASE_INTERVAL_MS).state;
    const loaded = migrate(JSON.parse(JSON.stringify(saved)));
    expect(loaded.ok && loaded.save.gifts).toEqual(saved.gifts);
  });

  it('v3 saves load with gifts off; the first tick with pigs starts the timer', () => {
    const v3 = { ...withHerd(2), schemaVersion: 3 } as Record<string, unknown>;
    delete v3.gifts;
    const r = migrate(v3);
    expect(r.ok && r.save.gifts).toEqual({ nextAt: null, boxes: [] });
  });
});
