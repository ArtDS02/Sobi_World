// The shared bag (spec §6 Inventory): one item map for the whole world. Unlimited (decisions 038 and 057): there is no slot
// limit and no way to set one, so adding never fails for room. Pure functions on an item map (the world's inventory.items,
// or an Area's view of it); item ids are content ids, an unknown id is just another stack.
import type { ErrorCode } from '../config/errors';

export interface BagRules {
  /** Display stack size only; it limits nothing. */
  stack: number;
}

export type Items = Readonly<Record<string, number>>;
export type BagResult<M extends Items> =
  | { ok: true; items: M }
  | { ok: false; error: Extract<ErrorCode, 'INSUFFICIENT_ITEM' | 'INVALID_REQUEST'> };

export const countOf = (items: Items, id: string): number => items[id] ?? 0;

const validQty = (qty: number) => Number.isInteger(qty) && qty >= 0;

/** `items` with `qty` more of `id`; only a bad quantity is refused (`_rules` is kept for the callers, it limits nothing). */
export function addToBag<M extends Items>(items: M, id: string, qty: number, _rules?: BagRules): BagResult<M> {
  if (!validQty(qty)) return { ok: false, error: 'INVALID_REQUEST' };
  if (qty === 0) return { ok: true, items };
  return { ok: true, items: { ...items, [id]: countOf(items, id) + qty } as M };
}

/** `items` with `qty` fewer of `id`; refused when there are not that many. */
export function takeFromBag<M extends Items>(items: M, id: string, qty: number): BagResult<M> {
  if (!validQty(qty)) return { ok: false, error: 'INVALID_REQUEST' };
  if (countOf(items, id) < qty) return { ok: false, error: 'INSUFFICIENT_ITEM' };
  if (qty === 0) return { ok: true, items };
  return { ok: true, items: { ...items, [id]: countOf(items, id) - qty } as M };
}

/** Several additions at once (rewards); all or nothing. */
export function addAllToBag<M extends Items>(items: M, gains: Readonly<Record<string, number>>, rules?: BagRules): BagResult<M> {
  let bag: BagResult<M> = { ok: true, items };
  for (const [id, qty] of Object.entries(gains)) {
    if (!bag.ok) return bag;
    bag = addToBag(bag.items, id, qty, rules);
  }
  return bag;
}
