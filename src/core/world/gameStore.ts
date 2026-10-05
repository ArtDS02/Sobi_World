// Game store (spec §4 data flow, §7.1, §9): owns the save, the clock, the rng and the one loop.
// dispatch: deps.advanceWorld → action → persist → notify subscribers + emit events.
import { SAVE } from '../config/save';
import { createEventBus, type EventBase } from '../events';
import { importSave as parseImport } from '../save/exportImport';
import { WORLD_SAVE_VERSION, type WorldSave } from '../save/world';
import { isSaveChangedExternally, type LoadSource } from '../save/port';
import type { ErrorCode } from '../config/errors';
import type { ActionContext, ActionResultOf } from '../types';
import { actionContext, type StoreDeps } from './storeDeps';
import type { BoundAction, CatchupInfo, EventListener, EventOrigin, StoreSnapshot, StoreStatus } from './storeTypes';

type ActionResult = ActionResultOf<WorldSave>;

export type { BoundAction, CatchupInfo, EventListener, EventOrigin, StoreSnapshot, StoreStatus } from './storeTypes';
export type { PageLike, StoreDeps, WorldAdvance } from './storeDeps';

/** Every dependency is injected (app/gameStore.ts fills the browser defaults). */
export function createWorldStore(deps: StoreDeps) {
  let snapshot: StoreSnapshot = {
    status: 'loading',
    save: null,
    readOnly: false,
    loadSource: null,
    saveError: false,
  };
  const subscribers = new Set<(s: StoreSnapshot) => void>();
  const listen = <F>(set: Set<F>, fn: F) => (set.add(fn), () => void set.delete(fn));
  const eventListeners = new Set<EventListener>();
  /** Standard world events for other Areas and world systems (ARCHITECTURE §7). */
  const bus = createEventBus();
  const rejectListeners = new Set<(error: ErrorCode) => void>();
  let interval: unknown = null;
  let lastPersistAt = 0;
  let persistQueue: Promise<void> = Promise.resolve();
  let retryStep = 0;
  let retryScheduled = false;
  let disposed = false;
  let reloading = false; // AM-1: adopting a save another program wrote; nothing is persisted
  let migratedFrom: number | null = null; // the loaded save was migrated: back it up before the first write
  const unlisten: (() => void)[] = [];

  const set = (patch: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    for (const fn of subscribers) fn(snapshot);
  };
  const emit = (events: EventBase[], origin: EventOrigin, catchup?: CatchupInfo) => {
    // A long catch-up is announced even when nothing happened (away summary, §9.5).
    const away = catchup && catchup.awayMs >= SAVE.AWAY_SUMMARY_MIN_MS;
    if (events.length === 0 && !away) return;
    for (const fn of eventListeners) fn(events, origin, catchup);
    bus.emit(deps.toWorldEvents(events));
  };
  const reject = (result: Extract<ActionResult, { ok: false }>): ActionResult => {
    for (const fn of rejectListeners) fn(result.error);
    return result;
  };
  const ctx = (now?: number): ActionContext => actionContext(deps.clock, deps.rng, now);
  const guard = deps.instanceGuard;
  const canWrite = () => snapshot.status === 'ready' && !guard.isReadOnly() && !reloading;

  /** One write; a failure is surfaced as `saveError` and retried, never swallowed (§9.2). */
  async function write(save: WorldSave): Promise<void> {
    if (reloading) return; // queued before the reload: stale, the file now holds the newer save
    try {
      // ARCHITECTURE §9: the old file is copied away before a migrated save first replaces it. A
      // failed copy fails the write (retried): the migrated farm is never written without it.
      if (migratedFrom !== null && deps.backups) await deps.backups.backupBeforeMigration(migratedFrom);
      migratedFrom = null;
      await deps.storage.save({ ...save, meta: { ...save.meta, lastSavedAt: deps.clock.now() } });
      retryStep = 0;
      if (snapshot.saveError) set({ saveError: false });
    } catch (e) {
      if (isSaveChangedExternally(e)) return void reloadExternal();
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
  function tick(origin: EventOrigin = 'tick'): EventBase[] {
    if (snapshot.status !== 'ready' || !snapshot.save) return [];
    const now = deps.clock.now();
    const awayMs = Math.max(0, now - deps.lastSimulatedAt(snapshot.save));
    const world = deps.advanceWorld(snapshot.save, now, deps.rng, ctx(now).dayOffsetMs ?? 0);
    set({ save: world.state });
    if (world.events.length > 0 || now - lastPersistAt >= SAVE.AUTOSAVE_MS) void persist();
    emit(world.events, origin, origin === 'catchup' ? { awayMs } : undefined);
    return world.events;
  }

  const startLoop = () => {
    if (interval === null) interval = deps.every(() => tick('tick'), SAVE.TICK_MS);
  };
  const stopLoop = () => {
    if (interval !== null) deps.cancel(interval);
    interval = null;
  };

  /** Read chain → ready / recovery / tooNew, or a new game on first launch. */
  async function load() {
    migratedFrom = null;
    const loaded = await deps.storage.load();
    if (loaded.kind === 'tooNew') set({ status: 'tooNew', loadSource: loaded.source });
    else if (loaded.kind === 'recovery') set({ status: 'recovery', save: null });
    else if (loaded.kind === 'ok') {
      migratedFrom = loaded.fromVersion < WORLD_SAVE_VERSION ? loaded.fromVersion : null;
      becomeReady(loaded.save, loaded.source);
    }
    else {
      becomeReady(fresh(), null);
      await persist();
    }
  }

  /** AM-1: another program (admin dashboard) replaced the save: adopt it, never overwrite it. */
  async function reloadExternal() {
    if (reloading || disposed || snapshot.status === 'tooNew' || guard.isReadOnly()) return;
    reloading = true;
    stopLoop();
    await persistQueue; // queued writes see `reloading` and skip
    await load().finally(() => (reloading = false));
  }

  const fresh = () => deps.codec.newWorld(ctx(), { reduceMotion: deps.prefersReducedMotion() });

  function becomeReady(save: WorldSave, loadSource: LoadSource | null) {
    lastPersistAt = deps.clock.now();
    set({ status: 'ready', save, loadSource });
    tick('catchup'); // away catch-up; its events build the away summary (§9.5)
    if (!deps.page || deps.page.isVisible()) startLoop();
  }

  return {
    getSnapshot: () => snapshot,

    subscribe: (fn: (s: StoreSnapshot) => void): (() => void) => listen(subscribers, fn),

    onEvents: (fn: EventListener): (() => void) => listen(eventListeners, fn),

    /** Standard world events (`item.added`, `creature.sold`…) of every Area, or '*'. */
    onWorldEvent: bus.on,

    /** Rejected actions and imports (`ok: false`): feedback is `ui_error` + a toast (§11.3). */
    onReject: (fn: (error: ErrorCode) => void): (() => void) => listen(rejectListeners, fn),

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
      deps.storage.onExternalChange?.(() => void reloadExternal());
      await load();
      return snapshot.status;
    },

    /**
     * Settings / recovery: puts a backup back and reloads it (§9.2). Pending writes finish
     * first; the platform keeps the current save as a backup. False (with a rejection) on failure.
     */
    async restoreBackup(name: string): Promise<boolean> {
      if (!deps.backups || snapshot.status === 'tooNew' || guard.isReadOnly()) {
        reject({ ok: false, error: 'INVALID_REQUEST' });
        return false;
      }
      stopLoop();
      await persistQueue;
      try {
        await deps.backups.restore(name);
      } catch {
        if (snapshot.status === 'ready') startLoop();
        reject({ ok: false, error: 'SAVE_CORRUPT' });
        return false;
      }
      await load();
      return snapshot.status === 'ready';
    },

    /** Backups the player can pick, newest first; empty where the platform keeps none. */
    listBackups: () => deps.backups?.list() ?? Promise.resolve([]),

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
      becomeReady(fresh(), null);
      await persist();
    },

    /** Settings "play again" (PG-4): the farm is written and backed up first; a failure aborts. */
    async resetGame(): Promise<boolean> {
      const kept =
        canWrite() &&
        (await persist()
          .then(() => deps.backups?.backupBeforeReset())
          .then(() => true, () => false));
      if (!kept) reject({ ok: false, error: 'INVALID_REQUEST' });
      else becomeReady(fresh(), null);
      await persist();
      return kept;
    },

    /** Import after confirmation; the previous save goes to the backup key. Invalid → untouched. */
    async importSave(json: string): Promise<ActionResult> {
      if (snapshot.status === 'tooNew' || guard.isReadOnly()) {
        return reject({ ok: false, error: 'INVALID_REQUEST' });
      }
      const parsed = parseImport(json, deps.codec);
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

export type GameStore = ReturnType<typeof createWorldStore>;
