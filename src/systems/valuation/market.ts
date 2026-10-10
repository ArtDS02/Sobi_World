// The market of a day (spec V2 §9, GAME_BALANCE §8): each game day two groups of goods pay more and one pays less,
// drawn from the day's number alone — the same for every sale of that day and for every run of the game. Pure.
import { MARKET_GROUP_VALUES, type MarketGroup } from '../../../content/schemas/vocab';
import { hashSeed, mulberry32 } from '../../core/rng';

export { MARKET_GROUP_VALUES, type MarketGroup };

export interface MarketRules {
  up: { count: number; factor: number };
  down: { count: number; factor: number };
}

export interface DayMarket {
  factors: Readonly<Record<MarketGroup, number>>;
  up: readonly MarketGroup[];
  down: readonly MarketGroup[];
}

/** The market of game day `day`: groups shuffled by the day's seed, the first ones up, the next one(s) down. */
export function dailyMarket(day: number, rules: MarketRules): DayMarket {
  const rng = mulberry32(hashSeed('market', day));
  const order = [...MARKET_GROUP_VALUES];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const up = order.slice(0, rules.up.count);
  const down = order.slice(rules.up.count, rules.up.count + rules.down.count);
  const factors = Object.fromEntries(
    MARKET_GROUP_VALUES.map((g) => [g, up.includes(g) ? rules.up.factor : down.includes(g) ? rules.down.factor : 1]),
  ) as Record<MarketGroup, number>;
  return { factors, up, down };
}

/** The group an item sells in (by its category); null = the market does not move its price. */
export function marketGroupOf(category: string): MarketGroup | null {
  switch (category) {
    case 'CROP':
    case 'FLOWER':
      return 'CROPS';
    case 'FOOD':
      return 'FOOD';
    case 'MATERIAL':
      return 'MATERIALS';
    default:
      return null;
  }
}
