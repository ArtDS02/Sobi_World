// Achievement progress (spec §20.4, DECISIONS PG-2): counters fed by game events, metrics read from
// the save, and the "reached" diff. Rewards are claimed by the player (actions/claimAchievement).
import { ACHIEVEMENTS, type AchievementDef, type AchievementMetric } from '../config/achievements';
import { BREEDS, BREED_IDS } from '../config/breeds';
import { DECOR_IDS } from '../config/decor';
import type { StatId } from '../config/ids';
import { levelFromXp } from '../config/levels';
import type { GameEvent } from '../events';
import type { SaveGame } from '../types';

export const statOf = (state: Pick<SaveGame, 'progress'>, id: StatId): number =>
  state.progress.stats[id] ?? 0;

/** Stat deltas of one event (bestStreak is a maximum, handled apart). */
function deltas(e: GameEvent): Partial<Record<StatId, number>> {
  switch (e.type) {
    case 'PIG_BOUGHT':
      return { pigsBought: 1 };
    case 'PIG_SOLD':
      return { pigsSold: 1, goldEarned: e.gold };
    case 'BIRTH':
      return { births: 1 };
    case 'ORDER_FULFILLED':
      return { ordersFulfilled: 1, goldEarned: e.gold };
    case 'GIFT_OPENED':
      return { giftsOpened: 1, goldEarned: e.gold };
    case 'PIG_CLEANED':
      return { pigsCleaned: e.pigIds.length };
    case 'PIG_TREATED':
      return { pigsTreated: 1 };
    case 'BREEDING_STARTED':
      return { breedings: 1 };
    default:
      return {};
  }
}

/** Adds the events' counters to save.progress.stats; unchanged state when nothing counts. */
export function trackEvents(state: SaveGame, events: readonly GameEvent[]): SaveGame {
  let stats: SaveGame['progress']['stats'] | null = null;
  const bump = (id: StatId, value: number, max = false) => {
    stats ??= { ...state.progress.stats };
    const old = stats[id] ?? 0;
    stats[id] = max ? Math.max(old, value) : old + value;
  };
  for (const e of events) {
    for (const [id, n] of Object.entries(deltas(e)) as [StatId, number][]) bump(id, n);
    if (e.type === 'DAILY_CLAIMED') bump('bestStreak', e.streak, true);
  }
  return stats ? { ...state, progress: { ...state.progress, stats } } : state;
}

const playable = () => BREED_IDS.filter((id) => BREEDS[id].enabled);

export function metric(state: SaveGame, m: AchievementMetric): number {
  switch (m) {
    case 'discovered': {
      const found = new Set(state.collection.discoveredBreeds);
      return playable().filter((id) => found.has(id)).length;
    }
    case 'level':
      return levelFromXp(state.player.xp);
    case 'slots':
      return state.player.unlockedSlots;
    case 'decor':
      return state.decor.length;
    default:
      return statOf(state, m);
  }
}

export function targetOf(def: AchievementDef): number {
  if (def.target !== 'ALL') return def.target;
  return def.metric === 'decor' ? DECOR_IDS.length : playable().length;
}

export const isReached = (state: SaveGame, def: AchievementDef): boolean =>
  metric(state, def.metric) >= targetOf(def);

/** Reached, not yet claimed: what the achievements panel offers and the dock dot counts. */
export const claimable = (state: SaveGame): AchievementDef[] =>
  ACHIEVEMENTS.filter((d) => state.progress.claimed[d.id] === undefined && isReached(state, d));

/**
 * Tracks `events` on `after`, then emits ACHIEVEMENT_REACHED for each achievement reached in the
 * result but not in `before`. Pure and idempotent: the same transition never reports twice.
 */
export function progressStep(
  before: SaveGame,
  after: SaveGame,
  events: readonly GameEvent[],
): { state: SaveGame; events: GameEvent[] } {
  const state = trackEvents(after, events);
  const reached: GameEvent[] = ACHIEVEMENTS.filter(
    (d) =>
      state.progress.claimed[d.id] === undefined && isReached(state, d) && !isReached(before, d),
  ).map((d) => ({ type: 'ACHIEVEMENT_REACHED', id: d.id }));
  return { state, events: reached };
}
