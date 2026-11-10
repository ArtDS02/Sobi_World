// Decision 057 (B2): purchase quantities are any whole count up to a technical ceiling; the bag has no cap.
import { describe, expect, it } from 'vitest';
import { clampQty, maxAffordable, PURCHASE_QTY_MAX } from '../../src/core/inventory/quantity';
import { addToBag } from '../../src/core/inventory/bag';
import { INVENTORY } from '../../src/core/config/inventory';
import { inventoryFileSchema } from '../../content/schemas/shared/inventory';
import { SHOP_MAX as GARDEN_MAX } from '../../src/areas/garden/logic/actions/shop';
import { SHOP_MAX as CLOUD_MAX } from '../../src/areas/cloud/logic/actions/shop';
import { SHOP_MAX as AQUARIUM_MAX } from '../../src/areas/aquarium/logic/actions/shop';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { formatInt } from '../../src/i18n/format';

describe('purchase quantity (decision 057, B2)', () => {
  it('a typed quantity becomes a whole count in 1..ceiling: no NaN, negative, zero or fraction gets through', () => {
    expect(clampQty(Number.NaN)).toBe(1);
    expect(clampQty(Number.POSITIVE_INFINITY)).toBe(1);
    expect(clampQty(-5)).toBe(1);
    expect(clampQty(0)).toBe(1);
    expect(clampQty(2.9)).toBe(2);
    expect(clampQty(1234)).toBe(1234);
    expect(clampQty(5e9)).toBe(PURCHASE_QTY_MAX);
    expect(clampQty(50, 20)).toBe(20);
  });

  it('"Max" is what the balance pays for, never above the ceiling', () => {
    expect(maxAffordable(100, 4)).toBe(25);
    expect(maxAffordable(3, 4)).toBe(0);
    expect(maxAffordable(0, 4)).toBe(0);
    expect(maxAffordable(-10, 4)).toBe(0);
    expect(maxAffordable(Number.NaN, 4)).toBe(0);
    expect(maxAffordable(1e15, 1)).toBe(PURCHASE_QTY_MAX);
    expect(maxAffordable(100, 0)).toBe(PURCHASE_QTY_MAX);
  });

  it('the ceiling is technical: price × count stays an exact integer even at a million coins each', () => {
    expect(PURCHASE_QTY_MAX).toBe(999_999);
    expect(Number.isSafeInteger(PURCHASE_QTY_MAX * 1_000_000)).toBe(true);
    for (const max of [GARDEN_MAX, CLOUD_MAX, AQUARIUM_MAX, BALANCE.SHOP_MAX_QUANTITY]) expect(max).toBe(PURCHASE_QTY_MAX);
  });

  it('the bag has no cap and content cannot bring one back', () => {
    expect(INVENTORY).toEqual({ stack: 99 });
    expect(inventoryFileSchema.safeParse({ slots: 40, stack: 99 }).success).toBe(false);
    const big = addToBag({ A: 900_000_000 }, 'A', PURCHASE_QTY_MAX, INVENTORY);
    expect(big).toEqual({ ok: true, items: { A: 900_999_999 } });
    // Very large counts still read well in the UI (grouped digits, no exponent).
    expect(formatInt(900_999_999)).toMatch(/^900\D999\D999$/);
  });
});
