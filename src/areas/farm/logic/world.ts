// The farm's rules on the world save: its catch-up (the Area's `simulate` hook) and any farm action
// lifted from the farm's working state (FarmGame) to the world (save/lens.ts).
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../core/types';
import type { Rng } from '../../../core/rng';
import { advanceWorld } from './advanceWorld';
import { farmArea, farmOf, withFarm } from './save/lens';
import type { ActionResult, FarmGame } from './types';

/** A farm action bound to its arguments, e.g. `(s, c) => buyPig(s, args, c)`. */
export type FarmAction = (state: FarmGame, ctx: ActionContext) => ActionResult;
export type WorldAction = (state: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;

export function liftFarmAction(action: FarmAction): WorldAction {
  return (world, ctx) => {
    const result = action(farmOf(world), ctx);
    return result.ok ? { ...result, state: withFarm(world, result.state) } : result;
  };
}

export function advanceFarmWorld(world: WorldSave, now: number, rng: Rng, dayOffsetMs: number) {
  const result = advanceWorld(farmOf(world), now, rng, dayOffsetMs);
  return { state: withFarm(world, result.state), events: result.events };
}

/** The trough is resolved on every farm tick: its stamp is when the farm last ran. */
export const farmSimulatedAt = (world: WorldSave): number => farmArea(world).trough.lastResolvedAt;
