// Admin time travel (⏩ Tua thời gian) for the Adventure: the slice looks as if the player left `ms` ago, so the energy has
// refilled and an exhaustion has worn off by now. Pure.
import type { WorldSave } from '../../../core/save/world';
import { adventureOf, hasAdventure, withAdventure } from './save/lens';
import type { AdventureState } from './state';

export function rewindAdventure(a: AdventureState, ms: number): AdventureState {
  const back = (t: number) => t - ms;
  return {
    ...a,
    fighters: Object.fromEntries(
      Object.entries(a.fighters).map(([key, f]) => [key, { ...f, energyAt: back(f.energyAt), exhaustedUntil: f.exhaustedUntil === null ? null : back(f.exhaustedUntil) }]),
    ),
    run: a.run && { ...a.run, startedAt: back(a.run.startedAt) },
    lastTickedAt: back(a.lastTickedAt),
  };
}

/** `world` with the adventure (when it is open) moved back like the rest of the save. */
export const rewindAdventureInWorld = (world: WorldSave, ms: number): WorldSave =>
  ms > 0 && hasAdventure(world) ? withAdventure(world, rewindAdventure(adventureOf(world), ms)) : world;
