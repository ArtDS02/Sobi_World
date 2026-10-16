// content/cloud/balance.json — the Cloud's numbers (GAME_BALANCE §9): flower plots, pure water, the cauldron.
import { z } from 'zod';
import { int, itemId, nonNeg, posInt, unit } from '../fields';

export const cloudBalanceFileSchema = z
  .strictObject({
    startPlots: posInt,
    /** Plots on one cloud tier (the scene shows one tier at a time; decision 023). */
    plotsPerTier: posInt,
    /**
     * Steps of owned plots, in order. Up to `plotsPerTier` they grow the first tier; past it every step opens a whole new
     * tier (`plots` a multiple of `plotsPerTier`) and may need a world `level`.
     */
    plotExpansions: z.array(z.strictObject({ plots: posInt, price: nonNeg, level: posInt.optional() })),
    /** Growth speed of a flower not watered with pure water, as a share of a watered one. */
    dryGrowthRate: unit,
    /** Hours a plot stays watered after the player gives it pure water. */
    waterHours: z.number().finite().positive(),
    fertilizer: z.strictObject({ timeFactor: z.number().finite().positive().max(1), bonusYield: int.min(0) }),
    witherAfterHours: z.number().finite().positive(),
    witherYieldFactor: unit,
    /** A night flower picked at night gives this many times its yield. */
    nightYieldFactor: z.number().finite().min(1),
    /** The spring of pure water: level n is `levels[n - 1]` (minutes per unit, how many it stores, price and materials to reach it). */
    spring: z.strictObject({
      levels: z
        .array(z.strictObject({ intervalMin: z.number().finite().positive(), capacity: posInt, price: nonNeg, materials: z.partialRecord(itemId, posInt) }))
        .min(1),
    }),
    cauldron: z.strictObject({ price: nonNeg, maxBatches: posInt }),
    start: z.strictObject({ water: int.min(0) }),
    /** The Area's shop (decision 029): what it sells and the price of one, in Sobi Coin. */
    shop: z.array(z.strictObject({ itemId, price: posInt })).min(1),
    xp: z.strictObject({ plant: nonNeg, water: nonNeg, harvest: nonNeg, craft: nonNeg, fertilize: nonNeg, spring: nonNeg }),
  })
  .superRefine((b, ctx) => {
    const steps = [b.startPlots, ...b.plotExpansions.map((e) => e.plots)];
    if (steps.some((n, i) => i > 0 && n <= steps[i - 1]!)) ctx.addIssue({ code: 'custom', message: 'plotExpansions must ascend' });
    if (b.startPlots > b.plotsPerTier) ctx.addIssue({ code: 'custom', message: 'startPlots must fit on the first tier' });
    if (steps.some((n) => n > b.plotsPerTier && n % b.plotsPerTier !== 0)) ctx.addIssue({ code: 'custom', message: 'plotExpansions past the first tier must open whole tiers (multiples of plotsPerTier)' });
  });
