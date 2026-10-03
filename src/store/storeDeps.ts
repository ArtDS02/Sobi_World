// Store dependencies (spec §4, §7.1): everything the store needs from the outside world, and the
// real browser defaults. Tests and main.ts override what they need.
import type { Clock } from '../core/clock';
import type { Rng } from '../core/rng';
import type { BackupStore, InstanceGuard, SaveStorage } from '../core/save/port';
import type { ActionContext } from '../core/types';
import { defaultRng, realClock } from './runtime';

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
  /** Desktop backups to restore from (settings, recovery screen); null in the browser build. */
  backups: BackupStore | null;
  /** OS "reduce motion" preference; seeds settings.reduceMotion of a new game (spec §11.3). */
  prefersReducedMotion: () => boolean;
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

export function defaultDeps(): DefaultDeps {
  return {
    clock: realClock,
    rng: defaultRng,
    every: (fn, ms) => globalThis.setInterval(fn, ms),
    cancel: (h) => globalThis.clearInterval(h as number),
    sleep: (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms)),
    page: browserPage(),
    backups: null,
    prefersReducedMotion: () =>
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

/** Action context at `now` (default: the clock's time), with the local day offset (NH-1). */
export function actionContext(clock: Clock, rng: Rng, now = clock.now()): ActionContext {
  return { now, rng, dayOffsetMs: clock.dayOffsetMs?.(now) ?? 0 };
}
