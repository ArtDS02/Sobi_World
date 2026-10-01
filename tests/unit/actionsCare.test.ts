import { describe, expect, it } from 'vitest';
import { cleanAll, cleanPig } from '../../src/core/actions/cleanPig';
import { feedPig } from '../../src/core/actions/feedPig';
import { fillTrough } from '../../src/core/actions/fillTrough';
import { treatPig } from '../../src/core/actions/treatPig';
import { troughCapacityForLevel } from '../../src/core/config/levels';
import type { SaveGame } from '../../src/core/types';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

// All actions run at t=0 = lastTickedAt, so advanceWorld changes nothing.
const pigWith = (o: Parameters<typeof makePig>[0]) => farm([makePig(o)]);

describe('feedPig (§8.2)', () => {
  const feed = (s: SaveGame) => feedPig(s, { pigId: 'pig-1' }, ctx());

  it('ALREADY_FULL at 100', () => expectError(feed, pigWith({ hunger: 100 }), 'ALREADY_FULL'));

  it('consumes exactly one food and caps hunger at 100', () => {
    const r = expectOk(feed(pigWith({ hunger: 70 })));
    expect(r.state.pigs[0]!.hunger).toBe(100);
    expect(r.state.inventory.FOOD_BASIC).toBe(9);
  });

  it.each([
    [80, 2],
    [10, 2],
    [80.01, 0],
    [99, 0],
  ])('hunger %s before → +%s XP (D11)', (hunger, xp) => {
    expect(expectOk(feed(pigWith({ hunger }))).state.player.xp).toBe(xp);
  });

  it('INSUFFICIENT_ITEM without food; PIG_NOT_FOUND for an unknown pig', () => {
    const s = pigWith({ hunger: 10 });
    expectError(feed, { ...s, inventory: { ...s.inventory, FOOD_BASIC: 0 } }, 'INSUFFICIENT_ITEM');
    expectError(feed, farm(), 'PIG_NOT_FOUND');
  });

  it('does not touch gold', () => {
    const r = expectOk(feed(pigWith({ hunger: 10 })));
    expect(r.state.player.gold).toBe(5000);
    expect(r.state.transactions).toHaveLength(1);
  });
});

describe('cleanPig (§8.3)', () => {
  const clean = (s: SaveGame) => cleanPig(s, { pigId: 'pig-1' }, ctx());

  it('ALREADY_CLEAN at 100', () =>
    expectError(clean, pigWith({ cleanliness: 100 }), 'ALREADY_CLEAN'));

  it.each([
    [70, 2],
    [0, 2],
    [70.5, 0],
    [99, 0],
  ])('cleanliness %s before → 100, +%s XP (D11)', (cleanliness, xp) => {
    const r = expectOk(clean(pigWith({ cleanliness })));
    expect(r.state.pigs[0]!.cleanliness).toBe(100);
    expect(r.state.player.xp).toBe(xp);
  });

  it('does not cure sickness', () => {
    const r = expectOk(clean(pigWith({ cleanliness: 20, isSick: true })));
    expect(r.state.pigs[0]!.isSick).toBe(true);
  });
});

describe('cleanAll (§8.4)', () => {
  it('clean farm → ok, no events, nothing changes but updatedAt', () => {
    const s = farm([makePig(), makePig({ id: 'pig-2', slotIndex: 1 })]);
    const r = expectOk(cleanAll(s, ctx()));
    expect(r.events).toEqual([]);
    expect(r.state.pigs).toEqual(s.pigs);
    expect(r.state.player).toEqual(s.player);
  });

  it('empty farm never errors', () => {
    expect(cleanAll(farm(), ctx()).ok).toBe(true);
  });

  it('cleans every dirty pig; XP per pig under the D11 rule', () => {
    const s = farm([
      makePig({ id: 'a', slotIndex: 0, cleanliness: 50 }),
      makePig({ id: 'b', slotIndex: 1, cleanliness: 71 }),
      makePig({ id: 'c', slotIndex: 2, cleanliness: 10, isSick: true }),
      makePig({ id: 'd', slotIndex: 3, cleanliness: 100 }),
    ]);
    const r = expectOk(cleanAll(s, ctx()));
    expect(r.state.pigs.map((p) => p.cleanliness)).toEqual([100, 100, 100, 100]);
    expect(r.state.player.xp).toBe(4); // a and c
    expect(r.state.pigs[2]!.isSick).toBe(true);
  });

  it('XP from cleanAll can level up', () => {
    const base = farm(
      Array.from({ length: 4 }, (_, i) => makePig({ id: `p${i}`, slotIndex: i, cleanliness: 0 })),
    );
    const s = { ...base, player: { ...base.player, xp: 95 } };
    const r = expectOk(cleanAll(s, ctx()));
    expect(r.events).toEqual([{ type: 'LEVEL_UP', level: 2 }]);
  });
});

describe('treatPig (§8.5)', () => {
  const treat = (s: SaveGame) => treatPig(s, { pigId: 'pig-1' }, ctx());

  it('cures, consumes 1 medicine, no XP, hunger/cleanliness unchanged', () => {
    const r = expectOk(treat(pigWith({ isSick: true, hunger: 33, cleanliness: 12 })));
    expect(r.state.pigs[0]).toMatchObject({ isSick: false, hunger: 33, cleanliness: 12 });
    expect(r.state.inventory.MEDICINE_COMMON).toBe(0);
    expect(r.state.player.xp).toBe(0);
  });

  it('PIG_NOT_SICK on a healthy pig', () => expectError(treat, pigWith({}), 'PIG_NOT_SICK'));

  it('INSUFFICIENT_ITEM without medicine', () => {
    const s = pigWith({ isSick: true });
    expectError(
      treat,
      { ...s, inventory: { ...s.inventory, MEDICINE_COMMON: 0 } },
      'INSUFFICIENT_ITEM',
    );
  });
});

describe('fillTrough (§8.6)', () => {
  const fill = (units: number) => (s: SaveGame) => fillTrough(s, { units }, ctx());

  it('all from inventory → one TROUGH_FILL transaction of 0 gold', () => {
    const r = expectOk(fill(6)(farm()));
    expect(r.state.trough.food).toBe(6);
    expect(r.state.inventory.FOOD_BASIC).toBe(4);
    expect(r.state.player.gold).toBe(5000);
    expect(r.state.transactions[0]).toMatchObject({ type: 'TROUGH_FILL', amount: 0 });
  });

  it('shortfall is bought at 25 gold each in the same action', () => {
    const r = expectOk(fill(15)(farm()));
    expect(r.state.trough.food).toBe(15);
    expect(r.state.inventory.FOOD_BASIC).toBe(0);
    expect(r.state.player.gold).toBe(5000 - 5 * 25);
    expect(r.state.transactions.filter((t) => t.type === 'TROUGH_FILL')).toHaveLength(1);
    expect(r.state.transactions[0]!.amount).toBe(-125);
  });

  it('beyond capacity → TROUGH_FULL and nothing changes', () => {
    expectError(fill(21), farm(), 'TROUGH_FULL');
    const s = farm([], { trough: { food: 15, capacity: 20, lastResolvedAt: 0 } });
    expectError(fill(6), s, 'TROUGH_FULL');
    expect(expectOk(fill(5)(s)).state.trough.food).toBe(20);
  });

  it('INSUFFICIENT_GOLD when the shortfall cannot be paid', () => {
    const base = farm();
    const s = { ...base, player: { ...base.player, gold: 24 } };
    expectError(fill(11), s, 'INSUFFICIENT_GOLD');
  });

  it.each([0, -1, 2.5, Number.NaN])('units %s → INVALID_REQUEST', (units) => {
    expectError(fill(units), farm(), 'INVALID_REQUEST');
  });

  it('capacity = min(120, 20 + (level-1) * 10)', () => {
    expect(troughCapacityForLevel(1)).toBe(20);
    expect(troughCapacityForLevel(10)).toBe(110);
    expect(troughCapacityForLevel(15)).toBe(120);
  });
});
