// The sky over the dock (GĐ12): what today's weather does to a cast. The weather is the world's; the Area only reads it.
import { WEATHER_RULES } from '../../../core/config/weather';
import type { WorldSave } from '../../../core/save/world';
import { fishingWeather } from '../../../systems/weather/weather';
import { weatherNow } from '../../../systems/weather/live';
import type { FishingSky } from './fishing';

export const skyForRod = (world: Pick<WorldSave, 'live'>, now: number, dayOffsetMs: number, night: boolean): FishingSky =>
  fishingWeather(weatherNow(world, now, dayOffsetMs), night, WEATHER_RULES);
