import { describe, expect, it } from 'vitest';
import { formatDuration, t } from '../../src/i18n/format';
import { vi } from '../../src/i18n/vi';
import { historyVm, pigCardVm, pigPanelVm, signedGold, topBarVm } from '../../src/areas/farm/ui/viewModel';
import { toastText as eventToast } from '../../src/areas/farm/scene/feedback/toastText';
import { farm } from './actionKit';
import { makePig } from './pigFactory';

describe('format', () => {
  it('t() fills placeholders', () => {
    expect(t('{a} và {b}', { a: 1, b: 'x' })).toBe('1 và x');
  });

  it('formatDuration', () => {
    expect(formatDuration(30_000)).toBe('30 giây');
    expect(formatDuration(42 * 60_000)).toBe('42 phút');
    expect(formatDuration(5 * 3600_000)).toBe('5 giờ');
    expect(formatDuration(90 * 60_000)).toBe('1 giờ 30 phút');
    expect(formatDuration(2 * 86_400_000)).toBe('2 ngày');
  });
});

describe('topBarVm (§10.1)', () => {
  it('shows level, xp to next level, grouped gold and trough', () => {
    const s = farm();
    const vm = topBarVm({ ...s, player: { ...s.player, xp: 320, gold: 8420 } });
    expect(vm.level).toBe('Cấp 3');
    expect(vm.xp).toBe('320/500 KN');
    expect(vm.xpProgress).toBe(28); // (320-250)/(500-250)
    expect(vm.gold).toBe('8.420 Sobi Coin');
    expect(vm.trough).toBe(vi.hud.troughEmpty);
    expect(vm.troughEmpty).toBe(true);
  });

  it('pig count / capacity from the save, full when no slot is free (BR-1: unborn not counted)', () => {
    const pigs = [0, 1, 2].map((i) => makePig({ id: `p${i}`, slotIndex: i }));
    const s = farm(pigs);
    const at = (slots: number, list = pigs) =>
      topBarVm({ ...s, pigs: list, player: { ...s.player, unlockedSlots: slots } });
    expect(at(8).pigs).toBe('3/8');
    expect(at(8).pigsFull).toBe(false);
    expect(at(3).pigsFull).toBe(true);
    expect(at(3).pigsTitle).toContain(vi.hud.pigsFull);
    const preg = { startedAt: 0, endsAt: 1, fatherId: 'p1', childBreed: pigs[0]!.breed, childGender: 'MALE' as const };
    const withChild = [{ ...pigs[0]!, pregnancy: preg }, pigs[1]!, pigs[2]!];
    // BR-1: an unborn child holds no slot, it is only listed as waiting.
    expect(at(4, withChild).pigsFull).toBe(false);
    expect(at(4, withChild).pigsTitle).toContain('1 heo con đang chờ');
    expect(pigPanelVm(pigs[0]!, 0).generation).toBe('Thế hệ 1');
  });

  it('trough gauge with food; xp capped at max level', () => {
    const s = farm([], { trough: { food: 12, capacity: 30, lastResolvedAt: 0 } });
    const vm = topBarVm({ ...s, player: { ...s.player, xp: 99_999 } });
    expect(vm.trough).toBe('Máng ăn 12/30');
    expect(vm.level).toBe('Cấp 10');
    expect(vm.xp).toBe('5.700/5.700 KN');
    expect(vm.xpProgress).toBe(100);
  });
});

describe('pig view-models (§10.2)', () => {
  it('card shows name, breed, stage, floored percentages, health', () => {
    const vm = pigCardVm(makePig({ growthProgress: 55.9, hunger: 49.99, isSick: true }));
    expect(vm).toMatchObject({
      name: 'Ủn Hồng',
      breed: 'Heo Hồng Đất',
      stage: 'Heo choai',
      growth: '55%',
      hunger: '49%',
      cleanliness: '100%',
      health: vi.stat.sick,
    });
  });

  it('panel shows the price multiplier and pregnancy time left', () => {
    const pregnancy = {
      startedAt: 0,
      endsAt: 42 * 60_000,
      fatherId: 'x',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    const vm = pigPanelVm(makePig({ growthProgress: 100, pregnancy }), 0);
    expect(vm.happiness).toBe('100');
    expect(vm.priceMultiplier).toBe('Giá bán x1,20');
    expect(vm.pregnancy).toBe('Còn 42 phút nữa sinh');
    expect(vm.weight).toBe('50 kg');
  });
});

describe('toastText', () => {
  const s = farm([makePig()]);
  it.each([
    [{ type: 'PIG_BECAME_SICK', pigId: 'pig-1' } as const, 'Ủn Hồng bị bệnh rồi!'],
    [{ type: 'LEVEL_UP', level: 3 } as const, 'Lên cấp 3!'],
    [{ type: 'TROUGH_EMPTY', at: 0 } as const, vi.event.troughEmpty],
    [
      { type: 'DISCOVERY', kind: 'BREED', id: 'PIG_EARTH_PINK', gold: 500 } as const,
      'Khám phá mới: Heo Hồng Đất! +500 Sobi Coin',
    ],
  ])('%j', (event, text) => {
    expect(eventToast(event, s, s)).toBe(text);
  });

  it('a sold pig is named from the previous state', () => {
    const after = farm();
    expect(eventToast({ type: 'PIG_SOLD', pigId: 'pig-1', gold: 1440 }, after, s)).toBe(
      'Đã bán Ủn Hồng được 1.440 Sobi Coin.',
    );
  });
});

describe('history (DECISIONS Q7)', () => {
  it('signed gold', () => {
    expect(signedGold(500)).toBe('+500 Sobi Coin');
    expect(signedGold(-2000)).toBe('-2.000 Sobi Coin');
    expect(signedGold(0)).toBe('0 Sobi Coin');
  });

  it('rows keep the save order (newest first) with type labels', () => {
    const s = farm();
    const transactions = [
      { id: 'b', at: 2000, type: 'SLOT_PURCHASE' as const, amount: -2000 },
      { id: 'a', at: 1000, type: 'PIG_SELL' as const, amount: 1200 },
    ];
    const rows = historyVm({ ...s, transactions });
    expect(rows.map((r) => [r.id, r.label, r.amount, r.tone])).toEqual([
      ['b', 'Mở chuồng', '-2.000 Sobi Coin', 'minus'],
      ['a', 'Bán heo', '+1.200 Sobi Coin', 'plus'],
    ]);
  });
});
