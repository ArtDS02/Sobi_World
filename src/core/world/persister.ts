// Coalescing save writer (B1): at most one write runs at a time; any number of persist() calls made while one is
// running collapse into ONE follow-up write of the newest state. A failed attempt is retried with backoff
// (1 s → 5 s → 30 s …), never swallowed: the caller's `attempt` reports the failure to the player.
export interface PersisterOptions {
  /** One write of the CURRENT state. Resolves true on success (or a deliberate skip), false on failure. */
  attempt: () => Promise<boolean>;
  sleep: (ms: number) => Promise<void>;
  retryMs: readonly number[];
  /** The store was disposed: no more retries. */
  isDead: () => boolean;
  /** A retry is only worth it while the failure is still showing. */
  wantsRetry: () => boolean;
}

export interface Persister {
  /** Resolves once the newest state at call time is written (or its write failed). */
  persist(): Promise<void>;
  /** Resolves when nothing is running or queued. */
  idle(): Promise<void>;
  /** Number of write attempts started (tests, diagnostics). */
  writes(): number;
}

export function createPersister(o: PersisterOptions): Persister {
  let running: Promise<void> | null = null;
  let dirty = false;
  let step = 0;
  let retryScheduled = false;
  let attempts = 0;

  /** Backoff 1 s → 5 s → 30 s → every 30 s; a retry writes the latest state. */
  function scheduleRetry() {
    if (retryScheduled || o.isDead()) return;
    retryScheduled = true;
    const delay = o.retryMs[Math.min(step, o.retryMs.length - 1)]!;
    step += 1;
    void o.sleep(delay).then(() => {
      retryScheduled = false;
      if (o.wantsRetry() && !o.isDead()) void persist();
    });
  }

  async function run() {
    do {
      dirty = false;
      attempts += 1;
      if (await o.attempt()) step = 0;
      else scheduleRetry();
    } while (dirty);
    running = null;
  }

  function persist(): Promise<void> {
    if (running) dirty = true;
    else running = run();
    return running;
  }

  return { persist, idle: () => running ?? Promise.resolve(), writes: () => attempts };
}
