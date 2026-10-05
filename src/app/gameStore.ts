// The game store with its real browser dependencies (spec §4, §7.1). The store itself is world-level
// and pure (core/world/gameStore.ts); this file supplies the clock, rng, timers, page visibility and
// the world tick. Tests and main.ts override what they need.
import { advanceFarmWorld, farmSimulatedAt } from '../areas/farm/logic/world';
import { farmEventsToWorld } from '../areas/farm/logic/worldEvents';
import { createWorldStore, type PageLike, type StoreDeps } from '../core/world/gameStore';
import { defaultRng, realClock } from './runtime';
import { SAVE_CODEC } from './saveCodec';

export type {
  BoundAction,
  CatchupInfo,
  EventListener,
  EventOrigin,
  GameStore,
  PageLike,
  StoreDeps,
  StoreSnapshot,
  StoreStatus,
} from '../core/world/gameStore';

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
    advanceWorld: advanceFarmWorld,
    lastSimulatedAt: farmSimulatedAt,
    toWorldEvents: farmEventsToWorld,
    codec: SAVE_CODEC,
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

/** Storage and the instance guard come from the platform (main.ts); the store never picks one. */
export function createGameStore(
  overrides: Pick<StoreDeps, 'storage' | 'instanceGuard'> & Partial<StoreDeps>,
) {
  return createWorldStore({ ...defaultDeps(), ...overrides });
}
