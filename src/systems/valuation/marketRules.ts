// The market's rules as the game uses them: the valuation file's up / down groups and the visiting merchant's demand (GĐ12).
import { CONTENT } from '../../core/config/content';
import type { MarketRules } from './market';

export const MARKET_RULES: MarketRules = {
  ...CONTENT.valuation.market,
  merchant: { visitChance: CONTENT.merchant.visitChance, demandBonus: CONTENT.merchant.demandBonus },
};
