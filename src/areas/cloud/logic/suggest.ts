// What the Cloud suggests the player do now (AreaModule.suggest): flowers to pick, a finished brew, dry plots, water in
// the spring, empty plots, the cauldron. Pure.
import type { Suggestion } from '../../../core/area-registry/registry';
import { cauldronReady, plotViews, springStock } from './derived';
import type { CloudState } from './state';

const GO = { target: 'cloud' } as const;

export function cloudSuggestions(cloud: CloudState, now: number, dayOffsetMs: number): Suggestion[] {
  const views = plotViews(cloud, now, dayOffsetMs);
  const out: Suggestion[] = [];
  const ripe = views.filter((v) => v.stage === 'ripe' || v.stage === 'wilted').length;
  if (ripe > 0) out.push({ key: 'suggest.cloud.pick', params: { count: ripe }, priority: 65, goto: GO });
  const finished = cauldronReady(cloud, now);
  if (finished > 0) out.push({ key: 'suggest.cloud.collect', params: { count: finished }, priority: 62, goto: GO });
  const dry = views.filter((v) => v.stage === 'growing' && !v.watered).length;
  if (dry > 0) out.push({ key: 'suggest.cloud.water', params: { count: dry }, priority: 35, goto: GO });
  const water = springStock(cloud, now);
  if (water >= 4) out.push({ key: 'suggest.cloud.spring', params: { count: water }, priority: 30, goto: GO });
  const empty = views.filter((v) => v.stage === 'empty').length;
  if (empty > 0) out.push({ key: 'suggest.cloud.plant', params: { count: empty }, priority: 25, goto: GO });
  if (!cloud.cauldron.built) out.push({ key: 'suggest.cloud.buildCauldron', priority: 20, goto: GO });
  return out;
}
