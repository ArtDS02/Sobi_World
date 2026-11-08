// Resilient directory watcher (B4): fs.watch emits 'error' when the folder vanishes or the OS runs out of watch
// handles. An unhandled 'error' would crash the main process, so it is caught, logged, the watcher is closed and
// re-opened a limited number of times.
import type { FSWatcher } from 'node:fs';

export type WatchFactory = (dir: string, listener: (event: string, name: string | null) => void) => FSWatcher;

export interface ResilientWatchOptions {
  dir: string;
  watch: WatchFactory;
  onEvent: (name: string | null) => void;
  onError?: (where: string, e: unknown) => void;
  /** Re-open attempts after errors before giving up. */
  maxRestarts?: number;
  restartDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** Returns a stop function. */
export function watchResilient(o: ResilientWatchOptions): () => void {
  const maxRestarts = o.maxRestarts ?? 3;
  const delay = o.restartDelayMs ?? 1000;
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let stopped = false;
  let restarts = 0;
  let current: FSWatcher | null = null;

  /** Bounded retry shared by a watcher 'error' and a watch() that threw. */
  function retry() {
    if (restarts >= maxRestarts) return void o.onError?.('save-watch', new Error('giving up on the save watcher'));
    restarts += 1;
    void sleep(delay).then(open);
  }

  function open() {
    if (stopped) return;
    try {
      const w = o.watch(o.dir, (_event, name) => o.onEvent(name));
      current = w;
      w.on('error', (e) => {
        o.onError?.('save-watch', e);
        try {
          w.close();
        } catch {
          /* already closed */
        }
        if (current === w) current = null;
        retry();
      });
    } catch (e) {
      o.onError?.('save-watch', e); // watch() itself threw (folder missing)
      current = null;
      retry();
    }
  }
  open();
  return () => {
    stopped = true;
    current?.close();
  };
}
