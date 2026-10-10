// Admin time travel (⏩ Tua thời gian) for the Garden: the slice looks as if the player left `ms` ago. Every
// moment in it moves back — what grew stays grown, the clocks move — so the next catch-up grows the crops and
// runs the workshops for that long. Pure.
import type { WorldSave } from '../../../core/save/world';
import { hasGarden, gardenOf, withGarden } from './save/lens';
import type { GardenState } from './state';

export function rewindGarden(g: GardenState, ms: number): GardenState {
  const back = (t: number) => t - ms;
  return {
    ...g,
    plots: g.plots.map((p) => ({ ...p, wetUntil: p.wetUntil > 0 ? back(p.wetUntil) : 0, ripeAt: p.ripeAt === null ? null : back(p.ripeAt) })),
    jobs: {
      mill: g.jobs.mill && { ...g.jobs.mill, startedAt: back(g.jobs.mill.startedAt) },
      composter: g.jobs.composter && { ...g.jobs.composter, startedAt: back(g.jobs.composter.startedAt) },
    },
    lastTickedAt: back(g.lastTickedAt),
  };
}

/** `world` with the garden (when it is open) moved back like the rest of the save. */
export const rewindGardenInWorld = (world: WorldSave, ms: number): WorldSave =>
  ms > 0 && hasGarden(world) ? withGarden(world, rewindGarden(gardenOf(world), ms)) : world;
