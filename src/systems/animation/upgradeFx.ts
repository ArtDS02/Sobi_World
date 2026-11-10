// The effect played when a cloud tier / garden zone is raised a rank, or a new tier / zone opens (decision 057, B6), as plain
// data: which effect an event asks for (an AreaVfx the feedback tables hand to the FeedbackDirector) and what the sequence holds
// for a rank at an effects level. Presentation only; the scenes draw it (ui/world/upgradeBurst.ts). A higher rank is grander, but
// nothing ever lights the whole field: light stays thin, tinted, and in the sky.
import type { AreaVfx } from '../../core/events';
import type { EffectsScale } from './rankAtmosphere';

export const UPGRADE_FX = 'fx_area_upgrade';

export type UpgradeArea = 'cloud' | 'garden';

export interface UpgradeFxTarget {
  area: UpgradeArea;
  /** The cloud tier / garden zone, 0-based. */
  group: number;
  /** The rank it reached (1..5); 1 for a tier / zone that was just opened. */
  rank: number;
  /** True when the tier / zone was opened (not raised). */
  opened: boolean;
}

/** The AreaVfx of an upgrade: the scene finds the tier / zone and its rank in `at`. */
export const upgradeVfx = (t: UpgradeFxTarget): AreaVfx => ({ fx: UPGRADE_FX, at: `${t.area}:${t.group}:${t.rank}:${t.opened ? 'open' : 'rank'}` });

export function parseUpgradeVfx(vfx: AreaVfx): UpgradeFxTarget | null {
  if (vfx.fx !== UPGRADE_FX || !vfx.at) return null;
  const [area, group, rank, kind] = vfx.at.split(':');
  const g = Number(group);
  const r = Number(rank);
  if ((area !== 'cloud' && area !== 'garden') || !Number.isInteger(g) || g < 0 || !Number.isInteger(r) || r < 1 || r > 5) return null;
  return { area, group: g, rank: r, opened: kind === 'open' };
}

export interface UpgradePlan {
  /** The whole sequence, ms (1.5–2 s at full). */
  durationMs: number;
  /** Rings that spread from the frame of the plots. */
  rings: number;
  /** Delay between two plots lighting up in turn, ms. */
  plotStepMs: number;
  /** Peak opacity of the small tinted glow on each plot (never white, never larger than the plot). */
  plotGlow: number;
  /** Petals / leaves / fireflies that rise and scatter. */
  particles: number;
  /** A faint sweep of light across the sky above the plots (0 = none): its peak opacity. */
  skySweep: number;
  /** Rank 5 only: one wide ray sweeping the sky. Still thin and only in the sky. */
  bigRay: boolean;
}

/**
 * The sequence for `rank` at an effects level; null = no moving effect at all (effects off, or reduced motion): the toast and the
 * sound still play, they are not part of this.
 */
export function upgradePlan(rank: number, fx: Pick<EffectsScale, 'upgrade' | 'particles' | 'light'>): UpgradePlan | null {
  if (fx.upgrade === 'none') return null;
  const r = Math.min(Math.max(Math.round(rank), 1), 5);
  if (fx.upgrade === 'short') {
    return { durationMs: 900, rings: 1, plotStepMs: 25, plotGlow: 0.3, particles: Math.ceil((6 + 4 * r) * fx.particles), skySweep: r >= 3 ? 0.06 * fx.light : 0, bigRay: false };
  }
  return {
    durationMs: 1500 + 125 * (r - 1),
    rings: 1 + Math.floor(r / 2),
    plotStepMs: 45,
    plotGlow: 0.5,
    particles: Math.ceil((8 + 6 * r) * fx.particles),
    skySweep: r >= 2 ? (0.06 + 0.015 * r) * fx.light : 0,
    bigRay: r >= 5,
  };
}
