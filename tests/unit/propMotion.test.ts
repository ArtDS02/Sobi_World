import { describe, expect, it } from 'vitest';
import { PATH_DEFAULTS, modsOf, propFrame, rippleOffsets } from '../../src/areas/adventure/ui/propMotion';

describe('prop motion (ANIM-007)', () => {
  it('a sweep is eased, not linear, and rocks and bobs on the way', () => {
    const m = modsOf('sweep', {});
    expect(propFrame(m, 0.25, 0.25, 0.92).prog).toBeLessThan(0.25);
    expect(propFrame(m, 0.75, 0.75, 0.92).prog).toBeGreaterThan(0.75);
    const f = propFrame(m, 0.1, 0.1, 0.92);
    expect(f.rot).not.toBe(0);
    expect(f.dy).not.toBe(0);
  });

  it('a thrown or flying prop stretches along its speed', () => {
    const f = propFrame(modsOf('fly', {}), 0.8, 0.8, 0.92);
    expect(f.sx).toBeGreaterThan(1);
    expect(f.sy).toBeLessThan(1);
  });

  it('a falling prop squashes just after it lands, and not before', () => {
    const m = modsOf('fall', {});
    expect(propFrame(m, 0.5, 0.5 / 0.7, 0.7).sy).toBe(1);
    expect(propFrame(m, 0.76, 1, 0.7).sy).toBeLessThan(1);
  });

  it('an act overrides its path defaults, and a plain path stays plain', () => {
    expect(modsOf('sweep', { ease: 'linear' }).ease).toBe('linear');
    const f = propFrame(PATH_DEFAULTS.pop, 0.5, 0.5, 0.92);
    expect(f).toEqual({ prog: 0.5, dy: 0, rot: 0, sx: 1, sy: 1 });
  });

  it('every prop path ends at its full progress', () => {
    for (const mods of Object.values(PATH_DEFAULTS)) expect(propFrame(mods, 1, 1, 0.92).prog).toBeCloseTo(1);
  });

  it('a ripple bends the picture along a travelling wave, stronger at its leading edge (prop_displace)', () => {
    const r = { amp: 0.06, waves: 1.5, speed: 1.6 };
    const a = rippleOffsets(r, 16, 0);
    const b = rippleOffsets(r, 16, 0.1);
    expect(a).toHaveLength(16);
    // Not a straight strip, and it moves with time (the wave travels).
    expect(new Set(a.map((v) => v.toFixed(4))).size).toBeGreaterThan(4);
    expect(a.some((v, i) => Math.abs(v - b[i]!) > 0.001)).toBe(true);
    // Never more than amp; the trailing end bends at most 35 % of it.
    for (let t = 0; t < 2; t += 0.05) {
      const o = rippleOffsets(r, 16, t);
      expect(Math.max(...o.map(Math.abs))).toBeLessThanOrEqual(r.amp + 1e-9);
      expect(Math.abs(o[0]!)).toBeLessThanOrEqual(r.amp * 0.35 + 1e-9);
    }
  });
});
