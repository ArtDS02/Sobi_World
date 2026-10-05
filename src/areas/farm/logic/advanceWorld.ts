// World catch-up (spec §7.4): trough → pigs → births → orders → gifts (U06), then diff into events,
// then achievement progress (PG-2).
import { NEED_NOTIFY_FROM } from '../../../core/config/care';
import type { GameEvent, PigNeed } from '../../../core/events';
import type { Rng } from '../../../core/rng';
import type { Pig, FarmGame } from './types';
import { resolveBirths } from './breeding';
import { resolveGifts } from './gifts';
import { refreshOrders } from './orders';
import { progressStep } from './progress';
import { needLevel, needRank } from './pigHealth';
import { advanceWithTrough } from './trough';

export interface WorldResult {
  state: FarmGame;
  events: GameEvent[];
}

/**
 * Idempotent for the same `now`; the caller persists when `events` is non-empty (§7.4 step 6).
 * `dayOffsetMs` (local time minus UTC) places game-day boundaries (NH-1).
 */
export function advanceWorld(state: FarmGame, now: number, rng: Rng, dayOffsetMs = 0): WorldResult {
  // Steps 1-2: resolveTrough then advancePig for every pig (DECISIONS S04A-1).
  const win = advanceWithTrough({ pigs: state.pigs, trough: state.trough }, now, rng, dayOffsetMs);
  let next: FarmGame = { ...state, pigs: win.pigs, trough: win.trough };
  const events: GameEvent[] = [];

  if (win.report.emptiedAt !== null)
    events.push({ type: 'TROUGH_EMPTY', at: win.report.emptiedAt });
  for (const [pigId, m] of Object.entries(win.report.meals)) {
    events.push({ type: 'PIG_ATE_FROM_TROUGH', pigId, ...m });
  }
  events.push(...diffPigs(state.pigs, win.pigs, win.report.hungerZeroAt));

  // Step 3: pregnancies (S10).
  const births = resolveBirths(next, now, rng);
  next = births.state;
  events.push(...births.events);

  // Step 4: orders (S11).
  const orders = refreshOrders(next, now);
  next = orders.state;
  events.push(...orders.events);

  // Step 5: gift boxes (U06).
  const gifts = resolveGifts(next, now);
  next = gifts.state;
  events.push(...gifts.events);

  // Step 6: achievement counters and newly reached achievements (PG-2).
  if (events.length === 0) return { state: next, events };
  const progress = progressStep(state, next, events);
  return { state: progress.state, events: [...events, ...progress.events] };
}

function diffPigs(
  before: readonly Pig[],
  after: readonly Pig[],
  hungerZeroAt: Record<string, number>,
): GameEvent[] {
  const prev = new Map(before.map((p) => [p.id, p]));
  const events: GameEvent[] = [];
  for (const pig of after) {
    const old = prev.get(pig.id);
    if (!old) continue;
    const zeroAt = hungerZeroAt[pig.id];
    if (zeroAt !== undefined) {
      events.push({
        type: 'PIG_HUNGRY_ZERO',
        pigId: pig.id,
        at: zeroAt,
        stalled: pig.growthProgress < 100,
      });
    }
    if (!old.isSick && pig.isSick) events.push({ type: 'PIG_BECAME_SICK', pigId: pig.id });
    events.push(...needDrops(old, pig));
    if (old.growthProgress < 100 && pig.growthProgress === 100) {
      events.push({ type: 'PIG_BECAME_ADULT', pigId: pig.id });
    }
  }
  return events;
}

const NEEDS: readonly [PigNeed, (p: Pig) => number][] = [
  ['hunger', (p) => p.hunger],
  ['clean', (p) => p.cleanliness],
];

/** NH-1: one event per drop into a worse level at or past NEED_NOTIFY_FROM, never per tick. */
function needDrops(old: Pig, pig: Pig): GameEvent[] {
  const from = needRank(NEED_NOTIFY_FROM);
  return NEEDS.flatMap(([need, value]) => {
    const before = needLevel(value(old));
    const after = needLevel(value(pig));
    const dropped = needRank(after) > needRank(before) && needRank(after) >= from;
    return dropped
      ? [{ type: 'PIG_NEED_DROPPED' as const, pigId: pig.id, need, level: after }]
      : [];
  });
}
