// GĐ2 health: ill → critical (48 h) → dead (72 h); nothing dies while the game is closed; the grace
// period after a catch-up (decisions 002 and 004); medicine in time saves the pig.
import { describe, expect, it } from 'vitest';
import { cleanManure } from '../../src/areas/farm/logic/actions/cleanManure';
import { upgradeTrough } from '../../src/areas/farm/logic/actions/upgradeTrough';
import { nextTroughLevel, troughLevel } from '../../src/areas/farm/logic/troughLevel';
import { sellItem } from '../../src/areas/farm/logic/actions/sellItem';
import { INVENTORY } from '../../src/core/config/inventory';
import { treatPig } from '../../src/areas/farm/logic/actions/treatPig';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { pigStage } from '../../src/areas/farm/logic/mortality';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { farmWorldEvents } from '../../src/areas/farm/logic/worldEvents';
import { HEALTH } from '../../src/core/config/health';
import { sequenceRng } from '../../src/core/rng';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

const SEC = 1000;
const H = 3_600 * SEC;
const rng = () => sequenceRng([1 - 1e-12]);
/** A sick pig since t = 0, in an old world (past the new-world protection). */
const sickFarm = (extra: Partial<FarmGame> = {}): FarmGame => ({
  ...makeState([makePig({ isSick: true, lastSickAt: 0, growthProgress: 100, hunger: 100, cleanliness: 100 })], 50),
  createdAt: -1e12,
  inventory: { FOOD_BASIC: 10, MEDICINE_COMMON: 3, item_manure: 0 },
  ...extra,
});
const types = (events: { type: string }[]) => events.map((e) => e.type);

describe('stages of an illness', () => {
  it('ill, critical after 48 h, dead after 72 h', () => {
    const pig = sickFarm().pigs[0]!;
    expect(pigStage(pig, 47 * H)).toBe('ill');
    expect(pigStage(pig, 48 * H)).toBe('critical');
    expect(pigStage(pig, 72 * H - 1)).toBe('critical');
    expect(pigStage(pig, 72 * H)).toBe('dead');
    expect(pigStage({ ...pig, isSick: false }, 100 * H)).toBe('healthy');
  });

  it('the content says 48 h and 72 h, a 12 h grace and 72 h of new-world protection', () => {
    expect([HEALTH.criticalAfterMs, HEALTH.deathAfterMs, HEALTH.deathGraceMs, HEALTH.newPlayerProtectionMs]).toEqual([48 * H, 72 * H, 12 * H, 72 * H]);
  });
});

describe('while the game is open (online)', () => {
  it('raises PIG_BECAME_CRITICAL once, at 48 h', () => {
    const early = advanceWorld(sickFarm(), 47 * H, rng());
    expect(types(early.events)).not.toContain('PIG_BECAME_CRITICAL');
    const at = advanceWorld(early.state, 49 * H, rng());
    expect(at.events.filter((e) => e.type === 'PIG_BECAME_CRITICAL')).toEqual([{ type: 'PIG_BECAME_CRITICAL', pigId: 'pig-1' }]);
    expect(advanceWorld(at.state, 60 * H, rng()).events.map((e) => e.type)).not.toContain('PIG_BECAME_CRITICAL');
  });

  it('a pig dies at 72 h of illness: it leaves the farm, a memorial stays, creature.died is published', () => {
    const alive = advanceWorld(sickFarm(), 72 * H - SEC, rng());
    expect(alive.state.pigs).toHaveLength(1);
    const dead = advanceWorld(alive.state, 72 * H, rng());
    expect(dead.state.pigs).toEqual([]);
    expect(dead.state.memorials).toEqual([{ id: 'pig-1', name: 'Ủn Hồng', breed: 'PIG_EARTH_PINK', diedAt: 72 * H }]);
    const died = dead.events.find((e) => e.type === 'PIG_DIED');
    expect(died).toEqual({ type: 'PIG_DIED', pigId: 'pig-1', name: 'Ủn Hồng', breed: 'PIG_EARTH_PINK' });
    expect(farmWorldEvents(died!)).toEqual([{ type: 'creature.died', area: 'sobi_farm', creatureId: 'pig-1' }]);
  });

  it('medicine in time saves it: healthy, recovering for 6 h, no death at 72 h', () => {
    const at60 = advanceWorld(sickFarm(), 60 * H, rng()).state;
    const r = treatPig(at60, { pigId: 'pig-1' }, { now: 60 * H, rng: rng() });
    if (!r.ok) throw new Error(r.error);
    expect(r.state.pigs[0]).toMatchObject({ isSick: false, recoveringUntil: 66 * H });
    const later = advanceWorld(r.state, 80 * H, rng());
    expect(later.state.pigs).toHaveLength(1);
    expect(types(later.events)).not.toContain('PIG_DIED');
  });

  it('only the ill pig is lost; a healthy neighbour stays', () => {
    const state = { ...sickFarm(), pigs: [...sickFarm().pigs, makePig({ id: 'pig-2', slotIndex: 1, growthProgress: 100 })] };
    const out = advanceWorld(state, 72 * H, rng());
    expect(out.state.pigs.map((p) => p.id)).toEqual(['pig-2']);
  });
});

describe('while the game was closed (offline) and the grace period', () => {
  it('a catch-up never kills: the pig stays (critical) and a 12 h grace starts at the catch-up\'s end', () => {
    const out = advanceWorld(sickFarm(), 100 * H, rng(), 0, 'offline');
    expect(out.state.pigs).toHaveLength(1);
    expect(types(out.events)).not.toContain('PIG_DIED');
    expect(types(out.events)).toContain('PIG_BECAME_CRITICAL');
    expect(out.state.graceUntil).toBe(100 * H + HEALTH.deathGraceMs);
  });

  it('then, with the game open, it still lives for 12 h — time to treat it — and dies after', () => {
    const closed = advanceWorld(sickFarm(), 100 * H, rng(), 0, 'offline').state;
    const during = advanceWorld(closed, 111 * H, rng());
    expect(during.state.pigs).toHaveLength(1);
    expect(types(during.events)).not.toContain('PIG_DIED');
    const after = advanceWorld(during.state, 112 * H, rng());
    expect(types(after.events)).toContain('PIG_DIED');
    expect(after.state.pigs).toEqual([]);
  });

  it('treating it during the grace saves it', () => {
    const closed = advanceWorld(sickFarm(), 100 * H, rng(), 0, 'offline').state;
    const r = treatPig(closed, { pigId: 'pig-1' }, { now: 101 * H, rng: rng() });
    if (!r.ok) throw new Error(r.error);
    const later = advanceWorld(r.state, 150 * H, rng()); // it may fall ill again (the pen is filthy), but not die yet
    expect(later.state.pigs).toHaveLength(1);
  });

  it('no grace is set when nobody is past their time', () => {
    const out = advanceWorld(sickFarm(), 60 * H, rng(), 0, 'offline');
    expect(out.state.graceUntil).toBeUndefined();
  });
});

describe('manure', () => {
  it('piles up from Young pigs, one per 8 h each, capped', () => {
    const state: FarmGame = makeState([makePig({ growthProgress: 100, lastTickedAt: 0 })], 0);
    expect(advanceWorld(state, 7 * H, rng()).state.manure).toBeUndefined();
    expect(advanceWorld(state, 8 * H, rng()).state.manure).toBe(1);
    expect(advanceWorld(state, 20 * H, rng()).state.manure).toBe(2);
    expect(advanceWorld(state, 400 * H, rng()).state.manure).toBe(12); // MANURE_MAX
  });

  it('a baby makes none', () => {
    const baby: FarmGame = makeState([makePig({ growthProgress: 0 })], 0);
    expect(advanceWorld(baby, 5 * H, rng()).state.manure).toBeUndefined();
  });

  it('piles make the pen dirtier: -1 cleanliness per hour per pile, up to 4 piles', () => {
    const clean = (manure: number) =>
      advanceWorld({ ...makeState([makePig()], 0), manure }, H, rng()).state.pigs[0]!.cleanliness;
    expect(clean(0)).toBeCloseTo(96, 9); // -4 per hour
    expect(clean(2)).toBeCloseTo(94, 9);
    expect(clean(4)).toBeCloseTo(92, 9);
    expect(clean(9)).toBeCloseTo(92, 9); // only 4 count
  });
});

describe('sleep', () => {
  const at = (hourOfDay: number) => 20_000 * 24 * H + hourOfDay * H; // UTC day, dayOffset 0
  const energyAfter = (from: number, to: number, energy = 50) => {
    const state = makeState([makePig({ energy, lastTickedAt: from, growthProgress: 100 })], 0);
    return advanceWorld({ ...state, trough: { ...state.trough, lastResolvedAt: from } }, to, rng()).state.pigs[0]!.energy!;
  };

  it('awake by day: -5 an hour', () => {
    expect(energyAfter(at(10), at(12))).toBeCloseTo(40, 9);
  });

  it('asleep at night: +12 an hour, capped at 100', () => {
    expect(energyAfter(at(21), at(23))).toBeCloseTo(74, 9);
    expect(energyAfter(at(21), at(26), 90)).toBe(100);
  });

  it('crossing the evening: awake until 20:00, asleep after', () => {
    expect(energyAfter(at(19), at(21))).toBeCloseTo(50 - 5 + 12, 9);
    expect(energyAfter(at(4), at(6))).toBeCloseTo(50 + 12 - 5, 9); // night until 05:00
  });
});

describe('raking the pen: Dọn phân → item_manure, then sold', () => {
  const ctx = { now: 0, rng: rng() };
  const withPiles = (manure: number, items: Partial<FarmGame['inventory']> = {}): FarmGame => ({
    ...makeState([makePig()], 0),
    manure,
    inventory: { FOOD_BASIC: 0, MEDICINE_COMMON: 0, item_manure: 0, ...items },
  });

  it('every pile becomes one item_manure; the pen is clean; 2 XP a pile', () => {
    const r = cleanManure(withPiles(5), ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.manure).toBe(0);
    expect(r.state.inventory.item_manure).toBe(5);
    expect(r.state.player.xp).toBe(10);
    expect(r.events).toContainEqual({ type: 'MANURE_CLEANED', piles: 5, kept: 5 });
    expect(farmWorldEvents(r.events[0]!)).toEqual([{ type: 'item.added', area: 'sobi_farm', itemId: 'item_manure', quantity: 5 }]);
  });

  it('a clean pen is refused', () => {
    expect(cleanManure(withPiles(0), ctx)).toEqual({ ok: false, error: 'NO_MANURE' });
    expect(cleanManure(makeState([makePig()], 0), ctx)).toEqual({ ok: false, error: 'NO_MANURE' });
  });

  it('a full bag keeps what fits and throws the rest away, but the pen is still raked', () => {
    // 39 full slots of food + a slot of manure with room for 2 more
    const r = cleanManure(withPiles(4, { FOOD_BASIC: (INVENTORY.slots - 1) * INVENTORY.stack, item_manure: INVENTORY.stack - 2 }), ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.manure).toBe(0);
    expect(r.state.inventory.item_manure).toBe(INVENTORY.stack);
    expect(r.events).toContainEqual({ type: 'MANURE_CLEANED', piles: 4, kept: 2 });
  });

  it('manure sells for 6 each; other items cannot be sold; no more than you have', () => {
    const s = withPiles(0, { item_manure: 10 });
    const r = sellItem(s, { itemId: 'item_manure', quantity: 4 }, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.inventory.item_manure).toBe(6);
    expect(r.state.player.gold).toBe(s.player.gold + 24);
    expect(r.state.transactions[0]).toMatchObject({ type: 'ITEM_SELL', amount: 24, refId: 'item_manure' });
    expect(sellItem(s, { itemId: 'FOOD_BASIC', quantity: 1 }, ctx)).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(sellItem(s, { itemId: 'item_manure', quantity: 11 }, ctx)).toEqual({ ok: false, error: 'INSUFFICIENT_ITEM' });
    expect(sellItem(s, { itemId: 'item_manure', quantity: 0 }, ctx)).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });
});

describe('trough levels (GAME_BALANCE §2.6)', () => {
  const ctx = { now: 0, rng: rng() };
  const farmWith = (trough: FarmGame['trough'], gold = 100_000): FarmGame => ({ ...makeState([], 0), trough, player: { gold, xp: 0, unlockedSlots: 4 } });

  it('a new farm has a level-1 trough of 30', () => {
    const t = makeState([], 0).trough;
    expect(troughLevel({ capacity: 30 })).toBe(1);
    expect(nextTroughLevel(t)).toEqual({ level: 2, capacity: 80, cost: 1200 });
  });

  it('upgrading costs each level costs its price and raises the capacity; the food stays', () => {
    const s = farmWith({ food: 12, capacity: 30, level: 1, lastResolvedAt: 0 }, 9000);
    const r = upgradeTrough(s, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.trough).toEqual({ food: 12, capacity: 80, level: 2, lastResolvedAt: 0 });
    expect(r.state.player.gold).toBe(7800);
    expect(r.state.transactions[0]).toMatchObject({ type: 'TROUGH_UPGRADE', amount: -1200 });
    expect(r.events).toContainEqual({ type: 'TROUGH_UPGRADED', level: 2, capacity: 80, gold: -1200 });
    const r3 = upgradeTrough(r.state, ctx);
    if (!r3.ok) throw new Error(r3.error);
    expect(r3.state.trough).toMatchObject({ capacity: 200, level: 3 });
    expect(r3.state.player.gold).toBe(7800 - 4000);
  });

  it('refused without the gold, and at the top level', () => {
    expect(upgradeTrough(farmWith({ food: 0, capacity: 30, level: 1, lastResolvedAt: 0 }, 1199), ctx)).toEqual({ ok: false, error: 'INSUFFICIENT_GOLD' });
    expect(upgradeTrough(farmWith({ food: 0, capacity: 200, level: 3, lastResolvedAt: 0 }), ctx)).toEqual({ ok: false, error: 'TROUGH_MAX_LEVEL' });
  });

  it('a save from before levels gets the level its capacity reaches (Sobi Farm capacity 110 → level 2)', () => {
    expect(troughLevel({ capacity: 20 })).toBe(1);
    expect(troughLevel({ capacity: 110 })).toBe(2);
    expect(troughLevel({ capacity: 200 })).toBe(3);
  });
});
