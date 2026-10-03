// Pig rest states (DECISIONS PS-1, PL-1): each pig's brain (state/pigBrain.ts) decides when it
// falls asleep and wakes up; PigMover plays the poses and the frames follow restFrame.
import { PIG_SLEEP, type DayPhase } from '../../core/config/dayNight';

export type PigRestState = 'IDLE' | 'WALKING' | 'FALLING_ASLEEP' | 'SLEEPING' | 'WAKING_UP';

/** Which frame of the species art the rest state shows. */
export type RestFrame = 'idle' | 'wake' | 'sleep';

/** Whether pigs sleep in this phase (the farm's shown phase, preview included). */
export const isSleepPhase = (phase: DayPhase): boolean => PIG_SLEEP.phases.includes(phase);

/** A pig that appears (spawn, birth, load) at night is already asleep; by day it stands. */
export const initialRest = (night: boolean): PigRestState => (night ? 'SLEEPING' : 'IDLE');

/** Awake states: the pig may stroll (IDLE ↔ WALKING). */
export const isAwake = (s: PigRestState): boolean => s === 'IDLE' || s === 'WALKING';

export function restFrame(s: PigRestState): RestFrame {
  if (s === 'SLEEPING') return 'sleep';
  return s === 'FALLING_ASLEEP' || s === 'WAKING_UP' ? 'wake' : 'idle';
}
