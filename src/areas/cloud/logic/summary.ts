// The Cloud's lines for the "while you were away" screen (AreaModule.getSummary, spec §5): what happened (counted from the
// catch-up's events) and what needs the player now (read from the Cloud). Pure.
import type { SummaryLine } from '../../../core/area-registry/registry';
import type { EventBase } from '../../../core/events';
import { cauldronReady, plotViews, springStock } from './derived';
import { isCloudEvent, type CloudEvent } from './events';
import type { CloudState } from './state';
import { springLevel } from './config/content';

/** Where a line's button leads: the cloud garden itself. */
export const CLOUD_GOTO = { target: 'cloud' } as const;

const sum = (events: readonly CloudEvent[], pick: (e: CloudEvent) => number): number => events.reduce((n, e) => n + pick(e), 0);

export function cloudSummaryLines(all: readonly EventBase[], cloud: CloudState, now: number): SummaryLine[] {
  const events = all.filter(isCloudEvent);
  const views = plotViews(cloud, now);
  const waiting = views.filter((v) => v.stage === 'ripe' || v.stage === 'wilted').length;
  const wilted = views.filter((v) => v.stage === 'wilted').length;
  const dry = views.filter((v) => v.stage === 'growing' && !v.watered).length;
  const finished = cauldronReady(cloud, now);
  const water = springStock(cloud, now);

  const needs: SummaryLine[] = [];
  if (wilted > 0) needs.push({ key: 'summary.cloud.needPickWilted', params: { count: waiting, wilted }, tone: 'warn', goto: CLOUD_GOTO });
  else if (waiting > 0) needs.push({ key: 'summary.cloud.needPick', params: { count: waiting }, goto: CLOUD_GOTO });
  if (finished > 0) needs.push({ key: 'summary.cloud.needCollect', params: { count: finished }, goto: CLOUD_GOTO });
  if (dry > 0) needs.push({ key: 'summary.cloud.needWater', params: { count: dry }, tone: 'warn', goto: CLOUD_GOTO });
  if (water >= springLevel(cloud.spring.level).capacity) needs.push({ key: 'summary.cloud.springFull', params: { count: water }, goto: CLOUD_GOTO });

  const counted: SummaryLine[] = [];
  const ripe = sum(events, (e) => (e.type === 'CLOUD_FLOWER_RIPE' ? e.count : 0));
  const withered = sum(events, (e) => (e.type === 'CLOUD_FLOWER_WILTED' ? e.count : 0));
  const batches = sum(events, (e) => (e.type === 'CLOUD_BREW_DONE' ? e.batches : 0));
  if (ripe > 0) counted.push({ key: 'summary.cloud.ripe', params: { count: ripe } });
  if (withered > 0) counted.push({ key: 'summary.cloud.wilted', params: { count: withered } });
  if (batches > 0) counted.push({ key: 'summary.cloud.brewed', params: { count: batches } });
  return [...needs, ...counted];
}
