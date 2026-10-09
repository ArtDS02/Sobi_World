// The market of a day (GAME_BALANCE §2.5): a price factor drawn once per game day, the same for every
// sale of that day and for every run of the game (seeded by the day number). Pure.
import { hashSeed, mulberry32 } from '../../core/rng';

export interface MarketEntry {
  factor: number;
  weight: number;
}

export function marketFactor(day: number, market: readonly MarketEntry[]): number {
  const total = market.reduce((n, m) => n + m.weight, 0);
  let roll = mulberry32(hashSeed('market', day)).next() * total;
  for (const m of market) {
    roll -= m.weight;
    if (roll < 0) return m.factor;
  }
  return market[market.length - 1]!.factor;
}
