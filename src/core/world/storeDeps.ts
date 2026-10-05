// Store dependencies (spec §4, §7.1): everything the store needs from the outside world. The real
// browser defaults live in src/app/gameStore.ts; tests override what they need.
import type { Clock } from '../clock';
import type { Rng } from '../rng';
import type { BackupStore, InstanceGuard, SaveStorage } from '../save/port';
import type { SaveCodec } from '../save/migrate';
import type { WorldSave } from '../save/world';
import type { ActionContext } from '../types';
import type { GameEvent } from '../events';

export interface PageLike {
  isVisible(): boolean;
  on(type: 'visibilitychange' | 'pagehide', listener: () => void): () => void;
}

/** Catches the world up to `now` (the farm's advanceWorld until the Area registry, GĐ1 step 6). */
export type WorldAdvance = (
  state: WorldSave,
  now: number,
  rng: Rng,
  dayOffsetMs: number,
) => { state: WorldSave; events: GameEvent[] };

export interface StoreDeps {
  advanceWorld: WorldAdvance;
  /** When the world was last simulated up to: the start of the away summary (§9.5). */
  lastSimulatedAt: (state: WorldSave) => number;
  /** New worlds, imports: this build's save format and Areas. */
  codec: SaveCodec;
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

/** Action context at `now` (default: the clock's time), with the local day offset (NH-1). */
export function actionContext(clock: Clock, rng: Rng, now = clock.now()): ActionContext {
  return { now, rng, dayOffsetMs: clock.dayOffsetMs?.(now) ?? 0 };
}
