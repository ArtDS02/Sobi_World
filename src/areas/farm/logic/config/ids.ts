// The farm's id unions: species and decorations (generated from content/farm by
// `npm run content:ids`), and the farm's transaction and stat kinds.
import { BREED_ID_VALUES, DECOR_ID_VALUES } from '../../../../../content/schemas/ids.generated';
import { STAT_ID_VALUES } from '../../../../../content/schemas/vocab';

export { BREED_ID_VALUES, DECOR_ID_VALUES, STAT_ID_VALUES };

export const TRANSACTION_TYPE_VALUES = [
  'INITIAL_GOLD',
  'SHOP_PURCHASE',
  'PIG_PURCHASE',
  'PIG_SELL',
  'BREEDING_FEE',
  'SLOT_PURCHASE',
  'TROUGH_FILL',
  'SKIN_PURCHASE', // legacy history only: outfits were removed in save v5 (DECISIONS A2-1)
  'ORDER_REWARD',
  'DISCOVERY_BONUS',
  'SKIN_REFUND', // save migration refunds: v2 -> v3 species skins, v4 -> v5 outfits (A2-1)
  'GIFT_REWARD', // gift box opened on the farm (U06)
  'ADMIN_ADJUST', // gold set by the dev admin dashboard's user editor (DECISIONS AD-1)
  'RELIEF', // neighbour's help when the farm is stuck (DECISIONS PG-1)
  'DAILY_REWARD', // daily login reward (PG-2)
  'ACHIEVEMENT_REWARD', // achievement claimed (PG-2)
  'DECOR_PURCHASE', // farm decoration bought (PG-3)
  'ITEM_SELL', // items sold from the bag (GĐ2: manure)
  'TROUGH_UPGRADE', // the trough raised a level (GĐ2)
] as const;

export type BreedId = (typeof BREED_ID_VALUES)[number];
export type DecorId = (typeof DECOR_ID_VALUES)[number];
export type TransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];
export type StatId = (typeof STAT_ID_VALUES)[number];
