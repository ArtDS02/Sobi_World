// claimAchievement (DECISIONS PG-2): pays a reached achievement once.
import { ACHIEVEMENTS } from '../config/achievements';
import { changeGold } from '../engine/gold';
import { isReached } from '../engine/progress';
import { addXP } from '../engine/xp';
import type { ActionContext, ActionResult, SaveGame } from '../types';
import { ok, runAction } from './runAction';

export function claimAchievement(
  state: SaveGame,
  args: { id: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const def = ACHIEVEMENTS.find((d) => d.id === args.id);
    if (!def) return { ok: false, error: 'INVALID_REQUEST' };
    if (s.progress.claimed[def.id] !== undefined) return { ok: false, error: 'ALREADY_CLAIMED' };
    if (!isReached(s, def)) return { ok: false, error: 'ACHIEVEMENT_LOCKED' };
    const marked: SaveGame = {
      ...s,
      progress: { ...s.progress, claimed: { ...s.progress.claimed, [def.id]: ctx.now } },
    };
    const paid = changeGold(marked, def.gold, 'ACHIEVEMENT_REWARD', ctx, { refId: def.id });
    if (!paid.ok) return paid;
    const xp = addXP(paid.state, def.xp);
    return ok(
      xp.state,
      [{ type: 'ACHIEVEMENT_CLAIMED', id: def.id, gold: def.gold, xp: def.xp }],
      xp.events,
    );
  });
}
