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
    expect(vm.partners[0]!.compat).toMatch(/^Độ hợp: [♥♡]{5}$/);
    expect(vm.capacity).toMatch(/^Chỗ trong trại: 3\/\d+ /);
  });

  it('hidden discovery: species never seen show as ??? with their rarity (PS-2)', () => {
    const s = farm([mom, dad]);
    const lines = breedingVm(s, dad, 0).partners[0]!.chances;
    expect(lines[0]).toMatch(/^Heo Hồng Đất /); // the parents' own species is known
    expect(lines.some((l) => /^\?\?\? \(/.test(l))).toBe(true);
    expect(lines.join(' ')).not.toContain('Heo Sọc Dưa');
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
    // BR-1: a full farm still breeds (the child waits in the nursery); a full nursery does not.
    const full = farm([mom, dad, adult({ id: 'c', slotIndex: 2 }), adult({ id: 'd', slotIndex: 3 })]);
    expect(breedingVm(full, mom, 0).button.reason).toBeNull();
    const baby = (id: string) => ({
      id,
      breed: 'PIG_EARTH_PINK' as const,
      name: id,
      gender: 'MALE' as const,
      generation: 2,
      bornAt: 0,
      parents: { motherId: 'a', fatherId: 'b', motherBreed: 'PIG_EARTH_PINK' as const, fatherBreed: 'PIG_EARTH_PINK' as const },
    });
    const crowded = { ...farm([mom, dad]), nursery: Array.from({ length: 12 }, (_, i) => baby(`n${i}`)) };
    expect(breedingVm(crowded, mom, 0).button.reason).toBe(vi.disabled.nurseryFull);
    expect(breedingVm(farm([mom]), mom, 0).button.reason).toBe(vi.disabled.noPartner);
  });
});
