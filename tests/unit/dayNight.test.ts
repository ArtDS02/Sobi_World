import { describe, expect, it } from 'vitest';
import {
  DAY_NIGHT,
  DAY_PHASES,
  PHASE_LOOKS,
  type DayNightSettings,
} from '../../src/core/config/dayNight';
import { FARM_VIEW } from '../../src/core/config/farmView';
import {
  blendAt,
  dayNightIssues,
  dayScene,
  formatHm,
  mixColor,
  parseHm,
  phaseAt,
} from '../../src/core/engine/dayNight';

const at = (hm: string) => parseHm(hm)!;
const S: DayNightSettings = {
  enabled: true,
  phases: {
    dawn: '05:00',
    morning: '07:00',
    day: '10:00',
    afternoon: '16:00',
    sunset: '18:00',
    night: '20:00',
  },
  blendMinutes: 60,
  transitionMs: 3000,
};
const hex = (c: string) => parseInt(c.slice(1), 16);

describe('day / night (DN)', () => {
  it('shipped settings are valid', () => {
    expect(dayNightIssues(DAY_NIGHT)).toEqual([]);
  });

  it('day look is the farm as it was (no tint, same sky)', () => {
    expect(PHASE_LOOKS.day.ambient).toBe(0xffffff);
    expect(PHASE_LOOKS.day.skyTop).toBe(hex(FARM_VIEW.BACKDROP.sky.top));
    expect(PHASE_LOOKS.day.skyBottom).toBe(hex(FARM_VIEW.BACKDROP.sky.bottom));
  });

  it('phase follows the local time, wrapping at midnight', () => {
    expect(phaseAt(at('00:00'), S)).toBe('night');
    expect(phaseAt(at('04:59'), S)).toBe('night');
    expect(phaseAt(at('05:00'), S)).toBe('dawn');
    expect(phaseAt(at('08:00'), S)).toBe('morning');
    expect(phaseAt(at('10:35'), S)).toBe('day');
    expect(phaseAt(at('16:30'), S)).toBe('afternoon');
    expect(phaseAt(at('18:10'), S)).toBe('sunset');
    expect(phaseAt(at('22:00'), S)).toBe('night');
    expect(phaseAt(at('23:59'), S)).toBe('night');
  });

  it('blends around each start time, pure in mid-phase', () => {
    expect(blendAt(at('13:00'), S)).toEqual({ from: 'day', to: 'day', t: 0 });
    const before = blendAt(at('19:45'), S);
    expect(before.from).toBe('sunset');
    expect(before.to).toBe('night');
    expect(before.t).toBeGreaterThan(0);
    expect(before.t).toBeLessThan(0.5);
    expect(blendAt(at('20:00'), S).t).toBeCloseTo(0.5);
    const after = blendAt(at('20:20'), S);
    expect(after).toMatchObject({ from: 'sunset', to: 'night' });
    expect(after.t).toBeGreaterThan(0.5);
    expect(blendAt(at('22:00'), S)).toEqual({ from: 'night', to: 'night', t: 0 });
    // Night → dawn across the morning boundary.
    expect(blendAt(at('04:50'), S)).toMatchObject({ from: 'night', to: 'dawn' });
  });

  it('look changes gradually minute by minute (no jump)', () => {
    for (let m = 0; m < 1440; m++) {
      const a = dayScene(m, S).look;
      const b = dayScene(m + 1, S).look;
      expect(Math.abs(a.stars - b.stars)).toBeLessThan(0.06);
      expect(Math.abs(a.shadow - b.shadow)).toBeLessThan(0.06);
    }
  });

  it('disabled shows day; preview shows the chosen phase without touching the clock', () => {
    expect(dayScene(at('22:00'), { ...S, enabled: false }).look).toEqual(PHASE_LOOKS.day);
    expect(dayScene(at('12:00'), S, 'night')).toMatchObject({
      phase: 'night',
      look: PHASE_LOOKS.night,
    });
    expect(dayScene(at('12:00'), S).phase).toBe('day');
  });

  it('night keeps the farm readable (tint never darker than ~55 %)', () => {
    for (const phase of DAY_PHASES) {
      const c = PHASE_LOOKS[phase].ambient;
      for (const shift of [16, 8, 0]) expect((c >> shift) & 0xff).toBeGreaterThanOrEqual(0x8c);
    }
  });

  it('validates admin settings', () => {
    expect(dayNightIssues({ ...S, phases: { ...S.phases, day: '06:00' } })).toHaveLength(1);
    expect(dayNightIssues({ ...S, phases: { ...S.phases, night: '25:00' } })).toHaveLength(1);
    expect(dayNightIssues({ ...S, blendMinutes: 200 })).toHaveLength(1);
    expect(
      dayNightIssues({ ...S, blendMinutes: 120, phases: { ...S.phases, sunset: '17:00' } }),
    ).toHaveLength(1); // longer than 16→17
    expect(dayNightIssues({ ...S, transitionMs: -1 })).toHaveLength(1);
  });

  it('helpers', () => {
    expect(formatHm(at('09:05'))).toBe('09:05');
    expect(formatHm(1440 + 61)).toBe('01:01');
    expect(parseHm('7:30')).toBe(450);
    expect(parseHm('ab')).toBeNull();
    expect(mixColor(0x000000, 0xffffff, 0.5)).toBe(0x808080);
  });
});
