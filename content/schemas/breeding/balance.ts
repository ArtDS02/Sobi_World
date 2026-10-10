// content/breeding/balance.json — the numbers of advanced breeding (GAME_BALANCE §4): trait inheritance, mutation,
// pity, the family tree and the breeder's rumours. Percentages are 0..100.
import { z } from 'zod';
import { percent, posInt } from '../fields';

export const breedingBalanceFileSchema = z.strictObject({
  /** Traits a creature can hold, hidden one included. */
  maxTraits: posInt,
  /** Each trait of each parent passes to the child with this chance (a trait both parents have gets two rolls). */
  inheritChance: percent,
  /** Chance of one extra COMMON trait the parents did not have. */
  newTraitChance: percent,
  /** A RARE / EPIC trait is hidden with this chance (at most one hidden per creature). */
  hiddenChance: percent,
  mutation: z.strictObject({
    /** Base chance a birth mutates: the child gains one RARE or EPIC trait. */
    base: percent,
    /** Share of mutations that give an EPIC trait instead of a RARE one. */
    epicShare: percent,
    /** The chance never goes above this, whatever the boosts. */
    cap: percent,
  }),
  pity: z.strictObject({
    /** Percentage points added to the chance of a Rare+ child after each breeding that could have given one and did not. */
    step: percent,
    /** Highest pity. */
    cap: percent,
    /** Species of this rarity or above count as "Rare+". */
    fromRarity: z.enum(['UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']),
  }),
  /** Ancestor levels kept in a family tree (1 = parents, 2 = + grandparents…). */
  lineageDepth: z.number().int().min(1).max(5),
  rumors: z.strictObject({
    /** Rumours shown per game day. */
    perDay: posInt,
  }),
});
