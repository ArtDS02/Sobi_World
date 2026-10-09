// Economy model for `npm run sim:economy` (spec §6.4, §14.7). Pure: runs the real core engine
// (trough + advancePig + pricing) on synthetic farms, so a balance edit shows up here unchanged.
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import type { BreedId } from '../../src/areas/farm/logic/config/ids';
import { ITEMS } from '../../src/core/config/items';
import { advanceWithTrough } from '../../src/areas/farm/logic/trough';
import { sellPrice } from '../../src/areas/farm/logic/pricing';
import { sequenceRng } from '../../src/core/rng';
import type { Pig } from '../../src/areas/farm/logic/types';

export const HAPPINESS_LEVELS = [0, 50, 100] as const;
export type HappinessLevel = (typeof HAPPINESS_LEVELS)[number];

/** Seconds per simulated tick: the store ticks every second, 60 s keeps the sim fast and exact. */
const STEP_SEC = 60;
/** The run measures feeding alone: the world is always "new", so the new-world protection keeps every pig from falling ill. */
const ALWAYS_NEW_WORLD = 1e15;
const NO_SICKNESS = () => sequenceRng([0.999999]);

const baby = (breed: BreedId): Pig => ({
  id: 'sim',
  slotIndex: 0,
  breed,
  name: 'sim',
  gender: 'FEMALE',
  growthProgress: 0,
  hunger: BALANCE.HUNGER_MAX,
  cleanliness: BALANCE.CLEAN_MAX,
  isSick: false,
  pregnancy: null,
  lastTickedAt: 0,
  createdAt: 0,
});

/**
 * Food units one pig eats from the trough from birth to adult, ticking like the game does. The
 * meal due at the very instant of adulthood counts (spec §6.4: PINK = 6), so the pig is sold full;
 * a tick sees a meal only once its due time is strictly inside the tick, hence the last tick.
 */
export function foodToAdult(breed: BreedId): number {
  const start = 10_000; // a trough that never runs dry
  let pigs = [baby(breed)];
  let trough = { food: start, capacity: start, lastResolvedAt: 0 };
  const rng = NO_SICKNESS();
  const lastTick = BREEDS[breed].growthSec + STEP_SEC;
  for (let t = STEP_SEC; t <= lastTick; t += STEP_SEC) {
    ({ pigs, trough } = advanceWithTrough({ pigs, trough }, t * 1000, rng, 0, 0, ALWAYS_NEW_WORLD));
  }
  if (pigs[0]!.growthProgress < 100) throw new Error(`${breed} not adult on a full trough`);
  return start - trough.food;
}

/** Growth reached with an empty trough and no feeding (spec §6.4: PINK stalls at 33.33%). */
export function stallGrowth(breed: BreedId): number {
  const pigs = [baby(breed)];
  const trough = { food: 0, capacity: BALANCE.START_TROUGH_CAPACITY, lastResolvedAt: 0 };
  const end = BREEDS[breed].growthSec * 2 * 1000;
  return advanceWithTrough({ pigs, trough }, end, NO_SICKNESS(), 0, 0, ALWAYS_NEW_WORLD).pigs[0]!.growthProgress;
}

/** Sell price at a happiness level, through the real pricing (hunger = cleanliness = level). */
export const priceAt = (breed: BreedId, happy: HappinessLevel): number =>
  sellPrice({ breed, hunger: happy, cleanliness: happy, isSick: false });

/** What a pig costs to get: shop price, or the breeding fee for breeds that can only be bred. */
export const acquireCost = (breed: BreedId): number =>
  BREEDS[breed].buyGold ?? BALANCE.BREEDING_FEE;

export interface BreedEconomy {
  breed: BreedId;
  sellGold: number;
  growthHours: number;
  food: number;
  foodCost: number;
  acquire: number;
  /** Net gold per hour per slot at happiness 0 / 50 / 100. */
  perHour: Record<HappinessLevel, number>;
  /** perHour[100] / perHour[0]. */
  careRatio: number;
  /** Bought in the shop; the §14.7 gate applies to these (DECISIONS R08-1). */
  gated: boolean;
}

export function breedEconomy(breed: BreedId): BreedEconomy {
  const def = BREEDS[breed];
  const growthHours = def.growthSec / 3600;
  const food = foodToAdult(breed);
  const foodCost = food * ITEMS.FOOD_BASIC.priceGold;
  const acquire = acquireCost(breed);
  const net = (h: HappinessLevel) => (priceAt(breed, h) - acquire - foodCost) / growthHours;
  const perHour = { 0: net(0), 50: net(50), 100: net(100) };
  return {
    breed,
    sellGold: def.sellGold,
    growthHours,
    food,
    foodCost,
    acquire,
    perHour,
    careRatio: perHour[100] / perHour[0],
    gated: def.buyGold !== null,
  };
}

/** §14.7 gate: every shop-bought breed earns at least 2x per hour when cared for. */
export const CARE_RATIO_MIN = 2;
export const gateFailures = (rows: BreedEconomy[]): BreedEconomy[] =>
  rows.filter((r) => r.gated && !(r.perHour[100] >= CARE_RATIO_MIN * r.perHour[0]));

/**
 * Hours of play to afford `cost` while running `slots` PINK pigs at happiness 100 — the baseline
 * income a new player has (only PINK is in the shop).
 */
export function hoursToAfford(cost: number, slots: number): number {
  const rate = breedEconomy('PIG_EARTH_PINK').perHour[100] * slots;
  return rate > 0 ? cost / rate : Infinity;
}
