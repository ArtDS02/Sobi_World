// Farm decorations (spec §20.2, DECISIONS PG-3): a gold sink that adds a small happiness bonus to
// every pig (the decorBonus term of §5.4). Each one shows on the farm at its layout placement
// (manifest layout.placements[].decor). content/farm/decor.json. TUNABLE.
import { byId, CONTENT } from './content';
import { DECOR_ID_VALUES, type DecorId } from './ids';

export interface DecorDef {
  id: DecorId;
  /** Artwork id in the manifest. */
  artId: string;
  priceGold: number;
  unlockLevel: number;
  /** Happiness points added to every pig while owned. */
  happyBonus: number;
}

export const DECORS: Record<DecorId, DecorDef> = byId('farm/decor.json', CONTENT.decor.decor, DECOR_ID_VALUES);

export const DECOR_IDS = Object.keys(DECORS) as DecorId[];
