// The one place money changes (spec §8.16, CLAUDE.md): every delta of any currency is a Transaction.
// Areas keep their own view of a balance (the farm: player.gold) but post through here; world-level
// code uses changeCurrency on the world save.
import type { ErrorCode } from '../config/errors';
import { SAVE } from '../config/save';
import { randomId } from '../rng';
import type { Currency, WorldSave, WorldTransaction } from '../save/world';
import type { ActionContext } from '../types';

/** What a transaction records besides its id, time and amount. */
export interface TransactionEntry<Type extends string = string> {
  type: Type;
  currency?: Currency;
  refId?: string;
  note?: string;
}

export interface TransactionRecord<Type extends string = string> extends TransactionEntry<Type> {
  id: string;
  at: number;
  amount: number;
}

export type PostResult<T> =
  | { ok: true; balance: number; transactions: T[] }
  | { ok: false; error: Extract<ErrorCode, 'INSUFFICIENT_GOLD'> };

/**
 * `balance + amount` with its transaction prepended (newest first, capped). A balance never goes
 * negative: the change is refused instead (INSUFFICIENT_GOLD = not enough of that currency).
 */
export function postTransaction<T extends TransactionRecord>(
  balance: number,
  transactions: readonly T[],
  amount: number,
  entry: TransactionEntry<T['type']>,
  ctx: ActionContext,
): PostResult<T> {
  amount = amount === 0 ? 0 : amount; // normalise -0 (e.g. -0 * price) so records read as 0
  const next = balance + amount;
  if (next < 0) return { ok: false, error: 'INSUFFICIENT_GOLD' };
  const { type, ...ref } = entry;
  const tx = { id: randomId(ctx.rng), at: ctx.now, type, amount, ...ref } as T;
  return { ok: true, balance: next, transactions: [tx, ...transactions].slice(0, SAVE.TRANSACTIONS_MAX) };
}

export type CurrencyResult =
  | { ok: true; state: WorldSave }
  | { ok: false; error: Extract<ErrorCode, 'INSUFFICIENT_GOLD'> };

/** World-level change of one currency of the wallet (coins, gems, event tokens). */
export function changeCurrency(
  world: WorldSave,
  currency: Currency,
  amount: number,
  entry: Omit<TransactionEntry, 'currency'>,
  ctx: ActionContext,
): CurrencyResult {
  const r = postTransaction<WorldTransaction>(world.wallet[currency], world.transactions, amount, { ...entry, currency }, ctx);
  if (!r.ok) return r;
  return { ok: true, state: { ...world, wallet: { ...world.wallet, [currency]: r.balance }, transactions: r.transactions } };
}
