import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { buyItem } from '../../src/areas/farm/logic/actions/buyItem';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { buySlot } from '../../src/areas/farm/logic/actions/buySlot';
import { renamePig } from '../../src/areas/farm/logic/actions/renamePig';
import { sellPig } from '../../src/areas/farm/logic/actions/sellPig';
import { PIG_NAME_POOL } from '../../src/areas/farm/logic/config/names';
import { pickPigName } from '../../src/areas/farm/logic/pigNames';
import { addXP } from '../../src/areas/farm/logic/xp';
import { mulberry32, type Rng } from '../../src/core/rng';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import type { ActionResult, Pig, FarmGame } from '../../src/areas/farm/logic/types';
import { makePig } from './pigFactory';

const SEC = 1000;
const ctx = (now = 0, rng: Rng = mulberry32(7)) => ({ now, rng });
const start = (): FarmGame => newGame(ctx());
const withPigs = (pigs: Pig[], gold = 5000): FarmGame => {
  const s = start();
  return { ...s, pigs, player: { ...s.player, gold } };
};
const adult = (o: Partial<Pig> = {}) => makePig({ growthProgress: 100, ...o });

function expectOk(r: ActionResult): Extract<ActionResult, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
  return r;
}

/** Failure must leave the input untouched and return only the error. */
function expectError(run: (s: FarmGame) => ActionResult, s: FarmGame, error: string) {
  const before = structuredClone(s);
  expect(run(s)).toEqual({ ok: false, error });
  expect(s).toEqual(before);
}

describe('buyPig (§8.1)', () => {
  it('creates a PINK baby in slot 0 with the chosen gender, charges 500, records discovery', () => {
    const r = expectOk(buyPig(start(), { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx(5 * SEC)));
    const pig = r.state.pigs[0]!;
    expect(pig).toMatchObject({
      slotIndex: 0,
      breed: 'PIG_EARTH_PINK',
      gender: 'MALE',
      growthProgress: 0,
      hunger: 100,
      cleanliness: 100,
      isSick: false,
      pregnancy: null,
      lastTickedAt: 5 * SEC,
    });
    expect(PIG_NAME_POOL).toContain(pig.name);
    expect(r.state.transactions.map((t) => [t.type, t.amount])).toEqual([
      ['DISCOVERY_BONUS', 500],
      ['PIG_PURCHASE', -500],
      ['INITIAL_GOLD', 5000],
    ]);
    expect(r.state.player.gold).toBe(5000);
    expect(r.state.collection.discoveredBreeds).toEqual(['PIG_EARTH_PINK']);
    expect(r.events).toContainEqual({
      type: 'DISCOVERY',
      kind: 'BREED',
      id: 'PIG_EARTH_PINK',
      gold: 500,
    });
  });

  it('second purchase: no discovery bonus, FEMALE respected', () => {
    const first = expectOk(buyPig(start(), { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx()));
    const r = expectOk(buyPig(first.state, { breed: 'PIG_EARTH_PINK', gender: 'FEMALE' }, ctx()));
    expect(r.state.player.gold).toBe(4500);
    expect(r.state.pigs[1]).toMatchObject({ gender: 'FEMALE', slotIndex: 1 });
    expect(r.state.pigs[1]!.name).not.toBe(r.state.pigs[0]!.name);
    // The catch-up before the action now also opens the window's orders (PINK is discovered).
    expect(r.events.filter((e) => e.type !== 'ORDER_NEW')).toEqual([
      { type: 'PIG_BOUGHT', pigId: r.state.pigs[1]!.id, breed: 'PIG_EARTH_PINK' },
    ]);
  });

  it('uses the lowest free slotIndex', () => {
    const s = withPigs([makePig({ id: 'a', slotIndex: 0 }), makePig({ id: 'b', slotIndex: 2 })]);
    const r = expectOk(buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'FEMALE' }, ctx()));
    expect(r.state.pigs.find((p) => p.id !== 'a' && p.id !== 'b')!.slotIndex).toBe(1);
  });

  const buy = (s: FarmGame) => buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx());
  it('NO_PIG_SLOT when slots are full', () => {
    expectError(
      buy,
      withPigs([0, 1, 2, 3].map((i) => makePig({ id: `p${i}`, slotIndex: i }))),
      'NO_PIG_SLOT',
    );
  });

  it('a pregnancy no longer reserves a slot (BR-1): the 4th pig can be bought', () => {
    const pregnancy = {
      startedAt: 0,
      endsAt: 999_999 * SEC,
      fatherId: 'p1',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    const pigs = [0, 1, 2].map((i) => adult({ id: `p${i}`, slotIndex: i }));
    pigs[0] = { ...pigs[0]!, pregnancy };
    expectOk(buy(withPigs(pigs)));
    const four = [...pigs, adult({ id: 'p3', slotIndex: 3 })];
    expectError(buy, withPigs(four), 'NO_PIG_SLOT');
  });

  it('new shop species (A3): level gate, then bought at its price and discovered', () => {
    const run = (s: FarmGame) => buyPig(s, { breed: 'PIG_HEDGEHOG', gender: 'FEMALE' }, ctx());
    expectError(run, withPigs([], 10_000), 'LEVEL_TOO_LOW');
    const s = withPigs([], 10_000);
    const leveled = { ...s, player: { ...s.player, xp: BALANCE.LEVEL_XP[7]! } }; // level 8
    const r = expectOk(run(leveled));
    expect(r.state.pigs[0]?.breed).toBe('PIG_HEDGEHOG');
    expect(r.state.player.gold).toBe(10_000 - 7000 + BALANCE.DISCOVERY_BONUS_GOLD);
    expect(r.state.collection.discoveredBreeds).toContain('PIG_HEDGEHOG');
  });

  it('INSUFFICIENT_GOLD below 500', () => {
    expectError(buy, withPigs([], 499), 'INSUFFICIENT_GOLD');
  });

  it('INVALID_REQUEST for a non-buyable breed or a bad gender', () => {
    expectError(
      (s) => buyPig(s, { breed: 'PIG_SUPERMAN', gender: 'MALE' }, ctx()),
      start(),
      'INVALID_REQUEST',
    );
    expectError(
      (s) => buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'X' as 'MALE' }, ctx()),
      start(),
      'INVALID_REQUEST',
    );
    expectError(
      (s) => buyPig(s, { breed: 'NOPE' as 'PIG_EARTH_PINK', gender: 'MALE' }, ctx()),
      start(),
      'INVALID_REQUEST',
    );
  });
});

describe('pig names (DECISIONS Q8)', () => {
  const living = (names: string[]) => names.map((name, i) => makePig({ id: `p${i}`, name }));

  it('never repeats a living pig name while the pool has unused names', () => {
    const used = PIG_NAME_POOL.slice(0, -1);
    expect(pickPigName(mulberry32(1), living(used))).toBe(PIG_NAME_POOL.at(-1));
  });

  it('pool exhausted → smallest free numeric suffix', () => {
    const all = [...PIG_NAME_POOL, ...PIG_NAME_POOL.map((n) => `${n} 2`)];
    expect(pickPigName(mulberry32(1), living(all))).toMatch(/ 3$/);
    expect(pickPigName(mulberry32(1), living([...PIG_NAME_POOL]))).toMatch(/ 2$/);
  });
});

describe('sellPig (§8.7)', () => {
  // dt = 0 so advanceWorld changes nothing and happiness is exactly as set.
  it.each([
    [0, 840],
    [50, 1140],
    [100, 1440],
  ])('happiness %s → %s gold, +10 XP, PIG_SELL transaction', (h, price) => {
    const s = withPigs([adult({ cleanliness: h, hunger: h })], 1000);
    const r = expectOk(sellPig(s, { pigId: 'pig-1' }, ctx()));
    expect(r.state.pigs).toEqual([]);
    expect(r.state.player.gold).toBe(1000 + price);
    expect(r.state.player.xp).toBe(10);
    expect(r.state.transactions[0]).toMatchObject({
      type: 'PIG_SELL',
      amount: price,
      refId: 'pig-1',
      note: `PIG_EARTH_PINK happiness ${h}`,
    });
    expect(r.events).toContainEqual({ type: 'PIG_SOLD', pigId: 'pig-1', gold: price });
  });

  it('price is computed after advanceWorld (D18)', () => {
    // 3,600 s unattended, no trough (NH-1 budgets): clean 80, hunger 50 → happiness 67
    // → floor(1200 * 1.035).
    const r = expectOk(sellPig(withPigs([adult()]), { pigId: 'pig-1' }, ctx(3600 * SEC)));
    expect(r.state.transactions[0]!.amount).toBe(1242);
  });

  const sell = (s: FarmGame) => sellPig(s, { pigId: 'pig-1' }, ctx());
  it('baby → PIG_NOT_MATURE', () => expectError(sell, withPigs([makePig()]), 'PIG_NOT_MATURE'));

  it('pregnant → PIG_IS_PREGNANT', () => {
    const pregnancy = {
      startedAt: 0,
      endsAt: 999_999 * SEC,
      fatherId: 'x',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    expectError(sell, withPigs([adult({ pregnancy })]), 'PIG_IS_PREGNANT');
  });

  it('second sell → PIG_NOT_FOUND', () => {
    const once = expectOk(sell(withPigs([adult()])));
    expectError(sell, once.state, 'PIG_NOT_FOUND');
  });
});

describe('buyItem (§8.10)', () => {
  it('buys a quantity with one SHOP_PURCHASE transaction', () => {
    const r = expectOk(buyItem(start(), { itemId: 'FOOD_BASIC', quantity: 3 }, ctx()));
    expect(r.state.player.gold).toBe(4925);
    expect(r.state.inventory.FOOD_BASIC).toBe(13);
    expect(r.state.transactions[0]).toMatchObject({ type: 'SHOP_PURCHASE', amount: -75 });
  });

  it.each([0, 100, 1.5, -1, Number.NaN])('quantity %s → INVALID_REQUEST', (quantity) => {
    expectError(
      (s) => buyItem(s, { itemId: 'FOOD_BASIC', quantity }, ctx()),
      start(),
      'INVALID_REQUEST',
    );
  });

  it('unknown item → INVALID_REQUEST; too expensive → INSUFFICIENT_GOLD', () => {
    expectError(
      (s) => buyItem(s, { itemId: 'toString' as 'FOOD_BASIC', quantity: 1 }, ctx()),
      start(),
      'INVALID_REQUEST',
    );
    expectError(
      (s) => buyItem(s, { itemId: 'MEDICINE_COMMON', quantity: 51 }, ctx()),
      start(),
      'INSUFFICIENT_GOLD',
    );
  });
});

describe('buySlot (§8.11)', () => {
  const at = (xp: number, gold: number, unlockedSlots = 4): FarmGame => {
    const s = start();
    return { ...s, player: { ...s.player, xp, gold, unlockedSlots } };
  };

  it('opens slot 5 at level 2 for 2000: SLOT_PURCHASE transaction and SLOT_BOUGHT event', () => {
    const r = expectOk(buySlot(at(100, 2500), {}, ctx(SEC)));
    expect(r.state.player.unlockedSlots).toBe(5);
    expect(r.state.player.gold).toBe(500);
    expect(r.state.transactions[0]).toMatchObject({ type: 'SLOT_PURCHASE', amount: -2000 });
    expect(r.events).toContainEqual({ type: 'SLOT_BOUGHT', slots: 5, gold: -2000 });
  });

  it('level gate before gold: LEVEL_TOO_LOW, then INSUFFICIENT_GOLD', () => {
    expectError((s) => buySlot(s, {}, ctx()), at(99, 1_000_000), 'LEVEL_TOO_LOW');
    expectError((s) => buySlot(s, {}, ctx()), at(100, 1999), 'INSUFFICIENT_GOLD');
  });

  it('slot 12 needs level 9; slots past 12 need level 10; nothing past MAX_SLOTS (U05)', () => {
    expectError((s) => buySlot(s, {}, ctx()), at(3000, 1_000_000, 11), 'LEVEL_TOO_LOW');
    const r = expectOk(buySlot(at(4200, 80_000, 11), {}, ctx()));
    expect(r.state.player.unlockedSlots).toBe(12);
    expectError((s) => buySlot(s, {}, ctx()), r.state, 'LEVEL_TOO_LOW');
    const last = at(5700, 10_000_000, BALANCE.MAX_SLOTS - 1);
    const full = expectOk(buySlot(last, {}, ctx()));
    expect(full.state.player.unlockedSlots).toBe(BALANCE.MAX_SLOTS);
    expectError((s) => buySlot(s, {}, ctx()), full.state, 'MAX_SLOTS_REACHED');
  });
});

describe('renamePig (§8.12)', () => {
  const rename = (name: string) => (s: FarmGame) => renamePig(s, { pigId: 'pig-1', name }, ctx());

  it('trims and strips control characters', () => {
    const r = expectOk(rename('  \u0007Ủn\n Vàng  ')(withPigs([makePig()])));
    expect(r.state.pigs[0]!.name).toBe('Ủn Vàng');
  });

  it('accepts 16 characters, rejects 17 and blank', () => {
    expect(
      expectOk(rename('a'.repeat(16))(withPigs([makePig()]))).state.pigs[0]!.name,
    ).toHaveLength(16);
    expectError(rename('a'.repeat(17)), withPigs([makePig()]), 'INVALID_REQUEST');
    expectError(rename('   \t '), withPigs([makePig()]), 'INVALID_REQUEST');
  });

  it('unknown pig → PIG_NOT_FOUND', () => expectError(rename('Bin'), start(), 'PIG_NOT_FOUND'));
});

describe('addXP (§8.16)', () => {
  it('level-up emits LEVEL_UP and recomputes trough capacity', () => {
    const s = start();
    const r = addXP({ ...s, player: { ...s.player, xp: 90 } }, 10);
    expect(r.events).toEqual([{ type: 'LEVEL_UP', level: 2 }]);
    expect(r.state.trough.capacity).toBe(30);
  });

  it('never lowers XP', () => {
    const s = start();
    expect(addXP(s, -5).state).toBe(s);
  });
});

describe('gold never changes without a transaction (§8.16, §14.3)', () => {
  it('random action sequence: every gold delta equals the sum of new transactions', () => {
    const rng = mulberry32(2024);
    let state = start();
    let now = 0;
    for (let step = 0; step < 400; step++) {
      now += Math.floor(rng.next() * 3600) * SEC;
      // Test-only nudge (no gold involved): grow everyone so sells can succeed.
      if (rng.next() < 0.2) {
        state = { ...state, pigs: state.pigs.map((p) => ({ ...p, growthProgress: 100 })) };
      }
      const pig = state.pigs[Math.floor(rng.next() * Math.max(1, state.pigs.length))];
      const roll = rng.next();
      const c = ctx(now, rng);
      const result =
        roll < 0.35
          ? buyPig(
              state,
              { breed: 'PIG_EARTH_PINK', gender: rng.next() < 0.5 ? 'MALE' : 'FEMALE' },
              c,
            )
          : roll < 0.65
            ? sellPig(state, { pigId: pig?.id ?? 'none' }, c)
            : roll < 0.85
              ? buyItem(
                  state,
                  { itemId: 'FOOD_BASIC', quantity: 1 + Math.floor(rng.next() * 10) },
                  c,
                )
              : roll < 0.9
                ? buySlot(state, {}, c)
                : renamePig(state, { pigId: pig?.id ?? 'none', name: `Heo ${step}` }, c);
      if (!result.ok) continue;
      const seen = new Set(state.transactions.map((t) => t.id));
      const added = result.state.transactions.filter((t) => !seen.has(t.id));
      const delta = added.reduce((sum, t) => sum + t.amount, 0);
      expect(result.state.player.gold - state.player.gold).toBe(delta);
      expect(result.state.player.gold).toBeGreaterThanOrEqual(0);
      state = result.state;
    }
    expect(state.transactions.length).toBeGreaterThan(20);
  });

  it('no source file outside the farm gold.ts writes player.gold (the ledger posts every change)', () => {
    const sources = import.meta.glob<string>('/src/**/*.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    const writes = /\.gold\s*(\+\+|--|[-+*/]?=(?!=))|\bgold\s*:\s*[^,}\n]*player\.gold\b/;
    const offenders = Object.entries(sources)
      .filter(([f, text]) => !f.endsWith('/src/areas/farm/logic/gold.ts') && writes.test(text))
      .map(([f]) => f);
    expect(Object.keys(sources).length).toBeGreaterThan(20);
    expect(offenders).toEqual([]);
  });
});
