// The tier side of the Cloud's bulk buttons (decision 028): they act on the tier on screen. Pure; unit-tested.
import type { WorldSave } from '../../../core/save/world';
import { PLOTS_PER_TIER, tierOf } from '../logic/config/content';
import { cloudOf } from '../logic/save/lens';

/** The tier the bulk buttons act on: the one on screen, or the highest owned before the scene has drawn. */
export const actingTier = (world: WorldSave, viewed: number): number => (viewed >= 0 ? viewed : tierOf(cloudOf(world).plots.length - 1));

/** Owned plots of `tier`. */
const tierPlots = (world: WorldSave, tier: number): number[] => {
  const first = tier * PLOTS_PER_TIER;
  return cloudOf(world).plots.slice(first, first + PLOTS_PER_TIER).map((_, k) => first + k);
};

/** Plots of `tier` with nothing growing on them. */
export const emptyIn = (world: WorldSave, tier: number): number[] => tierPlots(world, tier).filter((i) => cloudOf(world).plots[i]!.cropId === null);

/** Plots of `tier` whose flower is still growing and has no fertiliser yet. */
export const unfertilizedIn = (world: WorldSave, tier: number): number[] =>
  tierPlots(world, tier).filter((i) => {
    const p = cloudOf(world).plots[i]!;
    return p.cropId !== null && p.ripeAt === null && !p.fertilized;
  });
