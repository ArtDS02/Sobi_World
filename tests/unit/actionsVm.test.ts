import { describe, expect, it } from 'vitest';
import { ERRORS } from '../../src/core/config/errors';
import { vi } from '../../src/i18n/vi';
import {
  farmActions,
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

describe('farm toolbar', () => {
  it('buy is enabled on a new game, disabled with reasons when full or broke', () => {
    expect(farmActions(farm(), NOW).buyMale.reason).toBeNull();
    const full = farm([0, 1, 2, 3].map((i) => makePig({ id: `p${i}`, slotIndex: i })));
    expect(farmActions(full, NOW).buyFemale.reason).toBe(vi.disabled.noSlot);
    const base = farm();
    const broke = { ...base, player: { ...base.player, gold: 10 } };
    expect(farmActions(broke, NOW).buyMale.reason).toBe(vi.error.INSUFFICIENT_GOLD);
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
