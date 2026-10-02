// Farm decorations (spec §20.2, DECISIONS PG-3): a gold sink that adds a small happiness bonus to
// every pig (the decorBonus term of §5.4). Each one shows on the farm at its layout placement
// (manifest layout.placements[].decor). TUNABLE.
import type { DecorId } from './ids';

export interface DecorDef {
  id: DecorId;
  /** Artwork id in the manifest. */
  artId: string;
  priceGold: number;
  unlockLevel: number;
  /** Happiness points added to every pig while owned. */
  happyBonus: number;
}

const d = (id: DecorId, artId: string, priceGold: number, unlockLevel: number, happyBonus: number) =>
  ({ id, artId, priceGold, unlockLevel, happyBonus }) satisfies DecorDef;

export const DECORS: Record<DecorId, DecorDef> = {
  DECOR_HAY_BALE: d('DECOR_HAY_BALE', 'prop_hay_bale', 1500, 2, 1),
  DECOR_WHEELBARROW: d('DECOR_WHEELBARROW', 'prop_wheelbarrow', 2500, 3, 1),
  DECOR_SUNFLOWERS: d('DECOR_SUNFLOWERS', 'prop_sunflower', 3000, 4, 1),
  DECOR_FENCE: d('DECOR_FENCE', 'prop_fence_section', 4000, 5, 2),
  DECOR_VEGGIE_PATCH: d('DECOR_VEGGIE_PATCH', 'prop_veggie_patch', 6000, 6, 2),
  DECOR_WINDMILL: d('DECOR_WINDMILL', 'prop_windmill', 15000, 8, 3),
};

export const DECOR_IDS = Object.keys(DECORS) as DecorId[];
