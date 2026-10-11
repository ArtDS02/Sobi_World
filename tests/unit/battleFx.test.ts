import { describe, expect, it } from 'vitest';
import { unitEffects, type HpMemory } from '../../src/areas/adventure/ui/battleFx';
import type { UnitVm } from '../../src/areas/adventure/ui/battleVm';

const unit = (id: string, hpPercent: number, down = false) => ({ id, hpPercent, down }) as UnitVm;

describe('battle hit feedback', () => {
  it('plays nothing on the first draw of a battle', () => {
    const m: HpMemory = new Map();
    expect(unitEffects(m, [unit('a', 100), unit('e', 100)]).size).toBe(0);
  });

  it('reports hit, heal and ko by comparing with the last draw', () => {
    const m: HpMemory = new Map();
    unitEffects(m, [unit('a', 100), unit('b', 50), unit('e', 30)]);
    const fx = unitEffects(m, [unit('a', 70), unit('b', 80), unit('e', 0, true)]);
    expect(fx.get('a')).toBe('hit');
    expect(fx.get('b')).toBe('heal');
    expect(fx.get('e')).toBe('ko');
    expect(unitEffects(m, [unit('a', 70), unit('b', 80), unit('e', 0, true)]).size).toBe(0);
  });

  it('treats a different set of units as a new battle', () => {
    const m: HpMemory = new Map();
    unitEffects(m, [unit('a', 100), unit('e1', 100)]);
    expect(unitEffects(m, [unit('x', 40), unit('e2', 20)]).size).toBe(0);
  });
});
