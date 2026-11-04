import { describe, expect, it } from 'vitest';
import { BATTLE_FX } from '../../src/areas/adventure/logic/config/content';
import { REACT_MS, idleLife } from '../../src/areas/adventure/ui/poseKit';

describe('idle life (ANIM-100)', () => {
  it('two neighbours are not in step', () => {
    const a = Array.from({ length: 40 }, (_, i) => idleLife('unit_a', i * 300, false).dx);
    const b = Array.from({ length: 40 }, (_, i) => idleLife('unit_b', i * 300, false).dx);
    expect(a).not.toEqual(b);
  });
  it('stays small, and a unit near death sways more', () => {
    for (let t = 0; t < 20000; t += 37) {
      const calm = idleLife('x', t, false);
      expect(Math.abs(calm.dx)).toBeLessThanOrEqual(3);
      expect(Math.abs(calm.rot)).toBeLessThanOrEqual(3.01);
    }
    const swing = (low: boolean) => Math.max(...Array.from({ length: 200 }, (_, i) => Math.abs(idleLife('y', 1000 + i * 13, low).rot)));
    expect(swing(true)).toBeGreaterThan(swing(false));
  });
  it('twitches now and then', () => {
    const rots = Array.from({ length: 400 }, (_, i) => Math.abs(idleLife('z', i * 50, false).rot));
    expect(Math.max(...rots)).toBeGreaterThan(1);
    expect(rots.filter((r) => r === 0).length).toBeGreaterThan(200);
  });
});

describe('reaction tiers and turn signals (ANIM-101, 080)', () => {
  it('a critical hit plays longer than a strong one, which plays longer than a light one', () => {
    expect(REACT_MS['hit-crit']).toBeGreaterThan(REACT_MS['hit-heavy']);
    expect(REACT_MS['hit-heavy']).toBeGreaterThan(REACT_MS.hit);
  });
  it('has the actions: crit, and a turn signal for each side that lasts at most 240 ms', () => {
    expect(BATTLE_FX.actions.crit?.length).toBeGreaterThan(0);
    for (const id of ['turn_start_ally', 'turn_start_enemy'] as const) {
      const acts = BATTLE_FX.actions[id] ?? [];
      expect(acts.length).toBeGreaterThan(0);
      expect(acts.length).toBeGreaterThan(0);
      for (const a of acts) expect(a.at + ('dur' in a ? (a.dur ?? 0) : 0)).toBeLessThanOrEqual(240);
    }
  });
});
