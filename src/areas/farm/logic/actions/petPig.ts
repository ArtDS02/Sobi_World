// petPig (GAME_BALANCE §3): +3 Bond, twice a day per pig. A small XP, no cost.
import { BOND } from '../../../../core/config/bond';
import { gameDay } from '../../../../systems/health/disease';
import { heartsOf, petsLeft, petted } from '../../../../systems/bond/bond';
import { BALANCE } from '../config/balance';
import { addXP } from '../xp';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function petPig(state: FarmGame, args: { pigId: string }, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    const day = gameDay(ctx.now, ctx.dayOffsetMs ?? 0);
    if (petsLeft(pig, day, BOND) <= 0) return { ok: false, error: 'PET_LIMIT_REACHED' };
    const after = petted(pig, day, BOND);
    const next: FarmGame = { ...s, pigs: s.pigs.map((p) => (p.id === pig.id ? after : p)) };
    const xp = addXP(next, BALANCE.XP.PET);
    return ok(xp.state, [{ type: 'PIG_PETTED', pigId: pig.id, bond: after.bond ?? 0, hearts: heartsOf(after.bond, BOND) }], xp.events);
  });
}
