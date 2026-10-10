// The Garden's lines for the "while you were away" screen (AreaModule.getSummary, spec §5): what happened
// (counted from the catch-up's events) and what needs the player now (read from the Garden). Pure.
import type { SummaryLine } from '../../../core/area-registry/registry';
import { RECIPES } from '../../../core/config/recipes';
import { batchesReady } from '../../../core/production/production';
import type { EventBase } from '../../../core/events';
import { BUILDING_IDS } from './config/content';
import { plotViews } from './derived';
import { isGardenEvent, type GardenEvent } from './events';
import type { GardenState } from './state';

/** Where a line's button leads: the garden itself. */
export const GARDEN_GOTO = { target: 'garden' } as const;

const sum = (events: readonly GardenEvent[], type: GardenEvent['type'], pick: (e: GardenEvent) => number): number =>
  events.filter((e) => e.type === type).reduce((n, e) => n + pick(e), 0);

export function gardenSummaryLines(all: readonly EventBase[], garden: GardenState, now: number): SummaryLine[] {
  const events = all.filter(isGardenEvent);
  const views = plotViews(garden, now);
  const waiting = views.filter((v) => v.stage === 'ripe' || v.stage === 'wilted').length;
  const wilted = views.filter((v) => v.stage === 'wilted').length;
  const dry = garden.plots.filter((p, i) => views[i]!.stage === 'growing' && !views[i]!.watered && p.ripeAt === null).length;
  const finished = BUILDING_IDS.reduce((n, b) => {
    const job = garden.jobs[b];
    const recipe = job ? RECIPES[job.recipeId] : undefined;
    return n + (job && recipe ? batchesReady(job, recipe, now) : 0);
  }, 0);

  const needs: SummaryLine[] = [];
  if (wilted > 0) needs.push({ key: 'summary.garden.needHarvestWilted', params: { count: waiting, wilted }, tone: 'warn', goto: GARDEN_GOTO });
  else if (waiting > 0) needs.push({ key: 'summary.garden.needHarvest', params: { count: waiting }, goto: GARDEN_GOTO });
  if (finished > 0) needs.push({ key: 'summary.garden.needCollect', params: { count: finished }, goto: GARDEN_GOTO });
  if (dry > 0) needs.push({ key: 'summary.garden.needWater', params: { count: dry }, tone: 'warn', goto: GARDEN_GOTO });

  const counted: SummaryLine[] = [];
  const ripe = sum(events, 'GARDEN_CROP_RIPE', (e) => (e.type === 'GARDEN_CROP_RIPE' ? e.count : 0));
  const withered = sum(events, 'GARDEN_CROP_WILTED', (e) => (e.type === 'GARDEN_CROP_WILTED' ? e.count : 0));
  const batches = sum(events, 'GARDEN_BATCH_DONE', (e) => (e.type === 'GARDEN_BATCH_DONE' ? e.batches : 0));
  if (ripe > 0) counted.push({ key: 'summary.garden.ripe', params: { count: ripe } });
  if (withered > 0) counted.push({ key: 'summary.garden.wilted', params: { count: withered } });
  if (batches > 0) counted.push({ key: 'summary.garden.batches', params: { count: batches } });
  return [...needs, ...counted];
}
