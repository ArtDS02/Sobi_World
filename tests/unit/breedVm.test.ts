import { describe, expect, it } from 'vitest';
import { vi } from '../../src/i18n/vi';
import { breedingVm } from '../../src/ui/breedVm';
import { ctx, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const adult = (o: Parameters<typeof makePig>[0]) => makePig({ growthProgress: 100, ...o });
const mom = adult({ id: 'mom', slotIndex: 0, gender: 'FEMALE', name: 'Mẹ' });
const dad = adult({ id: 'dad', slotIndex: 1, gender: 'MALE', name: 'Bố' });

describe('breedingVm (§10.2)', () => {
  it('lists valid partners with chances, mother-breed duration and the fee', () => {
    const s = farm([mom, dad, adult({ id: 'sis', slotIndex: 2, gender: 'FEMALE' })]);
    const vm = breedingVm(s, dad, 0);
    expect(vm.button.reason).toBeNull();
    expect(vm.partners.map((p) => p.pigId)).toEqual(['mom', 'sis']);
    const chances = vm.partners[0]!.chances;
    expect(chances).toHaveLength(5); // 4 named + the rest
    expect(chances[0]).toMatch(/^Heo Hồng Đất \d+%$/);
    expect(chances[4]).toMatch(/^Giống khác [\d,]+%$/);
    expect(vm.partners[0]!.duration).toContain('1 giờ');
    expect(vm.fee).toContain('200');
  });

  it('the confirm runs the real breedPigs', () => {
    const s = farm([mom, dad]);
    const r = expectOk(breedingVm(s, mom, 0).partners[0]!.confirm.run(s, ctx()));
    expect(r.state.pigs.find((p) => p.id === 'mom')!.pregnancy).not.toBeNull();
  });

  it('disabled reasons: own state first, then farm-wide, else no partner', () => {
    expect(breedingVm(farm([mom, dad]), { ...mom, growthProgress: 50 }, 0).button.reason).toBe(
      vi.disabled.notMature,
    );
    const mythical = { ...mom, breed: 'PIG_MYTHICAL' as const };
    expect(breedingVm(farm([mythical, dad]), mythical, 0).button.reason).toBe(
      vi.disabled.cannotBreed,
    );
    const full = farm([
      mom,
      dad,
      adult({ id: 'c', slotIndex: 2 }),
      adult({ id: 'd', slotIndex: 3 }),
    ]);
    expect(breedingVm(full, mom, 0).button.reason).toBe(vi.disabled.noSlot);
    expect(breedingVm(farm([mom]), mom, 0).button.reason).toBe(vi.disabled.noPartner);
  });
});
