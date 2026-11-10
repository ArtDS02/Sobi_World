// The upgrade effect of a cloud tier / garden zone (decision 057, B6): which events ask for it, and what the sequence holds per
// rank and effects level. Presentation only.
import { describe, expect, it } from 'vitest';
import { cloudPresentation } from '../../src/areas/cloud/feedback';
import { gardenPresentation } from '../../src/areas/garden/feedback';
import { effectsScale, effectsWith } from '../../src/systems/animation/rankAtmosphere';
import { parseUpgradeVfx, UPGRADE_FX, upgradePlan, upgradeVfx } from '../../src/systems/animation/upgradeFx';

describe('upgradeVfx / parseUpgradeVfx', () => {
  it('round-trips the target through the AreaVfx', () => {
    for (const area of ['cloud', 'garden'] as const) {
      for (const opened of [true, false]) {
        const target = { area, group: 7, rank: 4, opened };
        const vfx = upgradeVfx(target);
        expect(vfx.fx).toBe(UPGRADE_FX);
        expect(parseUpgradeVfx(vfx)).toEqual(target);
      }
    }
  });

  it("refuses another effect and a malformed target (so a scene ignores what is not its own)", () => {
    expect(parseUpgradeVfx({ fx: 'fx_secret_found', at: 'cloud:0:2:rank' })).toBeNull();
    expect(parseUpgradeVfx({ fx: UPGRADE_FX, at: null })).toBeNull();
    expect(parseUpgradeVfx({ fx: UPGRADE_FX, at: 'farm:0:2:rank' })).toBeNull();
    expect(parseUpgradeVfx({ fx: UPGRADE_FX, at: 'cloud:-1:2:rank' })).toBeNull();
    expect(parseUpgradeVfx({ fx: UPGRADE_FX, at: 'cloud:0:6:rank' })).toBeNull();
    expect(parseUpgradeVfx({ fx: UPGRADE_FX, at: 'cloud:x:2:rank' })).toBeNull();
  });
});

describe('upgradePlan', () => {
  const full = effectsScale('full');
  const light = effectsScale('light');

  it('plays nothing when effects are off or motion is reduced', () => {
    expect(upgradePlan(5, effectsScale('off'))).toBeNull();
    expect(upgradePlan(5, effectsWith('full', true))).toBeNull();
    expect(upgradePlan(5, effectsWith('light', true))).toBeNull();
  });

  it('lasts 1.5 to 2 s at full and grows with the rank', () => {
    const plans = [1, 2, 3, 4, 5].map((r) => upgradePlan(r, full)!);
    for (const p of plans) {
      expect(p.durationMs).toBeGreaterThanOrEqual(1500);
      expect(p.durationMs).toBeLessThanOrEqual(2000);
    }
    for (let i = 1; i < plans.length; i += 1) {
      expect(plans[i]!.durationMs).toBeGreaterThan(plans[i - 1]!.durationMs);
      expect(plans[i]!.particles).toBeGreaterThan(plans[i - 1]!.particles);
      expect(plans[i]!.rings).toBeGreaterThanOrEqual(plans[i - 1]!.rings);
    }
    expect(plans.map((p) => p.bigRay)).toEqual([false, false, false, false, true]);
    expect(plans[0]!.skySweep).toBe(0);
  });

  it('never washes the field: light stays faint and the plot glow stays under full opacity', () => {
    for (const fx of [full, light]) {
      for (let r = 1; r <= 5; r += 1) {
        const p = upgradePlan(r, fx)!;
        expect(p.skySweep).toBeLessThanOrEqual(0.15);
        expect(p.plotGlow).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('is shorter and lighter at "light"', () => {
    for (let r = 1; r <= 5; r += 1) {
      const a = upgradePlan(r, light)!;
      const b = upgradePlan(r, full)!;
      expect(a.durationMs).toBeLessThan(b.durationMs);
      expect(a.particles).toBeLessThan(b.particles);
      expect(a.rings).toBe(1);
      expect(a.bigRay).toBe(false);
    }
  });

  it('clamps a rank outside 1..5', () => {
    expect(upgradePlan(0, full)).toEqual(upgradePlan(1, full));
    expect(upgradePlan(9, full)).toEqual(upgradePlan(5, full));
  });
});

describe('feedback tables', () => {
  it('a raised cloud tier / garden zone asks for the effect at its rank', () => {
    const c = cloudPresentation({ type: 'CLOUD_TIER_UPGRADED', group: 2, tier: 3 } as never, 'action');
    expect(parseUpgradeVfx(c!.vfx!)).toEqual({ area: 'cloud', group: 2, rank: 3, opened: false });
    const g = gardenPresentation({ type: 'GARDEN_ZONE_UPGRADED', group: 1, tier: 5 } as never, 'action');
    expect(parseUpgradeVfx(g!.vfx!)).toEqual({ area: 'garden', group: 1, rank: 5, opened: false });
  });

  it('a newly opened tier / zone asks for it, a few more plots do not', () => {
    const c = cloudPresentation({ type: 'CLOUD_PLOTS_BOUGHT', plots: 30, tier: 1 } as never, 'action');
    expect(parseUpgradeVfx(c!.vfx!)).toEqual({ area: 'cloud', group: 1, rank: 1, opened: true });
    const g = gardenPresentation({ type: 'GARDEN_PLOTS_BOUGHT', plots: 48, zone: 1 } as never, 'action');
    expect(parseUpgradeVfx(g!.vfx!)).toEqual({ area: 'garden', group: 1, rank: 1, opened: true });
    expect(cloudPresentation({ type: 'CLOUD_PLOTS_BOUGHT', plots: 6 } as never, 'action')!.vfx).toBeUndefined();
    expect(gardenPresentation({ type: 'GARDEN_PLOTS_BOUGHT', plots: 6 } as never, 'action')!.vfx).toBeUndefined();
  });
});
