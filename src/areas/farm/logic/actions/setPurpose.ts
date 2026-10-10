// setPurpose (spec V2 §7): what a pig is raised for, chosen from Adult on and changeable. Ship = for sale;
// Breed = kept for the breeding station; Pet = never sold or bred, it lifts the pen's mood; Adventure
// waits for GĐ10.
import { BALANCE } from '../config/balance';
import type { Purpose } from '../../../../systems/creature/types';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export function setPurpose(state: FarmGame, args: { pigId: string; purpose: Purpose }, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    if (args.purpose === 'ADVENTURE') return { ok: false, error: 'PURPOSE_LOCKED' };
    if (pig.growthProgress < BALANCE.STAGE_ADULT_AT) return { ok: false, error: 'PIG_NOT_MATURE' };
    if (pig.purpose === args.purpose) return { ok: false, error: 'NOTHING_TO_DO' };
    return ok({ ...s, pigs: s.pigs.map((p) => (p.id === pig.id ? { ...p, purpose: args.purpose } : p)) }, [
      { type: 'PIG_PURPOSE_SET', pigId: pig.id, purpose: args.purpose },
    ]);
  });
}
