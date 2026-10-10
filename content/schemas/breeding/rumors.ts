// content/breeding/rumors.json — the Breeder's gossip (spec V2 §9): vague hints about recipes the player has not found
// and general tips. The hint names families and rarities, never the result's species. Placeholders: {parentA},
// {parentB} (a clue about each parent), {rarity}, {theme}.
import { z } from 'zod';
import { text } from '../fields';

export const rumorsFileSchema = z.strictObject({
  /** About one undiscovered special recipe. */
  recipeTemplates: z.array(text).min(1),
  /** Word for each rarity, used by {rarity}. */
  rarityWords: z.strictObject({
    COMMON: text,
    UNCOMMON: text,
    RARE: text,
    EPIC: text,
    LEGENDARY: text,
  }),
  /** When every recipe is known, or none has been drawn. */
  noNews: z.array(text).min(1),
  /** General tips, one per day after the recipe hint. */
  tips: z.array(text).min(1),
});
