// Shared action pipeline (spec §8): advanceWorld first, then the action's validate + apply.
import { advanceWorld } from '../advanceWorld';
import { trackEvents } from '../progress';
import type { GameEvent } from '../events';
import type { ActionContext, ActionResult, FarmGame } from '../types';

/** Action body: runs on the caught-up state; must return an error without side effects. */
export type ActionBody = (state: FarmGame, ctx: ActionContext) => ActionResult;

export function runAction(state: FarmGame, ctx: ActionContext, body: ActionBody): ActionResult {
  const world = advanceWorld(state, ctx.now, ctx.rng, ctx.dayOffsetMs);
  const result = body(world.state, ctx);
  if (!result.ok) return result;
  return {
    ok: true,
    state: { ...trackEvents(result.state, result.events), updatedAt: ctx.now },
    events: [...world.events, ...result.events],
  };
}

/** Collects events from chained steps. */
export const ok = (state: FarmGame, ...events: GameEvent[][]): ActionResult => ({
  ok: true,
  state,
  events: events.flat(),
});
