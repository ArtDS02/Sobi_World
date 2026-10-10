// The goals' numbers (content/shared/orders.json, goals.json, codex.json, achievements.json).
import { CONTENT } from './content';

export const ORDER_BOARD = CONTENT.orders;
export const DAILY_GOALS = CONTENT.goals.daily;
export const CODEX = CONTENT.codex;
export const ACHIEVEMENTS = CONTENT.achievements.achievements;
export type AchievementDef = (typeof ACHIEVEMENTS)[number];
