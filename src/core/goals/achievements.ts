// Achievements (spec V2 §9): long-term goals paid in Gems. A metric is a counter of progression.stats or a value
// of the world (its level, its Codex); a target of 'ALL' means every entry the world offers for that metric.
import type { achievementsFileSchema } from '../../../content/schemas/shared/achievements';
import type { z } from 'zod';
import { changeCurrency } from '../economy/ledger';
import type { WorldLevelUp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';

export type AchievementDef = z.infer<typeof achievementsFileSchema>['achievements'][number];

/** How many entries the world offers for the metrics that can be 'ALL' (the Areas and the Codex report them). */
export type Totals = Readonly<Record<string, number>>;

/** What a metric reads besides the stats. */
export interface AchievementWorld {
  stats: Readonly<Record<string, number>>;
  worldLevel: number;
  /** Codex entries discovered: all kinds, then per kind. */
  codex: { total: number; byKind: Readonly<Record<string, number>> };
}

export function metricValue(metric: string, w: AchievementWorld): number {
  switch (metric) {
    case 'worldLevel':
      return w.worldLevel;
    case 'codex':
      return w.codex.total;
    case 'codexBreed':
      return w.codex.byKind.breed ?? 0;
    case 'codexCrop':
      return w.codex.byKind.crop ?? 0;
    case 'codexItem':
      return w.codex.byKind.item ?? 0;
    default:
      return w.stats[metric] ?? 0;
  }
}

/** The number to reach; an 'ALL' whose total is unknown can never be reached (never "done" by accident). */
export const targetOf = (def: AchievementDef, totals: Totals): number =>
  def.target === 'ALL' ? Math.max(1, totals[def.metric] ?? Infinity) : def.target;

export const isReached = (def: AchievementDef, w: AchievementWorld, totals: Totals): boolean =>
  metricValue(def.metric, w) >= targetOf(def, totals);

/** Reached and not claimed yet. */
export const claimable = (
  defs: readonly AchievementDef[],
  claimed: Readonly<Record<string, number>>,
  w: AchievementWorld,
  totals: Totals,
): AchievementDef[] => defs.filter((d) => claimed[d.id] === undefined && isReached(d, w, totals));

export type AchievementEvent =
  | { type: 'ACHIEVEMENT_REACHED'; id: string }
  | { type: 'ACHIEVEMENT_CLAIMED'; id: string; gems: number; xp: number };

/** Pays a reached achievement once, in Gems (and XP through `addXp`). */
export function claimAchievement(
  world: WorldSave,
  args: { id: string },
  ctx: ActionContext,
  defs: readonly AchievementDef[],
  view: AchievementWorld,
  totals: Totals,
  addXp: (w: WorldSave, xp: number) => { state: WorldSave; events: WorldLevelUp[] },
): ActionResultOf<WorldSave, AchievementEvent | WorldLevelUp> {
  const def = defs.find((d) => d.id === args.id);
  if (!def) return { ok: false, error: 'INVALID_REQUEST' };
  if (world.progression.claimed[def.id] !== undefined) return { ok: false, error: 'ALREADY_CLAIMED' };
  if (!isReached(def, view, totals)) return { ok: false, error: 'ACHIEVEMENT_LOCKED' };
  const paid = changeCurrency(world, 'gems', def.gems, { type: 'ACHIEVEMENT', refId: def.id }, ctx);
  if (!paid.ok) return paid;
  const marked: WorldSave = { ...paid.state, progression: { ...world.progression, claimed: { ...world.progression.claimed, [def.id]: ctx.now } } };
  const xp = addXp(marked, def.xp);
  return { ok: true, state: xp.state, events: [{ type: 'ACHIEVEMENT_CLAIMED', id: def.id, gems: def.gems, xp: def.xp }, ...xp.events] };
}
