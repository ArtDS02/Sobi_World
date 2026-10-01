// The single place gold changes (spec §8.16): every delta writes a Transaction.
import { SAVE } from '../config/save';
import type { ErrorCode } from '../config/errors';
import { randomId } from '../rng';
import type { ActionContext, SaveGame, TransactionType } from '../types';

export type GoldResult = { ok: true; state: SaveGame } | { ok: false; error: ErrorCode };

export function changeGold(
  state: SaveGame,
  amount: number,
  type: TransactionType,
  ctx: ActionContext,
  ref: { refId?: string; note?: string } = {},
): GoldResult {
  const gold = state.player.gold + amount;
  if (gold < 0) return { ok: false, error: 'INSUFFICIENT_GOLD' };
  const tx = { id: randomId(ctx.rng), at: ctx.now, type, amount, ...ref };
  return {
    ok: true,
    state: {
      ...state,
      player: { ...state.player, gold },
      transactions: [tx, ...state.transactions].slice(0, SAVE.TRANSACTIONS_MAX),
    },
  };
}
