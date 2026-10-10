// The goals' numbers (content/shared/orders.json, goals.json, codex.json, achievements.json).
import { CONTENT } from './content';

export const ORDER_BOARD = CONTENT.orders;
export const DAILY_GOALS = CONTENT.goals.daily;
export const CODEX = CONTENT.codex;
export const NPCS = CONTENT.npcs.npcs;
/** The guide of an Area (station NPCs are not guides). */
export const npcOf = (areaId: string) => NPCS.find((n) => n.area === areaId && n.station === undefined);
/** The NPC standing at a station, e.g. the Breeder. */
export const npcAt = (station: 'breeding') => NPCS.find((n) => n.station === station);
export const ACHIEVEMENTS = CONTENT.achievements.achievements;
export type AchievementDef = (typeof ACHIEVEMENTS)[number];
