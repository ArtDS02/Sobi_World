// Admin time travel (⏩ Tua thời gian) for the Aquarium: the slice looks as if the player left `ms` ago. Every moment in
// it moves back — fish keep what they have, the clocks move — so the next catch-up lives that time through. Pure.
import type { WorldSave } from '../../../core/save/world';
import { aquariumOf, hasAquarium, withAquarium } from './save/lens';
import type { AquariumState } from './state';

export function rewindAquarium(a: AquariumState, ms: number): AquariumState {
  const back = (t: number) => t - ms;
  return {
    ...a,
    fish: a.fish.map((f) => ({
      ...f,
      lastTickedAt: back(f.lastTickedAt),
      ...(f.lastSickAt === undefined ? {} : { lastSickAt: back(f.lastSickAt) }),
      ...(f.recoveringUntil === undefined ? {} : { recoveringUntil: back(f.recoveringUntil) }),
      ...(f.breedReadyAt === undefined ? {} : { breedReadyAt: back(f.breedReadyAt) }),
    })),
    eggs: a.eggs.map((e) => ({ ...e, startedAt: back(e.startedAt), hatchAt: back(e.hatchAt) })),
    lastCastAt: a.lastCastAt === null ? null : back(a.lastCastAt),
    lastTickedAt: back(a.lastTickedAt),
  };
}

/** `world` with the aquarium (when it is open) moved back like the rest of the save. */
export const rewindAquariumInWorld = (world: WorldSave, ms: number): WorldSave =>
  ms > 0 && hasAquarium(world) ? withAquarium(world, rewindAquarium(aquariumOf(world), ms)) : world;
