// Game store (spec §4 data flow, §7.1, §9): owns the save, the clock, the rng and the one loop.
// dispatch: advanceWorld → action → persist → notify subscribers + emit events.
import type { Clock } from '../core/clock';
import { SAVE } from '../core/config/save';
import { advanceWorld } from '../core/engine/advanceWorld';
import type { GameEvent } from '../core/events';
import { randomId, type Rng } from '../core/rng';
import { importSave as parseImport } from '../core/save/exportImport';
import { newGame } from '../core/save/newGame';
import {
  createSaveStorage,
  requestPersistentStorage,
  type LoadSource,
  type SaveStorage,
} from '../core/save/storage';
import type { ActionContext, ActionResult, SaveGame } from '../core/types';
import { defaultRng, realClock } from './runtime';
import { createTabGuard, type ChannelLike } from './tabGuard';

export type StoreStatus = 'loading' | 'ready' | 'recovery' | 'tooNew';

export interface StoreSnapshot {
  status: StoreStatus;
  save: SaveGame | null;
  /** Another tab owns the save (§9.4): show vi.multiTab, refuse actions, never persist. */
  readOnly: boolean;
  loadSource: LoadSource | null;
}

/** An action bound to its arguments, e.g. `(s, c) => buyPig(s, args, c)`. */
export type BoundAction = (state: SaveGame, ctx: ActionContext) => ActionResult;

export interface PageLike {
  isVisible(): boolean;
  on(type: 'visibilitychange' | 'pagehide', listener: () => void): () => void;
}

export interface StoreDeps {
  storage: SaveStorage;
  clock: Clock;
  rng: Rng;
  /** The game's single repeating timer (§7.1). */
  every: (fn: () => void, ms: number) => unknown;
  cancel: (handle: unknown) => void;
  sleep: (ms: number) => Promise<void>;
  channel: ChannelLike | null;
  page: PageLike | null;
  requestPersist: () => Promise<boolean>;
}

function browserPage(): PageLike | null {
  if (typeof document === 'undefined') return null;
  return {
    isVisible: () => document.visibilityState === 'visible',
    on(type, listener) {
      const target = type === 'pagehide' ? window : document;
      target.addEventListener(type, listener);
      return () => target.removeEventListener(type, listener);
    },
  };
}

function browserChannel(): ChannelLike | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  const bc = new BroadcastChannel(SAVE.TAB_CHANNEL);
  const channel: ChannelLike = {
    onmessage: null,
    postMessage: (m) => bc.postMessage(m),
    close: () => bc.close(),
  };
  bc.onmessage = (e) => channel.onmessage?.({ data: e.data as unknown });
  return channel;
}

function defaultDeps(): StoreDeps {
  return {
    storage: createSaveStorage(),
    clock: realClock,
    rng: defaultRng,
    every: (fn, ms) => globalThis.setInterval(fn, ms),
    cancel: (h) => globalThis.clearInterval(h as number),
    sleep: (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms)),
    channel: browserChannel(),
    page: browserPage(),
    requestPersist: requestPersistentStorage,
  };
}

export function createGameStore(overrides: Partial<StoreDeps> = {}) {
  const deps: StoreDeps = { ...defaultDeps(), ...overrides };
  let snapshot: StoreSnapshot = {
    status: 'loading',
    save: null,
    readOnly: false,
    loadSource: null,
  };
  const subscribers = new Set<(s: StoreSnapshot) => void>();
  const eventListeners = new Set<(events: GameEvent[]) => void>();
  let interval: unknown = null;
  let lastPersistAt = 0;
  let persistQueue: Promise<void> = Promise.resolve();
  let persistRequested = false;
  const unlisten: (() => void)[] = [];

  const set = (patch: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    for (const fn of subscribers) fn(snapshot);
  };
  const emit = (events: GameEvent[]) => {
    if (events.length > 0) for (const fn of eventListeners) fn(events);
  };
  const ctx = (): ActionContext => ({ now: deps.clock.now(), rng: deps.rng });
  const guard = createTabGuard(deps.channel, randomId(deps.rng), deps.sleep, () =>
    set({ readOnly: true }),
  );
  const canWrite = () => snapshot.status === 'ready' && !guard.isReadOnly();

  /** Serialized writes; never runs for a read-only tab or a too-new save. */
  function persist(): Promise<void> {
    const save = snapshot.save;
    if (!save || !canWrite()) return persistQueue;
    lastPersistAt = deps.clock.now();
    persistQueue = persistQueue.then(() => deps.storage.save(save)).catch(() => undefined);
    return persistQueue;
  }

  /** Catch up time. Persists immediately when anything happened (§7.4 step 6). */
  function tick(): GameEvent[] {
    if (snapshot.status !== 'ready' || !snapshot.save) return [];
    const now = deps.clock.now();
    const world = advanceWorld(snapshot.save, now, deps.rng);
    set({ save: world.state });
    if (world.events.length > 0 || now - lastPersistAt >= SAVE.AUTOSAVE_MS) void persist();
    emit(world.events);
    return world.events;
  }

  const startLoop = () => {
    if (interval === null) interval = deps.every(tick, SAVE.TICK_MS);
  };
  const stopLoop = () => {
    if (interval !== null) deps.cancel(interval);
    interval = null;
  };

  function becomeReady(save: SaveGame, loadSource: LoadSource | null) {
    lastPersistAt = deps.clock.now();
    set({ status: 'ready', save, loadSource });
    tick(); // away catch-up; its events build the away summary (§9.5)
    if (!deps.page || deps.page.isVisible()) startLoop();
  }

  return {
    getSnapshot: () => snapshot,

    subscribe(fn: (s: StoreSnapshot) => void): () => void {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    onEvents(fn: (events: GameEvent[]) => void): () => void {
      eventListeners.add(fn);
      return () => eventListeners.delete(fn);
    },

    /** Load (or create) the save, claim the tab, start the global loop. */
    async init(): Promise<StoreStatus> {
      await guard.start();
      if (deps.page) {
        unlisten.push(
          deps.page.on('visibilitychange', () => {
            if (deps.page?.isVisible()) {
              tick();
              startLoop();
            } else {
              stopLoop();
              void persist();
            }
          }),
          deps.page.on('pagehide', () => void persist()),
        );
      }
      const loaded = await deps.storage.load();
      if (loaded.kind === 'tooNew') set({ status: 'tooNew', loadSource: loaded.source });
      else if (loaded.kind === 'recovery') set({ status: 'recovery' });
      else if (loaded.kind === 'ok') becomeReady(loaded.save, loaded.source);
      else {
        becomeReady(newGame(ctx()), null);
        await persist();
      }
      return snapshot.status;
    },

    tick,

    /** Runs an action; persists and notifies only on success. */
    async dispatch(action: BoundAction): Promise<ActionResult> {
      if (!snapshot.save || !canWrite()) return { ok: false, error: 'INVALID_REQUEST' };
      const result = action(snapshot.save, ctx());
      if (!result.ok) return result;
      set({ save: result.state });
      await persist();
      emit(result.events);
      if (!persistRequested) {
        persistRequested = true;
        void deps.requestPersist().catch(() => false);
      }
      return result;
    },

    /** Recovery screen "start new", after the player's explicit confirmation (§9.2). */
    async startNewGame(): Promise<void> {
      if (snapshot.status === 'tooNew' || guard.isReadOnly()) return;
      becomeReady(newGame(ctx()), null);
      await persist();
    },

    /** Import after confirmation; the previous save goes to the backup key. Invalid → untouched. */
    async importSave(json: string): Promise<ActionResult> {
      if (snapshot.status === 'tooNew' || guard.isReadOnly()) {
        return { ok: false, error: 'INVALID_REQUEST' };
      }
      const parsed = parseImport(json);
      if (!parsed.ok) return parsed;
      stopLoop();
      becomeReady(parsed.save, null);
      await persist();
      return { ok: true, state: parsed.save, events: [] };
    },

    /** Flushes pending writes. */
    flush: () => persistQueue,

    dispose() {
      stopLoop();
      for (const off of unlisten.splice(0)) off();
      guard.close();
      subscribers.clear();
      eventListeners.clear();
    },
  };
}

export type GameStore = ReturnType<typeof createGameStore>;
