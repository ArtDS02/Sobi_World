// Neighbour's help (DECISIONS PG-1): the only way out of the "no gold, empty trough, nothing to sell"
// soft-lock. Offered only while the farm truly cannot progress on its own. content/farm/balance.json
// (`relief`): FOOD units when trough, store and purse are empty; MEDICINE_MAX per sick pig;
// START_FOOD = food money an empty farm gets on top of the cheapest pig.
import { CONTENT } from './content';

export const RELIEF = CONTENT.farmBalance.relief;
