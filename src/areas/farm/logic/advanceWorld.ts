// World catch-up (spec §7.4): trough → pigs → births → orders → gifts (U06), then diff into events,
// then the counters (PG-2).
import { NEED_NOTIFY_FROM } from './config/care';
import type { GameEvent, PigNeed } from './events';
import type { Rng } from '../../../core/rng';
import type { Pig, FarmGame } from './types';
import { resolveBirths } from './breeding';
import { resolveGifts } from './gifts';
import { refreshOrders } from './orders';
import { trackEvents } from './progress';
import { needLevel, needRank } from './pigHealth';
import { advanceWithTrough } from './trough';
import { penMood } from './decor';
import { criticalEvents, resolveMortality } from './mortality';
import type { SimMode } from '../../../core/simulation/simulate';
import { BALANCE } from './config/balance';

export interface WorldResult {
  state: FarmGame;
  events: GameEvent[];
}

/**
 * Idempotent for the same `now`; the caller persists when `events` is non-empty (§7.4 step 6).
 * `dayOffsetMs` (local time minus UTC) places game-day boundaries (NH-1).
 */
export function advanceWorld(state: FarmGame, now: number, rng: Rng, dayOffsetMs = 0, mode: SimMode = 'online'): WorldResult {
  // Steps 1-2: resolveTrough then advancePig for every pig (DECISIONS S04A-1).
  const piles = state.manure ?? 0;
  const win = advanceWithTrough({ pigs: state.pigs, trough: state.trough }, now, rng, dayOffsetMs, piles, state.createdAt, penMood(state));
  let next: FarmGame = { ...state, pigs: win.pigs, trough: win.trough, ...manureAfter(piles, state.pigs, win.pigs) };
  const events: GameEvent[] = [];

  if (win.report.emptiedAt !== null)
    events.push({ type: 'TROUGH_EMPTY', at: win.report.emptiedAt });
  for (const [pigId, m] of Object.entries(win.report.meals)) {
    events.push({ type: 'PIG_ATE_FROM_TROUGH', pigId, ...m });
  }
  events.push(...diffPigs(state.pigs, win.pigs, win.report.hungerZeroAt));
  events.push(...criticalEvents(state.pigs, win.pigs, now));
  const mortality = resolveMortality(next, now, mode);
  next = mortality.state;
  events.push(...mortality.events);

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

  // Step 6: the farm's counters (goals and achievements read them at world level, core/goals).
  return events.length === 0 ? { state: next, events } : { state: trackEvents(next, events), events };
}

/** The pen's manure after the window: every whole pile a pig made (systems/creature `poopProgress`) is added, up to the cap. */
function manureAfter(piles: number, before: readonly Pig[], after: readonly Pig[]): { manure?: number } {
  // The epsilon keeps a pile due at exactly this instant from being lost to float dust in the sum.
  const made1 = (p: Pig) => Math.floor((p.poopProgress ?? 0) + 1e-9);
  const was = new Map(before.map((p) => [p.id, made1(p)]));
  const made = after.reduce((n, p) => n + Math.max(0, made1(p) - (was.get(p.id) ?? 0)), 0);
  const manure = Math.min(BALANCE.MANURE_MAX, piles + made);
  return manure === 0 && piles === 0 ? {} : { manure };
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
