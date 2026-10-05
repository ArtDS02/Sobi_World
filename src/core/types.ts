// Action contract shared by every Area (spec §8): actions are pure (state, args, ctx) -> result.
import type { ErrorCode } from './config/errors';
import type { GameEvent } from './events';
import type { Rng } from './rng';

export interface ActionContext {
  now: number;
  rng: Rng;
  /** Local time minus UTC (ms) for game-day rules (NH-1). Absent = 0 (UTC days). */
  dayOffsetMs?: number;
}

export type ActionResultOf<S> =
  | { ok: true; state: S; events: GameEvent[] }
  | { ok: false; error: ErrorCode };
