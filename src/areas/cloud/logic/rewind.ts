// Admin time travel (⏩ Tua thời gian) for the Cloud: the slice looks as if the player left `ms` ago. Every moment in it
// moves back — what grew stays grown, the clocks move — so the next catch-up grows the flowers, fills the spring and runs
// the cauldron for that long. Pure.
import type { WorldSave } from '../../../core/save/world';
import { cloudOf, hasCloud, withCloud } from './save/lens';
import type { CloudState } from './state';

export function rewindCloud(g: CloudState, ms: number): CloudState {
  const back = (t: number) => t - ms;
  return {
    ...g,
    plots: g.plots.map((p) => ({ ...p, wetUntil: p.wetUntil > 0 ? back(p.wetUntil) : 0, ripeAt: p.ripeAt === null ? null : back(p.ripeAt) })),
    spring: { ...g.spring, since: back(g.spring.since) },
    cauldron: { ...g.cauldron, job: g.cauldron.job && { ...g.cauldron.job, startedAt: back(g.cauldron.job.startedAt) } },
    lastTickedAt: back(g.lastTickedAt),
  };
}

/** `world` with the cloud (when it is open) moved back like the rest of the save. */
export const rewindCloudInWorld = (world: WorldSave, ms: number): WorldSave =>
  ms > 0 && hasCloud(world) ? withCloud(world, rewindCloud(cloudOf(world), ms)) : world;
