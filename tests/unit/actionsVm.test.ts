import { describe, expect, it } from 'vitest';
import { ERRORS } from '../../src/core/config/errors';
import { BALANCE } from '../../src/core/config/balance';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import { rarityRank } from '../../src/core/config/rarity';
import { vi } from '../../src/i18n/vi';
import {
  farmActions,
  productPurchase,
  shopPigs,
  shopSlot,
  pigActions,
  reasonFor,
  troughFill,
  troughSpace,
} from '../../src/ui/actionsVm';
import { farm } from './actionKit';
import { makePig } from './pigFactory';

const NOW = 0;

describe('disabled reasons (§10.2)', () => {
  it('every error code maps to a non-empty reason', () => {
    for (const code of ERRORS) expect(reasonFor(code)).toBeTruthy();
  });

  it('fresh full clean baby: feed/clean/treat/sell disabled with the right reason', () => {
    const a = pigActions(farm([makePig()]), 'pig-1', NOW);
    expect(a.feed.reason).toBe(vi.disabled.notHungry);
    expect(a.clean.reason).toBe(vi.disabled.notDirty);
    expect(a.treat.reason).toBe(vi.disabled.notSick);
    expect(a.sell.reason).toBe(vi.disabled.notMature);
  });

  it('hungry dirty sick adult with stock: everything enabled', () => {
    const pig = makePig({ hunger: 20, cleanliness: 20, isSick: true, growthProgress: 100 });
    const a = pigActions(farm([pig]), 'pig-1', NOW);
    expect([a.feed.reason, a.clean.reason, a.treat.reason, a.sell.reason]).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it('missing items name the item', () => {
    const base = farm([makePig({ hunger: 20, isSick: true })]);
    const s = { ...base, inventory: { FOOD_BASIC: 0, MEDICINE_COMMON: 0 } };
    const a = pigActions(s, 'pig-1', NOW);
    expect(a.feed.reason).toBe(vi.disabled.noFood);
    expect(a.treat.reason).toBe(vi.disabled.noMedicine);
  });

  it('pregnant adult cannot be sold', () => {
    const pregnancy = {
      startedAt: 0,
      endsAt: 3_600_000,
      fatherId: 'x',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    const a = pigActions(farm([makePig({ growthProgress: 100, pregnancy })]), 'pig-1', NOW);
    expect(a.sell.reason).toBe(vi.disabled.isPregnant);
  });

  it('probing never mutates the save', () => {
    const s = farm([makePig({ hunger: 20 })]);
    const before = structuredClone(s);
    pigActions(s, 'pig-1', NOW);
    farmActions(s, NOW);
    expect(s).toEqual(before);
  });
});

describe('shop (R03)', () => {
  it('buy pig is enabled on a new game, disabled with reasons when full or broke', () => {
    const [pink] = shopPigs(farm(), NOW);
    expect(pink!.breed).toBe('PIG_EARTH_PINK');
    expect(pink!.male.reason).toBeNull();
    const full = farm([0, 1, 2, 3].map((i) => makePig({ id: `p${i}`, slotIndex: i })));
    expect(shopPigs(full, NOW)[0]!.female.reason).toBe(vi.disabled.noSlot);
    const base = farm();
    const broke = { ...base, player: { ...base.player, gold: 10 } };
    expect(shopPigs(broke, NOW)[0]!.male.reason).toBe(vi.error.INSUFFICIENT_GOLD);
  });

  it('only breeds with a shop price are listed', () => {
    expect(shopPigs(farm(), NOW).map((p) => p.breed)).toEqual(
      BREED_IDS.filter((id) => BREEDS[id].buyGold !== null),
    );
    expect(shopPigs(farm(), NOW).map((p) => p.breed)).toContain('PIG_TIGER');
  });

  it('pig cards come commonest first and show the level a locked species needs (U04)', () => {
    const rows = shopPigs(farm(), NOW);
    const ranks = rows.map((p) => rarityRank(p.rarity));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    const tiger = rows.find((p) => p.breed === 'PIG_TIGER')!;
    expect(tiger.male.reason).toBe('Cần cấp 6');
    expect(rows.find((p) => p.breed === 'PIG_EARTH_PINK')!.male.reason).toBeNull();
    expect(tiger.sell).toBe('Bán tới 14.400 vàng');
  });

  it('item purchase: live total, invalid quantity and gold shortfall disable the button', () => {
    const s = farm();
    const vm = productPurchase(s, 'FOOD_BASIC', 4, NOW);
    expect(vm.total).toBe('Tổng: 100 vàng');
    expect(vm.confirm.reason).toBeNull();
    expect(productPurchase(s, 'FOOD_BASIC', 0, NOW).confirm.reason).toBe(vi.error.INVALID_REQUEST);
    const broke = { ...s, player: { ...s.player, gold: 99 } };
    expect(productPurchase(broke, 'MEDICINE_COMMON', 1, NOW).confirm.reason).toBe(
      vi.error.INSUFFICIENT_GOLD,
    );
  });

  it('slot: level gate shows the required level; enabled at level 2 with gold; null when all open', () => {
    const s = farm();
    const low = shopSlot({ ...s, player: { ...s.player, xp: 0, gold: 99_999 } }, NOW)!;
    expect(low.title).toBe('Chuồng thứ 5');
    expect(low.price).toBe('2.000 vàng');
    expect(low.buy.reason).toBe('Cần cấp 2');
    expect(
      shopSlot({ ...s, player: { ...s.player, xp: 100, gold: 2000 } }, NOW)!.buy.reason,
    ).toBeNull();
    expect(
      shopSlot({ ...s, player: { ...s.player, unlockedSlots: BALANCE.MAX_SLOTS } }, NOW),
    ).toBeNull();
  });

  it('cleanAll never disabled', () => {
    expect(farmActions(farm([makePig()]), NOW).cleanAll.reason).toBeNull();
  });
});

describe('trough fill dialog', () => {
  it('breakdown takes inventory first then prices the shortfall', () => {
    const s = farm();
    expect(troughSpace(s)).toBe(20);
    const vm = troughFill(s, 14, NOW);
    expect(vm.fromInventory).toBe('Lấy từ kho: 10');
    expect(vm.toBuy).toBe('Mua thêm: 4 (100 vàng)');
    expect(vm.confirm.label).toBe('Đổ 14 phần');
    expect(vm.confirm.reason).toBeNull();
  });

  it('over capacity → TROUGH_FULL reason', () => {
    expect(troughFill(farm(), 21, NOW).confirm.reason).toBe(vi.error.TROUGH_FULL);
  });
});
