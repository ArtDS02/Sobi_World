// feedAll (D7): hand-feeds every hungry pig with the plain feed in ONE action. Each pig goes through feedPig, so the bag
// and XP are charged exactly as for single feeds (one item per pig, XP only when it was needed). It stops when the feed
// runs out; the pigs fed so far keep their meal. Nothing to do (all full, or no feed at all) is an error, not a no-op.
import { BALANCE } from '../config/balance';
import type { GameEvent } from '../events';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { feedPig } from './feedPig';

export function feedAll(state: FarmGame, ctx: ActionContext): ActionResult {
  const hungry = state.pigs.filter((p) => p.hunger < BALANCE.HUNGER_MAX).sort((a, b) => a.hunger - b.hunger);
  if (hungry.length === 0) return { ok: false, error: 'ALREADY_FULL' };
  let current = state;
  const events: GameEvent[] = [];
  let firstError: Extract<ActionResult, { ok: false }> | null = null;
  for (const pig of hungry) {
    const r = feedPig(current, { pigId: pig.id }, ctx);
    if (!r.ok) {
      firstError ??= r;
      if (r.error === 'INSUFFICIENT_ITEM') break; // no more feed: the rest stay hungry
      continue;
    }
    current = r.state;
    events.push(...r.events);
  }
  return events.length === 0 && firstError ? firstError : { ok: true, state: current, events };
}
