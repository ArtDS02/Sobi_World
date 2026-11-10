// Purchase quantities (decision 057, B2): the shops take any whole count. The only ceiling is technical, so that
// price × count stays an exact integer far below Number.MAX_SAFE_INTEGER whatever the content prices are.
// Gameplay limits (a festival's per-player purchase limit) are rules of their own and are checked by their actions.

/** Technical ceiling of one purchase (not a gameplay rule): 999,999 units. */
export const PURCHASE_QTY_MAX = 999_999;

/** A typed quantity as a whole count in 1..cap: NaN, negatives, zero and fractions never get through. */
export function clampQty(raw: number, cap: number = PURCHASE_QTY_MAX): number {
  if (!Number.isFinite(raw)) return 1;
  return Math.min(Math.max(1, Math.floor(raw)), Math.max(1, Math.floor(cap)));
}

/** The most units `balance` pays for at `unitPrice` each (0 when not even one), never above the technical ceiling. */
export function maxAffordable(balance: number, unitPrice: number, cap: number = PURCHASE_QTY_MAX): number {
  if (!Number.isFinite(balance) || !Number.isFinite(unitPrice) || balance <= 0) return 0;
  if (unitPrice <= 0) return cap;
  return Math.min(cap, Math.floor(balance / unitPrice));
}
