// Shared world modules (GĐ1 step 4): economy ledger, the bag, item lookups, progression.
import { describe, expect, it } from 'vitest';
import { INVENTORY } from '../../src/core/config/inventory';
import { WORLD_DEVELOPMENT } from '../../src/core/config/progression';
import { changeCurrency, postTransaction, type TransactionRecord } from '../../src/core/economy/ledger';

const none: TransactionRecord[] = [];
import { addAllToBag, addToBag, countOf, takeFromBag, usedSlots } from '../../src/core/inventory/bag';
import { isFood, itemDef } from '../../src/core/items/catalog';
import { levelFromXp, nextLevelXp, unlockGaps, worldDevelopment } from '../../src/core/progression/levels';
import { SAVE } from '../../src/core/config/save';
import { mulberry32 } from '../../src/core/rng';
import { emptyWorld } from '../../src/core/save/world';
import { buyItem } from '../../src/areas/farm/logic/actions/buyItem';
import { inv, makeState } from './stateFactory';

const ctx = (now = 1_000) => ({ now, rng: mulberry32(7) });
const settings = { musicOn: true, sfxOn: true, reduceMotion: false, tutorialDone: false, lastExportAt: null };

describe('economy: one ledger for every currency', () => {
  it('posts a signed change with a transaction, newest first, capped', () => {
    const r = postTransaction(100, none, -30, { type: 'SHOP_PURCHASE', refId: 'X' }, ctx());
    expect(r).toMatchObject({ ok: true, balance: 70 });
    expect(r.ok && r.transactions[0]).toMatchObject({ at: 1_000, type: 'SHOP_PURCHASE', amount: -30, refId: 'X' });
    const many: TransactionRecord[] = Array.from({ length: SAVE.TRANSACTIONS_MAX }, (_, i) => ({ id: `t${i}`, at: i, type: 'X', amount: 1 }));
    const capped = postTransaction(0, many, 5, { type: 'Y' }, ctx());
    expect(capped.ok && capped.transactions).toHaveLength(SAVE.TRANSACTIONS_MAX);
    expect(capped.ok && capped.transactions[0]!.type).toBe('Y');
  });

  it('never goes negative and writes nothing then; -0 reads as 0', () => {
    expect(postTransaction(10, none, -11, { type: 'X' }, ctx())).toEqual({ ok: false, error: 'INSUFFICIENT_GOLD' });
    const zero = postTransaction(10, none, -0, { type: 'X' }, ctx());
    expect(zero.ok && Object.is(zero.transactions[0]!.amount, 0)).toBe(true);
  });

  it('gems and event tokens move through the same ledger, tagged with their currency', () => {
    const w = emptyWorld(0, settings, 'sobi_farm');
    const r = changeCurrency(w, 'gems', 5, { type: 'ACHIEVEMENT_REWARD' }, ctx());
    expect(r.ok && r.state.wallet).toEqual({ coins: 0, gems: 5, eventTokens: 0 });
    expect(r.ok && r.state.transactions[0]).toMatchObject({ currency: 'gems', amount: 5 });
    expect(changeCurrency(w, 'eventTokens', -1, { type: 'X' }, ctx()).ok).toBe(false);
  });
});

describe('inventory: the shared bag', () => {
  const rules = { slots: 2, stack: 10 };

  it('counts slots by stacks and refuses what does not fit', () => {
    expect(usedSlots({ A: 10, B: 1, C: 0 }, rules)).toBe(2);
    expect(addToBag({ A: 10 }, 'A', 10, rules)).toEqual({ ok: true, items: { A: 20 } });
    expect(addToBag({ A: 20 }, 'A', 1, rules)).toEqual({ ok: false, error: 'INVENTORY_FULL' });
    expect(addToBag({ A: 10 }, 'B', 5, rules)).toEqual({ ok: true, items: { A: 10, B: 5 } });
  });

  it('takes only what is there; quantities are whole and not negative', () => {
    expect(takeFromBag({ A: 2 }, 'A', 2)).toEqual({ ok: true, items: { A: 0 } });
    expect(takeFromBag({ A: 2 }, 'A', 3)).toEqual({ ok: false, error: 'INSUFFICIENT_ITEM' });
    expect(takeFromBag({}, 'B', 1)).toEqual({ ok: false, error: 'INSUFFICIENT_ITEM' });
    expect(addToBag({}, 'A', 1.5, rules)).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(addToBag({}, 'A', -1, rules)).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(countOf({ A: 3 }, 'Z')).toBe(0);
  });

  it('adds a reward all or nothing', () => {
    expect(addAllToBag({ A: 1 }, { A: 2, B: 3 }, rules)).toEqual({ ok: true, items: { A: 3, B: 3 } });
    expect(addAllToBag({ A: 10, B: 10 }, { A: 0, C: 1 }, rules)).toEqual({ ok: false, error: 'INVENTORY_FULL' });
  });

  it('the shipped bag is 40 slots of 99 (GAME_BALANCE §8)', () => {
    expect(INVENTORY).toEqual({ slots: 40, stack: 99 });
  });

  it('a farm purchase that would overflow the bag is refused without spending', () => {
    const full = { ...makeState(), inventory: inv({ FOOD_BASIC: INVENTORY.slots * INVENTORY.stack }) };
    expect(buyItem(full, { itemId: 'FOOD_BASIC', quantity: 1 }, ctx())).toEqual({ ok: false, error: 'INVENTORY_FULL' });
  });
});

describe('items', () => {
  it('looks items up by content id; an unknown id is undefined', () => {
    expect(itemDef('FOOD_BASIC')).toMatchObject({ id: 'FOOD_BASIC' });
    expect(isFood(itemDef('FOOD_BASIC')!)).toBe(true);
    expect(itemDef('item_unknown')).toBeUndefined();
    expect(itemDef('toString')).toBeUndefined();
  });
});

describe('progression', () => {
  const table = { xp: [0, 100, 250], maxLevel: 3 };

  it('levels come from xp and stop at the cap', () => {
    expect([0, 99, 100, 249, 250, 9999].map((x) => levelFromXp(x, table))).toEqual([1, 1, 2, 2, 3, 3]);
    expect(nextLevelXp(1, table)).toBe(100);
    expect(nextLevelXp(3, table)).toBeNull();
  });

  it('World Development = area levels + codex / 10 + Lv3 buildings', () => {
    const wd = worldDevelopment({ areaLevels: { sobi_farm: 3, sobi_garden: 2 }, codexEntries: 25, buildingsLv3: 1 }, WORLD_DEVELOPMENT);
    expect(wd).toBe(5 + 2 + 1);
  });

  it('lists what an Area still needs to open', () => {
    const rule = { areaLevels: { sobi_farm: 6, sobi_garden: 4 }, worldDevelopment: 15 };
    expect(unlockGaps(rule, { sobi_farm: 6, sobi_garden: 2 }, 9)).toEqual([
      { kind: 'areaLevel', areaId: 'sobi_garden', need: 4, have: 2 },
      { kind: 'worldDevelopment', need: 15, have: 9 },
    ]);
    expect(unlockGaps(rule, { sobi_farm: 8, sobi_garden: 4 }, 15)).toEqual([]);
    expect(unlockGaps({}, {}, 0)).toEqual([]);
  });
});
