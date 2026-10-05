// Shared action pipeline (spec §8): advanceWorld first, then the action's validate + apply.
import { advanceWorld } from '../advanceWorld';
import { progressStep } from '../progress';
import type { GameEvent } from '../../../../core/events';
import type { ActionContext, ActionResult, SaveGame } from '../../../../core/types';

/** Action body: runs on the caught-up state; must return an error without side effects. */
export type ActionBody = (state: SaveGame, ctx: ActionContext) => ActionResult;

export function runAction(state: SaveGame, ctx: ActionContext, body: ActionBody): ActionResult {
  const world = advanceWorld(state, ctx.now, ctx.rng, ctx.dayOffsetMs);
  const result = body(world.state, ctx);
  if (!result.ok) return result;
  const progress = progressStep(world.state, result.state, result.events);
  return {
    ok: true,
    state: { ...progress.state, updatedAt: ctx.now },
    events: [...world.events, ...result.events, ...progress.events],
  };
}

/** Collects events from chained steps. */
export const ok = (state: SaveGame, ...events: GameEvent[][]): ActionResult => ({
  ok: true,
  state,
  events: events.flat(),
});
