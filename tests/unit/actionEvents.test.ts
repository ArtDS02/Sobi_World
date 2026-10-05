// Spec §8.0 (D25): every successful action returns its own feedback event.
import { describe, expect, it } from 'vitest';
import { buyItem } from '../../src/areas/farm/logic/actions/buyItem';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { buySlot } from '../../src/areas/farm/logic/actions/buySlot';
import { cleanAll, cleanPig } from '../../src/areas/farm/logic/actions/cleanPig';
import { feedPig } from '../../src/areas/farm/logic/actions/feedPig';
import { fillTrough } from '../../src/areas/farm/logic/actions/fillTrough';
import { renamePig } from '../../src/areas/farm/logic/actions/renamePig';
import { sellPig } from '../../src/areas/farm/logic/actions/sellPig';
import { treatPig } from '../../src/areas/farm/logic/actions/treatPig';
import { GAME_EVENT_TYPES } from '../../src/core/events';
import type { ActionResult } from '../../src/core/types';
import { ctx, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const actionEvents = (r: ActionResult) => expectOk(r).events;

describe('action feedback events (§8.0)', () => {
  it('buyPig → PIG_BOUGHT { pigId, breed } before DISCOVERY', () => {
    const r = expectOk(buyPig(farm(), { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx()));
    const pigId = r.state.pigs[0]!.id;
    expect(r.events[0]).toEqual({ type: 'PIG_BOUGHT', pigId, breed: 'PIG_EARTH_PINK' });
    expect(r.events.map((e) => e.type)).toContain('DISCOVERY');
  });

  it('feedPig → PIG_FED { pigId }', () => {
    const s = farm([makePig({ hunger: 10 })]);
    expect(actionEvents(feedPig(s, { pigId: 'pig-1' }, ctx()))).toContainEqual({
      type: 'PIG_FED',
      pigId: 'pig-1',
    });
  });

  it('cleanPig / cleanAll → PIG_CLEANED { pigIds } of the pigs actually cleaned', () => {
    const s = farm([
      makePig({ id: 'a', slotIndex: 0, cleanliness: 40 }),
      makePig({ id: 'b', slotIndex: 1, cleanliness: 100 }),
    ]);
    expect(actionEvents(cleanPig(s, { pigId: 'a' }, ctx()))).toContainEqual({
      type: 'PIG_CLEANED',
      pigIds: ['a'],
    });
    expect(actionEvents(cleanAll(s, ctx()))).toContainEqual({ type: 'PIG_CLEANED', pigIds: ['a'] });
  });

  it('treatPig → PIG_TREATED { pigId }', () => {
    const s = farm([makePig({ isSick: true })]);
    expect(actionEvents(treatPig(s, { pigId: 'pig-1' }, ctx()))).toEqual([
      { type: 'PIG_TREATED', pigId: 'pig-1' },
    ]);
  });

  it('fillTrough → TROUGH_FILLED { units, fromInventory, gold } with signed gold', () => {
    // newGame: 10 food in inventory, trough capacity 20.
    expect(actionEvents(fillTrough(farm(), { units: 15 }, ctx()))).toEqual([
      { type: 'TROUGH_FILLED', units: 15, fromInventory: 10, gold: -125 },
    ]);
    expect(actionEvents(fillTrough(farm(), { units: 4 }, ctx()))).toEqual([
      { type: 'TROUGH_FILLED', units: 4, fromInventory: 4, gold: 0 },
    ]);
  });

  it('buyItem → ITEM_BOUGHT { itemId, quantity, gold }', () => {
    expect(actionEvents(buyItem(farm(), { itemId: 'FOOD_BASIC', quantity: 3 }, ctx()))).toEqual([
      { type: 'ITEM_BOUGHT', itemId: 'FOOD_BASIC', quantity: 3, gold: -75 },
    ]);
  });

  it('renamePig → PIG_RENAMED { pigId }', () => {
    const s = farm([makePig()]);
    expect(actionEvents(renamePig(s, { pigId: 'pig-1', name: 'Bin' }, ctx()))).toEqual([
      { type: 'PIG_RENAMED', pigId: 'pig-1' },
    ]);
  });

  it('sellPig and buySlot keep their events', () => {
    const s = farm([makePig({ growthProgress: 100 })]);
    expect(actionEvents(sellPig(s, { pigId: 'pig-1' }, ctx())).map((e) => e.type)).toContain(
      'PIG_SOLD',
    );
    const rich = farm([], { player: { ...farm().player, xp: 100_000, gold: 100_000 } });
    expect(actionEvents(buySlot(rich, {}, ctx())).map((e) => e.type)).toContain('SLOT_BOUGHT');
  });

  it('GAME_EVENT_TYPES lists each type once', () => {
    expect(new Set(GAME_EVENT_TYPES).size).toBe(GAME_EVENT_TYPES.length);
  });
});
