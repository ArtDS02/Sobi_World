// treatPig (spec §8.5): medicine cures sickness only; no XP. NH-1: then Recovering (immune).
// treatAll: one medicine per ill pig, longest ill first, as many as the bag holds.
import { BOND } from '../../../../core/config/bond';
import { takeFromBag } from '../../../../core/inventory/bag';
import { raiseBond } from '../../../../systems/bond/bond';
import { BALANCE } from '../config/balance';
import type { GameEvent } from '../events';
import { bondGainFor, revealEvents } from '../heredity';
import type { ActionContext, ActionResult, FarmGame, Pig } from '../types';
import { ok, runAction } from './runAction';

/** The pig cured: Recovering for a while, and a little closer to you (GAME_BALANCE §3). */
const cure = (pig: Pig, now: number): Pig => ({
  ...pig,
  isSick: false,
  recoveringUntil: now + BALANCE.SICK_RECOVERY_SEC * 1000,
  bond: raiseBond(pig.bond, bondGainFor(pig, BOND.care.gain), BOND),
});

export function treatPig(
  state: FarmGame,
  args: { pigId: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (!pig.isSick) return { ok: false, error: 'PIG_NOT_SICK' };
    const bag = takeFromBag(s.inventory, 'MEDICINE_COMMON', 1);
    if (!bag.ok) return bag;
    const cured = cure(pig, ctx.now);
    return ok(
      { ...s, inventory: bag.items, pigs: s.pigs.map((p) => (p.id === pig.id ? cured : p)) },
      [{ type: 'PIG_TREATED', pigId: pig.id }, ...revealEvents(pig, cured)],
    );
  });
}

/** Ill pigs in the order treatAll cures them: the longest ill first (they are nearest to critical). */
export const sickPigs = (state: FarmGame): Pig[] =>
  state.pigs.filter((p) => p.isSick).sort((a, b) => (a.lastSickAt ?? 0) - (b.lastSickAt ?? 0));

/** Cures every ill pig the bag has medicine for; PIG_TREATED_ALL lists them. */
export function treatAll(state: FarmGame, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const sick = sickPigs(s);
    if (sick.length === 0) return { ok: false, error: 'PIG_NOT_SICK' };
    const n = Math.min(sick.length, s.inventory.MEDICINE_COMMON);
    const bag = takeFromBag(s.inventory, 'MEDICINE_COMMON', n || 1); // an empty bag answers its own error
    if (!bag.ok) return bag;
    const cured = new Map(sick.slice(0, n).map((p) => [p.id, cure(p, ctx.now)]));
    const reveals: GameEvent[] = sick.slice(0, n).flatMap((p) => revealEvents(p, cured.get(p.id)!));
    return ok(
      { ...s, inventory: bag.items, pigs: s.pigs.map((p) => cured.get(p.id) ?? p) },
      [{ type: 'PIG_TREATED_ALL', pigIds: [...cured.keys()], left: sick.length - n }, ...reveals],
    );
  });
}
