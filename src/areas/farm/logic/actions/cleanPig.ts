// cleanPig (spec §8.3) and cleanAll (§8.4). Cleaning never cures sickness.
import { BALANCE } from '../config/balance';
import type { GameEvent } from '../events';
import { addXP } from '../xp';
import type { ActionContext, ActionResult, Pig, FarmGame } from '../types';
import { ok, runAction } from './runAction';

/** Cleans the given dirty pigs; XP per pig only when cleanliness was <= 70 (D11). */
function cleanPigs(
  s: FarmGame,
  dirty: readonly Pig[],
  now: number,
): { state: FarmGame; events: GameEvent[] } {
  const ids = new Set(dirty.map((p) => p.id));
  const cleaned: FarmGame = {
    ...s,
    pigs: s.pigs.map((p) =>
      ids.has(p.id) ? { ...p, cleanliness: BALANCE.CLEAN_MAX, lastCleanedAt: now } : p,
    ),
  };
  const effective = dirty.filter(
    (p) => p.cleanliness <= BALANCE.XP_EFFECTIVE_CLEAN_MAX_CLEAN,
  ).length;
  const xp = addXP(cleaned, effective * BALANCE.XP.CLEAN);
  const done: GameEvent = { type: 'PIG_CLEANED', pigIds: dirty.map((p) => p.id) };
  return { state: xp.state, events: [done, ...xp.events] };
}

export function cleanPig(
  state: FarmGame,
  args: { pigId: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (pig.cleanliness >= BALANCE.CLEAN_MAX) return { ok: false, error: 'ALREADY_CLEAN' };
    const r = cleanPigs(s, [pig], ctx.now);
    return ok(r.state, r.events);
  });
}

/** Never errors; a clean farm returns ok with PIG_CLEANED { pigIds: [] } (§8.0: ≥ 1 event). */
export function cleanAll(state: FarmGame, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const r = cleanPigs(
      s,
      s.pigs.filter((p) => p.cleanliness < BALANCE.CLEAN_MAX),
      ctx.now,
    );
    return ok(r.state, r.events);
  });
}
