// World events (ARCHITECTURE §7): the bus, and the farm's events published as standard ones.
import { describe, expect, it } from 'vitest';
import { createEventBus, WORLD_EVENT_TYPES, type WorldEvent } from '../../src/core/events';
import { buyItem } from '../../src/areas/farm/logic/actions/buyItem';
import { farmWorldEvents } from '../../src/areas/farm/logic/worldEvents';
import { fakeClock } from '../../src/core/clock';
import { mulberry32 } from '../../src/core/rng';
import { createFarmGameStore, world } from './worldKit';
import { makeState } from './stateFactory';

describe('event bus', () => {
  it('delivers by type and to * listeners, in order; unsubscribe stops it', () => {
    const bus = createEventBus();
    const log: string[] = [];
    const off = bus.on('item.added', (e) => log.push(`item:${e.type}`));
    bus.on('*', (e) => log.push(`all:${e.type}`));
    bus.emit([
      { type: 'item.added', area: 'a', itemId: 'X', quantity: 1 },
      { type: 'area.levelUp', area: 'a', level: 2 },
    ]);
    off();
    bus.emit([{ type: 'item.added', area: 'a', itemId: 'X', quantity: 1 }]);
    expect(log).toEqual(['item:item.added', 'all:item.added', 'all:area.levelUp', 'all:item.added']);
  });

  it('lists every standard event of ARCHITECTURE §7', () => {
    expect(WORLD_EVENT_TYPES).toHaveLength(25);
  });
});

describe('farm events as world events', () => {
  it('maps sales, births, sickness, items and coins', () => {
    expect(farmWorldEvents({ type: 'PIG_SOLD', pigId: 'p', gold: 900 })).toEqual([
      { type: 'creature.sold', area: 'sobi_farm', creatureId: 'p', amount: 900 },
      { type: 'currency.changed', area: 'sobi_farm', currency: 'coins', amount: 900 },
    ]);
    expect(farmWorldEvents({ type: 'BIRTH', motherId: 'm', childId: 'c', childBreed: 'PIG_WHITE' })).toEqual([
      { type: 'creature.born', area: 'sobi_farm', creatureId: 'c', breed: 'PIG_WHITE' },
    ]);
    expect(farmWorldEvents({ type: 'TROUGH_FILLED', units: 5, fromInventory: 0, gold: 0 })).toEqual([]);
    expect(farmWorldEvents({ type: 'PIG_RENAMED', pigId: 'p' })).toEqual([]);
  });

  it('the store publishes them on the world bus after an action', async () => {
    const saved = world(makeState());
    const store = createFarmGameStore({
      storage: { load: async () => ({ kind: 'ok', save: saved, source: 'primary', fromVersion: 8 }), save: async () => {} },
      instanceGuard: { start: async () => true, isReadOnly: () => false, close() {} },
      clock: fakeClock(0),
      rng: mulberry32(1),
      page: null,
      every: () => 0,
      cancel: () => {},
    });
    const seen: WorldEvent[] = [];
    store.onWorldEvent('*', (e) => seen.push(e));
    await store.init();
    await store.dispatch((s, c) => buyItem(s, { itemId: 'FOOD_BASIC', quantity: 3 }, c));
    expect(seen).toEqual([
      { type: 'item.added', area: 'sobi_farm', itemId: 'FOOD_BASIC', quantity: 3 },
      { type: 'currency.changed', area: 'sobi_farm', currency: 'coins', amount: -75 },
    ]);
  });
});
