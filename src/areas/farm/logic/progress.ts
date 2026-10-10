// The farm's counters (progression.stats): game events in, numbers out. Achievements, daily goals and the Codex read
// them at world level (core/goals); each stat id has exactly one owner (content/schemas/vocab.ts STAT_ID_VALUES), and
// these ones are the farm's. Pure.
import { BOND } from '../../../core/config/bond';
import { heartsOf } from '../../../systems/bond/bond';
import type { StatId } from './config/ids';
import type { GameEvent } from './events';
import type { FarmGame } from './types';

export const statOf = (state: Pick<FarmGame, 'progress'>, id: StatId): number =>
  state.progress.stats[id] ?? 0;

/** Stat deltas of one event (bestStreak, slotsOwned and maxHearts are maxima, handled apart). */
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
    case 'PIG_PETTED':
      return { pigsPetted: 1 };
    case 'PIG_FED':
      return { feeds: 1 };
    case 'MANURE_CLEANED':
      return { manureCollected: e.kept };
    case 'DECOR_BOUGHT':
      return { decorOwned: 1 };
    default:
      return {};
  }
}

/**
 * Adds the events' counters to progress.stats; the unchanged state when nothing counts. `maxHearts` is the most
 * hearts any pig has right now or had before (a bond never falls).
 */
export function trackEvents(state: FarmGame, events: readonly GameEvent[]): FarmGame {
  let stats: FarmGame['progress']['stats'] | null = null;
  const bump = (id: StatId, value: number, max = false) => {
    stats ??= { ...state.progress.stats };
    const old = stats[id] ?? 0;
    stats[id] = max ? Math.max(old, value) : old + value;
  };
  let bonded = false;
  for (const e of events) {
    for (const [id, n] of Object.entries(deltas(e)) as [StatId, number][]) bump(id, n);
    if (e.type === 'SLOT_BOUGHT') bump('slotsOwned', e.slots, true);
    if (e.type === 'PIG_PETTED' || e.type === 'PIG_FED' || e.type === 'PIG_TREATED') bonded = true;
  }
  if (bonded) bump('maxHearts', Math.max(0, ...state.pigs.map((p) => heartsOf(p.bond, BOND))), true);
  return stats ? { ...state, progress: { ...state.progress, stats } } : state;
}
