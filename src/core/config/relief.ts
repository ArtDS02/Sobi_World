// Neighbour's help (DECISIONS PG-1): the only way out of the "no gold, empty trough, nothing to sell"
// soft-lock. Offered only while the farm truly cannot progress on its own. TUNABLE.
export const RELIEF = {
  /** Food units given when the trough, the store and the purse are all empty (a COMMON pig needs ~6). */
  FOOD: 12,
  /** Medicine per sick pig when there is none and no gold for it, capped. */
  MEDICINE_MAX: 3,
  /** An empty farm gets the price of the cheapest pig it may buy, plus food money for this many units. */
  START_FOOD: 8,
} as const;
