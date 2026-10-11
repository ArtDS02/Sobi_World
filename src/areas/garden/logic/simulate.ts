// The Garden's numbers over time (ARCHITECTURE §5–6): closed form, the same call for every mode. Plots grow,
// ripen and wilt; workshops finish batches. Nothing here needs `rng` — time is the only input.
import type { WorldSave } from '../../../core/save/world';
import { batchesFinishedBetween } from '../../../core/production/production';
import { RECIPES } from '../../../core/config/recipes';
import { advancePlot } from '../../../systems/plants/plot';
import { WEATHER_RULES } from '../../../core/config/weather';
import { cropWeather, daySegments, liveWeather, type WeatherId } from '../../../systems/weather/weather';
import { BUILDING_IDS, CROPS, PLOT_RULES } from './config/content';
import { isCovered } from './derived';
import type { GardenEvent } from './events';
import { gardenOf, withGarden } from './save/lens';
import type { GardenState } from './state';

const bump = (counts: Map<string, number>, key: string) => counts.set(key, (counts.get(key) ?? 0) + 1);

/**
 * The slice caught up to `now` (never backwards), and what happened on the way. The stretch is cut at every local midnight and
 * each part grows under that day's sky (rain waters and speeds up, GĐ12): a long jump gives what many short slices give.
 * `forcedWeather`: the Admin's switch.
 */
export function simulateGarden(g: GardenState, now: number, dayOffsetMs = 0, forcedWeather: string | null = null): { state: GardenState; events: GardenEvent[] } {
  const from = g.lastTickedAt;
  if (now <= from) return { state: g, events: [] };
  const ripe = new Map<string, number>();
  const wilted = new Map<string, number>();
  const sky = daySegments(from, now, dayOffsetMs).map((seg) => ({ seg, weather: cropWeather(liveWeather(seg.day, forcedWeather, WEATHER_RULES) as WeatherId, WEATHER_RULES) }));
  const plots = g.plots.map((plot, i) => {
    const crop = plot.cropId ? CROPS[plot.cropId] : undefined;
    const covered = isCovered(g, i);
    const next = sky.reduce((p, s) => advancePlot(p, crop, PLOT_RULES, covered, s.seg.from, s.seg.to, s.weather), plot);
    if (next === plot) return plot;
    if (plot.ripeAt === null && next.ripeAt !== null) bump(ripe, next.cropId!);
    if (next.ripeAt !== null) {
      const wiltsAt = next.ripeAt + PLOT_RULES.witherAfterMs;
      if (wiltsAt > from && wiltsAt <= now) bump(wilted, next.cropId!);
    }
    return next;
  });
  // A crop that was already ripe keeps its plot as it is, but may still wilt in this stretch.
  g.plots.forEach((plot) => {
    if (plot.cropId && plot.ripeAt !== null) {
      const wiltsAt = plot.ripeAt + PLOT_RULES.witherAfterMs;
      if (wiltsAt > from && wiltsAt <= now) bump(wilted, plot.cropId);
    }
  });
  const events: GardenEvent[] = [
    ...[...ripe].map(([cropId, count]): GardenEvent => ({ type: 'GARDEN_CROP_RIPE', cropId, count })),
    ...[...wilted].map(([cropId, count]): GardenEvent => ({ type: 'GARDEN_CROP_WILTED', cropId, count })),
  ];
  for (const building of BUILDING_IDS) {
    const job = g.jobs[building];
    const recipe = job ? RECIPES[job.recipeId] : undefined;
    if (!job || !recipe) continue;
    const batches = batchesFinishedBetween(job, recipe, from, now);
    if (batches > 0) events.push({ type: 'GARDEN_BATCH_DONE', building, recipeId: job.recipeId, batches });
  }
  return { state: { ...g, plots, lastTickedAt: now }, events };
}

export function advanceGardenWorld(world: WorldSave, now: number, dayOffsetMs = 0): { state: WorldSave; events: GardenEvent[] } {
  const r = simulateGarden(gardenOf(world), now, dayOffsetMs, world.live.dev.weather);
  return { state: r.state === gardenOf(world) ? world : withGarden(world, r.state), events: r.events };
}
