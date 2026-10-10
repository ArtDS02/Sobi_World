// The Cloud's numbers over time (ARCHITECTURE §5–6): closed form, the same call for every mode. Flowers grow, ripen
// and wilt; the cauldron finishes batches; the spring fills by itself (read from its `since`, nothing to step).
// Nothing here needs `rng` — time is the only input.
import type { WorldSave } from '../../../core/save/world';
import { RECIPES } from '../../../core/config/recipes';
import { batchesFinishedBetween } from '../../../core/production/production';
import { advancePlot } from '../../../systems/plants/plot';
import { FLOWERS, PLOT_RULES } from './config/content';
import type { CloudEvent } from './events';
import { cloudOf, withCloud } from './save/lens';
import type { CloudState } from './state';

const bump = (counts: Map<string, number>, key: string) => counts.set(key, (counts.get(key) ?? 0) + 1);

/** The slice caught up to `now` (never backwards), and what happened on the way. */
export function simulateCloud(g: CloudState, now: number): { state: CloudState; events: CloudEvent[] } {
  const from = g.lastTickedAt;
  if (now <= from) return { state: g, events: [] };
  const ripe = new Map<string, number>();
  const wilted = new Map<string, number>();
  const plots = g.plots.map((plot) => {
    const next = advancePlot(plot, plot.cropId ? FLOWERS[plot.cropId] : undefined, PLOT_RULES, false, from, now);
    if (plot.cropId && plot.ripeAt === null && next.ripeAt !== null) bump(ripe, plot.cropId);
    // A flower that was already ripe, or ripened on the way, may wilt in this stretch.
    if (plot.cropId && next.ripeAt !== null) {
      const wiltsAt = next.ripeAt + PLOT_RULES.witherAfterMs;
      if (wiltsAt > from && wiltsAt <= now) bump(wilted, plot.cropId);
    }
    return next;
  });
  const events: CloudEvent[] = [
    ...[...ripe].map(([flowerId, count]): CloudEvent => ({ type: 'CLOUD_FLOWER_RIPE', flowerId, count })),
    ...[...wilted].map(([flowerId, count]): CloudEvent => ({ type: 'CLOUD_FLOWER_WILTED', flowerId, count })),
  ];
  const job = g.cauldron.job;
  const recipe = job ? RECIPES[job.recipeId] : undefined;
  if (job && recipe) {
    const batches = batchesFinishedBetween(job, recipe, from, now);
    if (batches > 0) events.push({ type: 'CLOUD_BREW_DONE', recipeId: job.recipeId, batches });
  }
  return { state: { ...g, plots, lastTickedAt: now }, events };
}

export function advanceCloudWorld(world: WorldSave, now: number): { state: WorldSave; events: CloudEvent[] } {
  const r = simulateCloud(cloudOf(world), now);
  return { state: r.state === cloudOf(world) ? world : withCloud(world, r.state), events: r.events };
}
