// Seasonal FX (DECISIONS MU-2): emitters per season + day / night, tuning, spawn and motion.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SEASON_FX_ART_IDS, SEASON_FX_LIMITS, SEASON_FX_TUNING } from '../../src/core/config/seasonFx';
import { SEASON_FX } from '../../src/core/config/seasonFxTable';
import { SEASON_IDS } from '../../src/core/config/seasons';
import { activeEmitters, particlePose, seasonFxIssues, spawnParticle } from '../../src/core/engine/seasonFx';
import { seededRng } from '../../src/core/rng';

const ids = (season: (typeof SEASON_IDS)[number], phase: Parameters<typeof activeEmitters>[1]) =>
  activeEmitters(season, phase).map((a) => a.emitter.id);
const view = { x: 0, y: 0, width: 1600, height: 900 };
const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as {
  fx: { id: string; frames?: { count: number } }[];
};

describe('seasonal FX (MU-2)', () => {
  it('each season has its effects', () => {
    expect(ids('spring', 'day')).toEqual(expect.arrayContaining(['spring_petals', 'spring_butterflies']));
    expect(ids('summer', 'day')).toEqual(expect.arrayContaining(['summer_sunbeams', 'summer_dust']));
    expect(ids('autumn', 'day')).toEqual(expect.arrayContaining(['autumn_leaves', 'autumn_haze']));
    expect(ids('winter', 'day')).toEqual(expect.arrayContaining(['winter_snow', 'winter_wind']));
  });

  it('summer: sunbeams / dust by day, fireflies only at night', () => {
    expect(ids('summer', 'day')).not.toContain('summer_fireflies');
    expect(ids('summer', 'night')).toContain('summer_fireflies');
    expect(ids('summer', 'night')).not.toContain('summer_sunbeams');
    expect(ids('summer', 'night')).not.toContain('summer_dust');
    for (const s of ['spring', 'autumn', 'winter'] as const)
      for (const p of ['day', 'night'] as const) expect(ids(s, p)).not.toContain('summer_fireflies');
  });

  it('tuning: global off, per-emitter off, density scales the cap, capped', () => {
    expect(activeEmitters('winter', 'day', { ...SEASON_FX_TUNING, enabled: false })).toEqual([]);
    const off = { enabled: true, density: 1, emitters: { winter_snow: { enabled: false, density: 1, spawnRate: 1 } } };
    expect(activeEmitters('winter', 'day', off).map((a) => a.emitter.id)).not.toContain('winter_snow');
    const half = { enabled: true, density: 0.5, emitters: {} };
    const snow = SEASON_FX.winter.find((e) => e.id === 'winter_snow')!;
    expect(activeEmitters('winter', 'day', half).find((a) => a.emitter.id === 'winter_snow')!.maxActive).toBe(Math.round(snow.maxActive / 2));
    const max = { enabled: true, density: 2, emitters: { winter_snow: { enabled: true, density: 2, spawnRate: 4 } } };
    const a = activeEmitters('winter', 'day', max).find((x) => x.emitter.id === 'winter_snow')!;
    expect(a.maxActive).toBeLessThanOrEqual(SEASON_FX_LIMITS.maxActiveCap);
    expect(a.intervalMs[0]).toBeCloseTo(snow.spawnIntervalMs[0] / 4);
    expect(activeEmitters('winter', 'day', { enabled: true, density: 0, emitters: {} })).toEqual([]);
  });

  it('every emitter is sparse and bounded and uses a known art strip with enough frames', () => {
    for (const list of Object.values(SEASON_FX))
      for (const e of list) {
        expect(SEASON_FX_ART_IDS).toContain(e.art);
        expect(e.maxActive).toBeGreaterThan(0);
        expect(e.maxActive).toBeLessThanOrEqual(SEASON_FX_LIMITS.maxActiveCap);
        expect(e.spawnIntervalMs[0]).toBeGreaterThanOrEqual(300);
        expect(e.density).toBeGreaterThan(0);
        expect(e.density).toBeLessThanOrEqual(1);
        expect(e.opacity[1]).toBeLessThanOrEqual(1);
        const count = manifest.fx.find((r) => r.id === e.art)?.frames?.count ?? 1;
        for (const f of e.frames ?? []) expect(f).toBeLessThan(count);
        if (e.flap) expect(count % e.flap.size).toBe(0);
        if (e.area === 'anchors') expect(e.anchors?.length).toBeGreaterThan(0);
      }
  });

  it('spring petals fall from the top-left towards the bottom-right, fading in and out', () => {
    const e = SEASON_FX.spring.find((x) => x.id === 'spring_petals')!;
    const rng = seededRng(7);
    for (let i = 0; i < 50; i++) {
      const p = spawnParticle(e, 27, view, [], 1000, rng)!;
      expect(p.vx).toBeGreaterThan(0);
      expect(p.vy).toBeGreaterThan(0);
      expect(p.x0 <= view.x || p.y0 <= view.y).toBe(true); // starts just outside the top / left edge
      expect(p.frame).toBeLessThan(27);
      expect(particlePose(e, p, 1000).alpha).toBe(0);
      const mid = particlePose(e, p, 1000 + p.lifeMs / 2);
      expect(mid.alpha).toBeGreaterThan(0);
      expect(mid.alpha).toBeLessThanOrEqual(1);
      expect(particlePose(e, p, 1000 + p.lifeMs).alive).toBe(false);
    }
  });

  it('anchored emitters gather around their placements, or skip when none is on the farm', () => {
    const e = SEASON_FX.spring.find((x) => x.id === 'spring_butterflies')!;
    const tree = { id: 'prop_red_tree', x: 400, y: 300, width: 100, height: 120 };
    const rng = seededRng(3);
    expect(spawnParticle(e, 6, view, [], 0, rng)).toBeNull();
    for (let i = 0; i < 30; i++) {
      const p = spawnParticle(e, 6, view, [tree], 0, rng)!;
      expect(Math.abs(p.x0 - tree.x)).toBeLessThanOrEqual(tree.width);
      expect(Math.abs(p.y0 - tree.y)).toBeLessThanOrEqual(tree.height);
      expect(p.frame % 2).toBe(0); // first frame of a wing-flap pair
      const pose = particlePose(e, p, 500);
      expect([p.frame, p.frame + 1]).toContain(pose.frame);
    }
  });

  it('admin tuning validation', () => {
    expect(seasonFxIssues(SEASON_FX_TUNING)).toEqual([]);
    expect(
      seasonFxIssues({ enabled: true, density: 5, emitters: { nope: { enabled: true, density: -1, spawnRate: 99 } } }),
    ).toHaveLength(4);
  });
});
