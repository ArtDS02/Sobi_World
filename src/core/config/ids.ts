// Id unions shared by every Area: items (generated from content/shared by `npm run content:ids`) and
// genders. Each Area keeps its own (the farm: areas/farm/logic/config/ids.ts).
import { ITEM_ID_VALUES } from '../../../content/schemas/ids.generated';
import { GENDER_VALUES } from '../../../content/schemas/vocab';

export { GENDER_VALUES, ITEM_ID_VALUES };

export type Gender = (typeof GENDER_VALUES)[number];
export type ItemId = (typeof ITEM_ID_VALUES)[number];
