// Timed gift boxes on the farm (U06, UPDATE_AUDIT.md §6): content/farm/gifts.json. One farm-wide timer,
// never one per pig; rarer herds wait a little longer (INTERVAL_FACTOR, averaged over the herd) but get
// more per box (POWER per pig, a baby counts BABY_SHARE). TUNABLE.
import { CONTENT } from './content';

export const GIFTS = CONTENT.gifts;
