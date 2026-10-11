// The weather as the game asks for it: the sky of "now" in a world (the Admin's switch included). Pure.
import { DAY_MS } from '../../core/clock';
import { WEATHER_RULES } from '../../core/config/weather';
import type { WorldSave } from '../../core/save/world';
import { forecast, liveWeather, type WeatherId } from './weather';

const dayAt = (now: number, dayOffsetMs: number): number => Math.floor((now + dayOffsetMs) / DAY_MS);

/** The weather at `now` in this world. */
export const weatherNow = (world: Pick<WorldSave, 'live'>, now: number, dayOffsetMs: number): WeatherId =>
  liveWeather(dayAt(now, dayOffsetMs), world.live.dev.weather, WEATHER_RULES);

/** Today's and tomorrow's weather in this world. */
export const forecastNow = (world: Pick<WorldSave, 'live'>, now: number, dayOffsetMs: number): { today: WeatherId; tomorrow: WeatherId } =>
  forecast(dayAt(now, dayOffsetMs), world.live.dev.weather, WEATHER_RULES);
