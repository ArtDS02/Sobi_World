// Game store (spec §4 data flow, §7.1, §9): owns the save, the clock, the rng and the one loop.
// dispatch: advanceWorld → action → persist → notify subscribers + emit events.
import type { Clock } from '../core/clock';
import { SAVE } from '../core/config/save';
import { advanceWorld } from '../core/engine/advanceWorld';
import type { GameEvent } from '../core/events';
import type { Rng } from '../core/rng';
import { importSave as parseImport } from '../core/save/exportImport';
import { newGame } from '../core/save/newGame';
import type { InstanceGuard, LoadSource, SaveStorage } from '../core/save/port';
import type { ErrorCode } from '../core/config/errors';
import type { ActionContext, ActionResult, SaveGame } from '../core/types';
import { defaultRng, realClock } from './runtime';

export type StoreStatus = 'loading' | 'ready' | 'recovery' | 'tooNew';

/**
 * Where events came from (spec §11.3): a player action, a visible tick, or the catch-up tick
 * right after load / import / the window becoming visible again (never animated, §9.5).
 */
export type EventOrigin = 'action' | 'tick' | 'catchup';
export type EventListener = (events: GameEvent[], origin: EventOrigin) => void;

export interface StoreSnapshot {
  status: StoreStatus;
  save: SaveGame | null;
  /** Another tab owns the save (§9.4): show vi.multiTab, refuse actions, never persist. */
  readOnly: boolean;
  loadSource: LoadSource | null;
  /** The last write failed (§9.2): banner shown, retrying with backoff, memory state kept. */
  saveError: boolean;
}

/** An action bound to its arguments, e.g. `(s, c) => buyPig(s, args, c)`. */
export type BoundAction = (state: SaveGame, ctx: ActionContext) => ActionResult;

export interface PageLike {
  isVisible(): boolean;
  on(type: 'visibilitychange' | 'pagehide', listener: () => void): () => void;
}

export interface StoreDeps {
  storage: SaveStorage;
  instanceGuard: InstanceGuard;
  clock: Clock;
  rng: Rng;
  /** The game's single repeating timer (§7.1). */
  every: (fn: () => void, ms: number) => unknown;
  cancel: (handle: unknown) => void;
  sleep: (ms: number) => Promise<void>;
  page: PageLike | null;
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

type DefaultDeps = Omit<StoreDeps, 'storage' | 'instanceGuard'>;

function defaultDeps(): DefaultDeps {
  return {
    clock: realClock,
    rng: defaultRng,
    every: (fn, ms) => globalThis.setInterval(fn, ms),
    cancel: (h) => globalThis.clearInterval(h as number),
    sleep: (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms)),
    page: browserPage(),
  };
}

/** Storage and the instance guard come from the platform (main.ts); the store never picks one. */
export function createGameStore(
  overrides: Pick<StoreDeps, 'storage' | 'instanceGuard'> & Partial<StoreDeps>,
) {
  const deps: StoreDeps = { ...defaultDeps(), ...overrides };
  let snapshot: StoreSnapshot = {
    status: 'loading',
    save: null,
    readOnly: false,
    loadSource: null,
    saveError: false,
  };
  const subscribers = new Set<(s: StoreSnapshot) => void>();
  const eventListeners = new Set<EventListener>();
  const rejectListeners = new Set<(error: ErrorCode) => void>();
  let interval: unknown = null;
  let lastPersistAt = 0;
  let persistQueue: Promise<void> = Promise.resolve();
  let retryStep = 0;
  let retryScheduled = false;
  let disposed = false;
  const unlisten: (() => void)[] = [];

  const set = (patch: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    for (const fn of subscribers) fn(snapshot);
  };
  const emit = (events: GameEvent[], origin: EventOrigin) => {
    if (events.length > 0) for (const fn of eventListeners) fn(events, origin);
  };
  const reject = (result: Extract<ActionResult, { ok: false }>): ActionResult => {
    for (const fn of rejectListeners) fn(result.error);
    return result;
  };
  const ctx = (): ActionContext => ({ now: deps.clock.now(), rng: deps.rng });
  const guard = deps.instanceGuard;
  const canWrite = () => snapshot.status === 'ready' && !guard.isReadOnly();

  /** One write; a failure is surfaced as `saveError` and retried, never swallowed (§9.2). */
  async function write(save: SaveGame): Promise<void> {
    try {
      await deps.storage.save(save);
      retryStep = 0;
      if (snapshot.saveError) set({ saveError: false });
    } catch {
      if (!snapshot.saveError) set({ saveError: true });
      scheduleRetry();
    }
  }

  /** Backoff 1 s → 5 s → 30 s → every 30 s; a retry writes the latest state through the queue. */
  function scheduleRetry() {
    if (retryScheduled || disposed) return;
    retryScheduled = true;
    const delays = SAVE.SAVE_RETRY_MS;
    const delay = delays[Math.min(retryStep, delays.length - 1)]!;
    retryStep += 1;
    void deps.sleep(delay).then(() => {
      retryScheduled = false;
      if (snapshot.saveError && !disposed) void persist();
    });
  }

  /** Serialized writes; never runs for a read-only instance or a too-new save. */
  function persist(): Promise<void> {
    const save = snapshot.save;
    if (!save || !canWrite()) return persistQueue;
    lastPersistAt = deps.clock.now();
    persistQueue = persistQueue.then(() => write(save));
    return persistQueue;
  }

  /** Catch up time. Persists immediately when anything happened (§7.4 step 6). */
  function tick(origin: EventOrigin = 'tick'): GameEvent[] {
    if (snapshot.status !== 'ready' || !snapshot.save) return [];
    const now = deps.clock.now();
    const world = advanceWorld(snapshot.save, now, deps.rng);
    set({ save: world.state });
    if (world.events.length > 0 || now - lastPersistAt >= SAVE.AUTOSAVE_MS) void persist();
    emit(world.events, origin);
    return world.events;
  }

  const startLoop = () => {
    if (interval === null) interval = deps.every(() => tick('tick'), SAVE.TICK_MS);
  };
  const stopLoop = () => {
    if (interval !== null) deps.cancel(interval);
    interval = null;
  };

  function becomeReady(save: SaveGame, loadSource: LoadSource | null) {
    lastPersistAt = deps.clock.now();
    set({ status: 'ready', save, loadSource });
    tick('catchup'); // away catch-up; its events build the away summary (§9.5)
    if (!deps.page || deps.page.isVisible()) startLoop();
  }

  return {
    getSnapshot: () => snapshot,

    subscribe(fn: (s: StoreSnapshot) => void): () => void {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    onEvents(fn: EventListener): () => void {
      eventListeners.add(fn);
      return () => eventListeners.delete(fn);
    },

    /** Rejected actions and imports (`ok: false`): feedback is `ui_error` + a toast (§11.3). */
    onReject(fn: (error: ErrorCode) => void): () => void {
      rejectListeners.add(fn);
      return () => rejectListeners.delete(fn);
    },

    /** Load (or create) the save, claim the instance, start the global loop. */
    async init(): Promise<StoreStatus> {
      await guard.start(() => set({ readOnly: true }));
      if (deps.page) {
        unlisten.push(
          deps.page.on('visibilitychange', () => {
            if (deps.page?.isVisible()) {
              tick('catchup');
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

    tick: () => tick('tick'),

    /** Runs an action; persists and notifies only on success. */
    async dispatch(action: BoundAction): Promise<ActionResult> {
      if (!snapshot.save || !canWrite()) return reject({ ok: false, error: 'INVALID_REQUEST' });
      const result = action(snapshot.save, ctx());
      if (!result.ok) return reject(result);
      set({ save: result.state });
      await persist();
      emit(result.events, 'action');
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
        return reject({ ok: false, error: 'INVALID_REQUEST' });
      }
      const parsed = parseImport(json);
      if (!parsed.ok) return reject(parsed);
      stopLoop();
      becomeReady(parsed.save, null);
      await persist();
      return { ok: true, state: parsed.save, events: [] };
    },

    /** Flushes pending writes. */
    flush: () => persistQueue,

    /** Writes the current state now and waits for the queue (main's flush before quit, §9.1). */
    persistNow: () => persist(),

    /** Stamps settings.lastExportAt after a successful export (§9.3). Settings only: no event. */
    async markExported(at: number): Promise<void> {
      const save = snapshot.save;
      if (!save || !canWrite()) return;
      set({ save: { ...save, settings: { ...save.settings, lastExportAt: at } } });
      await persist();
    },

    dispose() {
      disposed = true;
      stopLoop();
      for (const off of unlisten.splice(0)) off();
      guard.close();
      subscribers.clear();
      eventListeners.clear();
      rejectListeners.clear();
    },
  };
}

export type GameStore = ReturnType<typeof createGameStore>;
