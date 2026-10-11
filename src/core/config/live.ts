// The festivals and the merchant (content/shared/festivals.json, merchant.json, GĐ12).
import { CONTENT } from './content';

export const FESTIVAL_RULES = CONTENT.festivals;
export const FESTIVALS: Readonly<Record<string, (typeof FESTIVAL_RULES.festivals)[number]>> = Object.fromEntries(FESTIVAL_RULES.festivals.map((f) => [f.id, f]));
export const MERCHANT_RULES = CONTENT.merchant;
