import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { buyPig } from '../../src/core/actions/buyPig';
import { sellPig } from '../../src/core/actions/sellPig';
import { fakeClock, type FakeClock } from '../../src/core/clock';
import { SAVE } from '../../src/core/config/save';
import type { GameEvent } from '../../src/core/events';
import { mulberry32 } from '../../src/core/rng';
import {
  createSaveStorage,
  type KeyValueStore,
  type SaveStorage,
} from '../../src/core/save/storage';
import { createGameStore, type PageLike, type StoreDeps } from '../../src/store/gameStore';
import type { ChannelLike } from '../../src/store/tabGuard';

const SEC = 1000;
const T0 = 1_700_000_000_000;

class MemoryStore implements KeyValueStore {
  map = new Map<string, string>();
  getItem = (k: string) => this.map.get(k) ?? null;
  setItem = (k: string, v: string) => void this.map.set(k, v);
}

/** Counts writes on top of a real (fake-indexeddb) storage. */
function countingStorage(local: KeyValueStore) {
  const inner = createSaveStorage({ local });
  const counter = { saves: 0 };
  const storage: SaveStorage = {
    load: () => inner.load(),
    save: async (s) => {
      counter.saves += 1;
      await inner.save(s);
    },
  };
  return { storage, counter };
}

function fakeTimers() {
  const live = new Map<number, () => void>();
  let next = 1;
  let created = 0;
  return {
    every: (fn: () => void) => {
      created += 1;
      live.set(next, fn);
      return next++;
    },
    cancel: (h: unknown) => void live.delete(h as number),
    fire: () => [...live.values()].forEach((fn) => fn()),
    live: () => live.size,
    created: () => created,
  };
}

function fakePage(): PageLike & { visible: boolean; emit(type: string): void } {
  const listeners = new Map<string, Set<() => void>>();
  return {
    visible: true,
    isVisible() {
      return this.visible;
    },
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
      return () => listeners.get(type)!.delete(fn);
    },
    emit(type) {
      listeners.get(type)?.forEach((fn) => fn());
    },
  };
}

/** In-memory BroadcastChannel bus with async (microtask) delivery. */
function channelBus() {
  const members = new Set<ChannelLike>();
  return () => {
    const ch: ChannelLike = {
      onmessage: null,
      postMessage(data) {
        for (const other of members) {
          if (other !== ch) queueMicrotask(() => other.onmessage?.({ data }));
        }
      },
      close: () => void members.delete(ch),
    };
    members.add(ch);
    return ch;
  };
}

let local: MemoryStore;
let clock: FakeClock;
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  local = new MemoryStore();
  clock = fakeClock(T0);
});

function makeStore(extra: Partial<StoreDeps> = {}) {
  const { storage, counter } = countingStorage(local);
  const timers = fakeTimers();
  const page = fakePage();
  const store = createGameStore({
    storage,
    clock,
    rng: mulberry32(11),
    every: timers.every,
    cancel: timers.cancel,
    sleep: () => new Promise((r) => setTimeout(r, 0)),
    channel: null,
    page,
    requestPersist: async () => true,
    ...extra,
  });
  return { store, counter, timers, page };
}

const buy = (s: Parameters<typeof buyPig>[0], c: Parameters<typeof buyPig>[2]) =>
  buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'FEMALE' }, c);

describe('gameStore', () => {
  it('first launch creates and persists the starter save; reload keeps it', async () => {
    const { store, counter } = makeStore();
    expect(await store.init()).toBe('ready');
    expect(counter.saves).toBe(1);
    expect(store.getSnapshot().save!.player.gold).toBe(5000);

    const again = makeStore().store;
    await again.init();
    expect(again.getSnapshot().save).toEqual(store.getSnapshot().save);
    expect(again.getSnapshot().loadSource).toBe('primary');
  });

  it('dispatch persists, notifies subscribers and emits events; reload keeps the pig', async () => {
    const { store } = makeStore();
    await store.init();
    const seen: GameEvent[][] = [];
    let notified = 0;
    store.onEvents((e) => seen.push(e));
    store.subscribe(() => notified++);
    clock.advance(5 * SEC);
    const r = await store.dispatch(buy);
    expect(r.ok).toBe(true);
    expect(notified).toBeGreaterThan(0);
    expect(seen.flat()).toContainEqual(expect.objectContaining({ type: 'DISCOVERY' }));

    const reloaded = makeStore().store;
    await reloaded.init();
    expect(reloaded.getSnapshot().save!.pigs).toHaveLength(1);
  });

  it('a failed action does not persist or change state', async () => {
    const { store, counter } = makeStore();
    await store.init();
    const before = store.getSnapshot().save;
    const writes = counter.saves;
    const r = await store.dispatch((s, c) => sellPig(s, { pigId: 'nope' }, c));
    expect(r).toEqual({ ok: false, error: 'PIG_NOT_FOUND' });
    expect(counter.saves).toBe(writes);
    expect(store.getSnapshot().save).toBe(before);
  });

  it('one global interval; ticks advance time and persist on events', async () => {
    const { store, counter, timers } = makeStore();
    await store.init();
    await store.dispatch(buy);
    expect(timers.live()).toBe(1);
    const writes = counter.saves;
    clock.advance(2400 * SEC); // PINK hunger reaches 0 → PIG_HUNGRY_ZERO
    timers.fire();
    await store.flush();
    expect(store.getSnapshot().save!.pigs[0]!.hunger).toBe(0);
    expect(counter.saves).toBe(writes + 1);
    for (let i = 0; i < 10; i++) timers.fire();
    expect(timers.created()).toBe(1);
  });

  it('autosaves every 30 s even without events', async () => {
    const { store, counter, timers } = makeStore();
    await store.init();
    const writes = counter.saves;
    clock.advance(10 * SEC);
    timers.fire();
    expect(counter.saves).toBe(writes);
    clock.advance(SAVE.AUTOSAVE_MS);
    timers.fire();
    await store.flush();
    expect(counter.saves).toBe(writes + 1);
  });

  it('hidden stops the loop and persists; visible ticks and restarts it; pagehide persists', async () => {
    const { store, counter, timers, page } = makeStore();
    await store.init();
    await store.dispatch(buy);
    const writes = counter.saves;
    page.visible = false;
    page.emit('visibilitychange');
    await store.flush();
    expect(timers.live()).toBe(0);
    expect(counter.saves).toBe(writes + 1);

    clock.advance(1200 * SEC);
    page.visible = true;
    page.emit('visibilitychange'); // > 30 s since the last write → autosave
    await store.flush();
    expect(counter.saves).toBe(writes + 2);
    expect(timers.live()).toBe(1);
    expect(store.getSnapshot().save!.pigs[0]!.hunger).toBeCloseTo(50, 6);

    page.emit('pagehide');
    await store.flush();
    expect(counter.saves).toBe(writes + 3);
  });

  it('second tab goes read-only and never writes; the first keeps writing', async () => {
    const bus = channelBus();
    const a = makeStore({ channel: bus() });
    await a.store.init();
    const b = makeStore({ channel: bus(), rng: mulberry32(12) }); // distinct tab id
    await b.store.init();

    expect(a.store.getSnapshot().readOnly).toBe(false);
    expect(b.store.getSnapshot().readOnly).toBe(true);
    expect(b.counter.saves).toBe(0);
    expect(await b.store.dispatch(buy)).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    clock.advance(SAVE.AUTOSAVE_MS * 2);
    b.timers.fire();
    await b.store.flush();
    expect(b.counter.saves).toBe(0);
    expect((await a.store.dispatch(buy)).ok).toBe(true);
  });

  it('corrupt save → recovery, nothing written until "start new"', async () => {
    local.setItem(SAVE.MIRROR_KEY, '{broken');
    const { store, counter } = makeStore();
    expect(await store.init()).toBe('recovery');
    expect(counter.saves).toBe(0);
    expect(local.getItem(SAVE.MIRROR_KEY)).toBe('{broken');
    await store.startNewGame();
    expect(store.getSnapshot().status).toBe('ready');
    expect(counter.saves).toBe(1);
  });

  it('too-new save → refuses actions and never overwrites', async () => {
    const future = JSON.stringify({ schemaVersion: SAVE.SCHEMA_VERSION + 1 });
    local.setItem(SAVE.MIRROR_KEY, future);
    const { store, counter } = makeStore();
    expect(await store.init()).toBe('tooNew');
    expect(await store.dispatch(buy)).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    await store.startNewGame();
    expect(counter.saves).toBe(0);
    expect(local.getItem(SAVE.MIRROR_KEY)).toBe(future);
  });

  it('import: invalid leaves the save untouched; valid replaces it and backs up the old one', async () => {
    const { store } = makeStore();
    await store.init();
    await store.dispatch(buy);
    const current = store.getSnapshot().save!;
    expect((await store.importSave('{bad')).ok).toBe(false);
    expect(store.getSnapshot().save).toBe(current);

    const other = { ...current, pigs: [], player: { ...current.player, gold: 42 } };
    expect((await store.importSave(JSON.stringify(other))).ok).toBe(true);
    expect(store.getSnapshot().save!.player.gold).toBe(42);
    expect(local.getItem(SAVE.BACKUP_KEY)).toBe(JSON.stringify(current));
  });
});
