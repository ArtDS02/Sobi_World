// The weather of a game day (spec V2 §10, GĐ12). A pure function of the day number, so every mode of the simulation, every run
// of the game and the forecast see the same sky; nothing about it is saved. It only ever offers an opportunity: rain grows the
// crops faster, rain at night brings rare fish, fog makes fish bite, a rainbow helps a mutation. Core content files carry the numbers.
import type { z } from 'zod';
import type { weatherFileSchema } from '../../../content/schemas/shared/weather';
import { WEATHER_VALUES, type WeatherId } from '../../../content/schemas/vocab';
import { DAY_MS } from '../../core/clock';
import type { SeasonId } from '../../core/config/seasons';
import { seasonOfMonth } from '../../core/engine/season';
import { hashSeed, mulberry32 } from '../../core/rng';

export { WEATHER_VALUES, type WeatherId };

export type WeatherRules = z.infer<typeof weatherFileSchema>;

type BaseWeather = Exclude<WeatherId, 'rainbow'>;
const BASE: readonly BaseWeather[] = ['sunny', 'rainy', 'foggy', 'snowy'];

/** Local calendar month (1–12) of a game day number (days since 1970-01-01). Pure civil-calendar arithmetic. */
export function monthOfDay(day: number): number {
  const z = day + 719_468;
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  return mp < 10 ? mp + 3 : mp - 9;
}

export const seasonOfDay = (day: number): SeasonId => seasonOfMonth(monthOfDay(day));

/** The weather before a rainbow can replace it: one weighted draw seeded by the day. */
export function baseWeather(day: number, rules: WeatherRules): BaseWeather {
  const weights = rules.weights[seasonOfDay(day)];
  const total = BASE.reduce((n, id) => n + weights[id], 0);
  let roll = mulberry32(hashSeed('weather', day)).next() * total;
  for (const id of BASE) {
    roll -= weights[id];
    if (roll < 0) return id;
  }
  return 'sunny';
}

/** The weather of game day `day`: a clear or foggy day after a rainy one may become a rainbow. */
export function weatherOfDay(day: number, rules: WeatherRules): WeatherId {
  const base = baseWeather(day, rules);
  if ((base === 'sunny' || base === 'foggy') && baseWeather(day - 1, rules) === 'rainy') {
    if (mulberry32(hashSeed('rainbow', day)).next() < rules.rainbow.afterRainChance) return 'rainbow';
  }
  return base;
}

/** A forced weather (the Admin's test switch, kept in the save's `live.dev`) wins over the calendar's. */
export const liveWeather = (day: number, forced: string | null, rules: WeatherRules): WeatherId =>
  (WEATHER_VALUES as readonly string[]).includes(forced ?? '') ? (forced as WeatherId) : weatherOfDay(day, rules);

/** Today's and tomorrow's weather (the forecast is exact: the calendar is fixed). */
export const forecast = (day: number, forced: string | null, rules: WeatherRules): { today: WeatherId; tomorrow: WeatherId } => ({
  today: liveWeather(day, forced, rules),
  tomorrow: liveWeather(day + 1, forced, rules),
});

/** A stretch of time inside one game day. */
export interface DaySegment {
  from: number;
  to: number;
  day: number;
}

/** `[from, to]` cut at every local midnight: the weather is the same inside a segment. Empty when `to <= from`. */
export function daySegments(from: number, to: number, dayOffsetMs: number): DaySegment[] {
  const out: DaySegment[] = [];
  let t = from;
  while (t < to) {
    const day = Math.floor((t + dayOffsetMs) / DAY_MS);
    const end = Math.min(to, (day + 1) * DAY_MS - dayOffsetMs);
    out.push({ from: t, to: end, day });
    t = end;
  }
  return out;
}

// ---- What each weather gives ---------------------------------------------------------------------------------------

/** Crops: a rainy day waters every plot and speeds the growth up. */
export const cropWeather = (w: WeatherId, rules: WeatherRules): { rate: number; watered: boolean } =>
  w === 'rainy' ? { rate: rules.effects.rain.growthRate, watered: true } : { rate: 1, watered: false };

/** The rod: rain at night makes rare fish bite more (`rareLuck`, ×), fog makes every cast easier (`scoreBonus`, +). */
export const fishingWeather = (w: WeatherId, night: boolean, rules: WeatherRules): { rareLuck: number; scoreBonus: number } => ({
  rareLuck: w === 'rainy' && night ? rules.effects.rainNight.rareLuck : 1,
  scoreBonus: w === 'foggy' ? rules.effects.fog.biteBonus : 0,
});

/** Breeding: the mutation chance a rainbow adds. */
export const mutationWeather = (w: WeatherId, rules: WeatherRules): number => (w === 'rainbow' ? rules.effects.rainbow.mutationBoost : 0);
