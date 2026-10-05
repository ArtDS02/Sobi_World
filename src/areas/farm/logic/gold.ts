// The farm's coins (player.gold in its working state): every change posts through core/economy's
// ledger, the one place money changes (spec §8.16), and writes a Transaction.
import type { ErrorCode } from '../../../core/config/errors';
import { postTransaction } from '../../../core/economy/ledger';
import type { ActionContext, FarmGame, Transaction, TransactionType } from './types';

export type GoldResult = { ok: true; state: FarmGame } | { ok: false; error: ErrorCode };

export function changeGold(
  state: FarmGame,
  amount: number,
  type: TransactionType,
  ctx: ActionContext,
  ref: { refId?: string; note?: string } = {},
): GoldResult {
  const posted = postTransaction<Transaction>(state.player.gold, state.transactions, amount, { type, ...ref }, ctx);
  if (!posted.ok) return posted;
  return {
    ok: true,
    state: { ...state, player: { ...state.player, gold: posted.balance }, transactions: posted.transactions },
  };
}
