// Action contract shared by every Area (spec §8): actions are pure (state, args, ctx) -> result.
import type { ErrorCode } from './config/errors';
import type { EventBase } from './events';
import type { Rng } from './rng';

export interface ActionContext {
  now: number;
  rng: Rng;
  /** Local time minus UTC (ms) for game-day rules (NH-1). Absent = 0 (UTC days). */
  dayOffsetMs?: number;
}

/** `E`: the events the acting Area speaks (its own detailed events; the store only carries them). */
export type ActionResultOf<S, E extends EventBase = EventBase> =
  | { ok: true; state: S; events: E[] }
  | { ok: false; error: ErrorCode };
