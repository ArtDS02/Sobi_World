// Public types of the world store (spec §4, §9, §11.3).
import type { EventBase } from '../events';
import type { LoadSource } from '../save/port';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';

export type StoreStatus = 'loading' | 'ready' | 'recovery' | 'tooNew';

/**
 * Where events came from (spec §11.3): a player action, a visible tick, or the catch-up tick
 * right after load / import / the window becoming visible again (never animated, §9.5).
 */
export type EventOrigin = 'action' | 'tick' | 'catchup';
/** Catch-up only: how long the world was not ticked (§9.5 away summary). */
export interface CatchupInfo {
  awayMs: number;
  /** The absence was longer than the offline cap: only its first part was caught up (GAME_BALANCE §1). */
  capped?: boolean;
}
export type EventListener = (events: EventBase[], origin: EventOrigin, catchup?: CatchupInfo) => void;

export interface StoreSnapshot {
  status: StoreStatus;
  save: WorldSave | null;
  /** Another tab owns the save (§9.4): show vi.multiTab, refuse actions, never persist. */
  readOnly: boolean;
  loadSource: LoadSource | null;
  /** The last write failed (§9.2): banner shown, retrying with backoff, memory state kept. */
  saveError: boolean;
  /** The device clock is set back past the last simulated time: time does not run backwards, nothing advances. */
  clockRewound: boolean;
}

/** An action bound to its arguments, e.g. `(s, c) => buyPig(s, args, c)`. */
export type BoundAction = (state: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;
