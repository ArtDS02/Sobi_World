// What the Garden suggests the player do now (AreaModule.suggest): crops to harvest, finished batches, dry plots,
// empty plots, the first workshop. Pure.
import type { Suggestion } from '../../../core/area-registry/registry';
import { RECIPES } from '../../../core/config/recipes';
import { batchesReady } from '../../../core/production/production';
import { BUILDING_IDS } from './config/content';
import { plotViews } from './derived';
import type { GardenState } from './state';

const GO = { target: 'garden' } as const;

export function gardenSuggestions(garden: GardenState, now: number): Suggestion[] {
  const views = plotViews(garden, now);
  const out: Suggestion[] = [];
  const ripe = views.filter((v) => v.stage === 'ripe' || v.stage === 'wilted').length;
  if (ripe > 0) out.push({ key: 'suggest.garden.harvest', params: { count: ripe }, priority: 65, goto: GO });
  const finished = BUILDING_IDS.reduce((n, b) => {
    const job = garden.jobs[b];
    const recipe = job ? RECIPES[job.recipeId] : undefined;
    return n + (job && recipe ? batchesReady(job, recipe, now) : 0);
  }, 0);
  if (finished > 0) out.push({ key: 'suggest.garden.collect', params: { count: finished }, priority: 62, goto: GO });
  const dry = views.filter((v, i) => v.stage === 'growing' && !v.watered && garden.plots[i]!.ripeAt === null).length;
  if (dry > 0) out.push({ key: 'suggest.garden.water', params: { count: dry }, priority: 35, goto: GO });
  const empty = views.filter((v) => v.stage === 'empty').length;
  if (empty > 0) out.push({ key: 'suggest.garden.plant', params: { count: empty }, priority: 25, goto: GO });
  if (!garden.built.mill) out.push({ key: 'suggest.garden.buildMill', priority: 20, goto: GO });
  return out;
}
