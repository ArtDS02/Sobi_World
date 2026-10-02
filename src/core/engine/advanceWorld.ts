// World catch-up (spec §7.4): trough → pigs → births → orders → gifts (U06), then diff into events.
import type { GameEvent } from '../events';
import type { Rng } from '../rng';
import type { Pig, SaveGame } from '../types';
import { resolveBirths } from './breeding';
import { resolveGifts } from './gifts';
import { refreshOrders } from './orders';
import { advanceWithTrough } from './trough';

export interface WorldResult {
  state: SaveGame;
  events: GameEvent[];
}

/** Idempotent for the same `now`; the caller persists when `events` is non-empty (§7.4 step 6). */
export function advanceWorld(state: SaveGame, now: number, rng: Rng): WorldResult {
  // Steps 1-2: resolveTrough then advancePig for every pig (DECISIONS S04A-1).
  const win = advanceWithTrough({ pigs: state.pigs, trough: state.trough }, now, rng);
  let next: SaveGame = { ...state, pigs: win.pigs, trough: win.trough };
  const events: GameEvent[] = [];

  if (win.report.emptiedAt !== null)
    events.push({ type: 'TROUGH_EMPTY', at: win.report.emptiedAt });
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

  return { state: next, events };
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
    if (old.growthProgress < 100 && pig.growthProgress === 100) {
      events.push({ type: 'PIG_BECAME_ADULT', pigId: pig.id });
    }
  }
  return events;
}
