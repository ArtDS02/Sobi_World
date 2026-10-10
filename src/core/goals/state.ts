// What the goals keep in the world save (spec V2 §9): the Order Board in the plaza and the daily goals.
// Achievements need no state of their own (counters in progression.stats, claims in progression.claimed).
import { z } from 'zod';

const time = z.number().finite();

export const boardOrderSchema = z.object({
  /** `serial` of the board when it was made; the order is a pure function of it (and the world at that moment). */
  id: z.string().min(1),
  lines: z.array(z.object({ itemId: z.string().min(1), qty: z.number().int().min(1) })).min(1),
  coins: z.number().int().min(0),
  xp: z.number().int().min(0),
  /** Extra item on top of the reward (a small chance, content/shared/orders.json). */
  bonus: z.object({ itemId: z.string().min(1), qty: z.number().int().min(1) }).nullable(),
  createdAt: time,
});
export type BoardOrder = z.infer<typeof boardOrderSchema>;

export const dailyGoalSchema = z.object({
  id: z.string().min(1),
  metric: z.string().min(1),
  target: z.number().int().min(1),
  /** The counter's value when the goal was set: progress is what was done since. */
  start: z.number().min(0),
  coins: z.number().int().min(0),
  reached: z.boolean(),
  claimed: z.boolean(),
});
export type DailyGoal = z.infer<typeof dailyGoalSchema>;

export const goalsSchema = z.object({
  board: z.object({
    /** Orders made so far (the next one's seed). */
    serial: z.number().int().min(0),
    slots: z.array(boardOrderSchema.nullable()),
    /** When the next order may appear; null while every slot is full. */
    nextAt: time.nullable(),
  }),
  daily: z.object({
    /** Local game day the goals belong to; null = none yet. */
    day: z.number().int().nullable(),
    goals: z.array(dailyGoalSchema),
    bonusClaimed: z.boolean(),
  }),
});
export type GoalsState = z.infer<typeof goalsSchema>;

/** A new world: the first order appears at once, the others one every few hours. */
export const initialGoals = (now: number): GoalsState => ({
  board: { serial: 0, slots: [], nextAt: now },
  daily: { day: null, goals: [], bonusClaimed: false },
});
