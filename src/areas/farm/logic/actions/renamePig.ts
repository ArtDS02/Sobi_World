// renamePig (spec §8.12).
import { BALANCE } from '../../../../core/config/balance';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

const CONTROL_CHARS = /\p{Cc}/gu;

/** Strip control characters, trim; null when the result is not 1-16 characters. */
export function cleanPigName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.replace(CONTROL_CHARS, '').trim();
  const length = [...name].length;
  return length >= 1 && length <= BALANCE.PIG_NAME_MAX ? name : null;
}

export function renamePig(
  state: FarmGame,
  args: { pigId: string; name: string },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    if (!s.pigs.some((p) => p.id === args.pigId)) return { ok: false, error: 'PIG_NOT_FOUND' };
    const name = cleanPigName(args.name);
    if (name === null) return { ok: false, error: 'INVALID_REQUEST' };
    return ok({ ...s, pigs: s.pigs.map((p) => (p.id === args.pigId ? { ...p, name } : p)) }, [
      { type: 'PIG_RENAMED', pigId: args.pigId },
    ]);
  });
}
