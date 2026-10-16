// content/garden/balance.json — the Garden's numbers (GAME_BALANCE §5, §7): plots, watering, wilting,
// the sprinkler, the two workshops and the level table.
import { z } from 'zod';
import { assetId, int, itemId, nonNeg, posInt, text, unit } from '../fields';

const building = z.strictObject({ nameVi: text, descVi: text, price: nonNeg, art: assetId });

export const gardenBalanceFileSchema = z
  .strictObject({
    startPlots: posInt,
    /** Plots of one field zone (the scene shows one zone at a time, GĐ14 decision 028). */
    plotsPerZone: posInt,
    /**
     * Each step: the plot count it reaches and its price (ascending). Up to `plotsPerZone` they grow the first zone; past it
     * every step opens a whole new zone (`plots` a multiple of `plotsPerZone`) and may need a world `level`.
     */
    plotExpansions: z.array(z.strictObject({ plots: posInt, price: nonNeg, level: posInt.optional() })),
    /** Growth speed of an unwatered plot, as a share of a watered one. */
    dryGrowthRate: unit,
    /** Hours a plot stays watered after the player waters it. */
    waterHours: z.number().finite().positive(),
    fertilizer: z.strictObject({
      /** Growth time multiplier (0.75 = 25% shorter). */
      timeFactor: z.number().finite().positive().max(1),
      bonusYield: int.min(0),
    }),
    /** A ripe crop left this long wilts: its yield drops (it is never lost). */
    witherAfterHours: z.number().finite().positive(),
    witherYieldFactor: unit,
    /** Sprinkler levels: plots watered automatically (the first N plots), the price to reach it and the materials (the Aquarium's scales and pearls) it takes. */
    sprinkler: z.array(z.strictObject({ plots: posInt, price: nonNeg, materials: z.partialRecord(itemId, posInt).optional() })).min(1),
    buildings: z.strictObject({ mill: building, composter: building }),
    /** The Area's shop (decision 029): what it sells and the price of one, in Sobi Coin. */
    shop: z.array(z.strictObject({ itemId, price: posInt })).min(1),
    /** Most batches of one recipe queued at once. */
    maxBatches: posInt,
    xp: z.strictObject({ plant: nonNeg, water: nonNeg, harvest: nonNeg, craft: nonNeg, fertilize: nonNeg }),
  })
  .superRefine((b, ctx) => {
    const steps = [b.startPlots, ...b.plotExpansions.map((e) => e.plots)];
    if (steps.some((n, i) => i > 0 && n <= steps[i - 1]!)) ctx.addIssue({ code: 'custom', message: 'plotExpansions must ascend' });
    if (b.startPlots > b.plotsPerZone) ctx.addIssue({ code: 'custom', message: 'startPlots must fit in the first zone' });
    if (steps.some((n) => n > b.plotsPerZone && n % b.plotsPerZone !== 0)) ctx.addIssue({ code: 'custom', message: 'plotExpansions past the first zone must open whole zones (multiples of plotsPerZone)' });
    if (b.sprinkler.some((s, i) => i > 0 && s.plots <= b.sprinkler[i - 1]!.plots)) {
      ctx.addIssue({ code: 'custom', message: 'sprinkler levels must cover more plots each' });
    }
  });
