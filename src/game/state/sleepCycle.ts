// Global pig sleep / wake (DECISIONS PS-1): one day/night signal → the rest state of every pig.
// Pure, so the transitions are tested; PigMover plays them (pose tweens, frames, strolls).
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

/** The day/night signal changed (or was re-sent): the transition to start, if any. */
export function onDayNight(s: PigRestState, night: boolean): PigRestState {
  if (night) return isAwake(s) || s === 'WAKING_UP' ? 'FALLING_ASLEEP' : s;
  return s === 'SLEEPING' || s === 'FALLING_ASLEEP' ? 'WAKING_UP' : s;
}

/**
 * A transition finished: FALLING_ASLEEP → SLEEPING, WAKING_UP → IDLE — unless the clock flipped
 * back meanwhile, then the opposite transition starts.
 */
export function onTransitionEnd(s: PigRestState, night: boolean): PigRestState {
  if (s === 'FALLING_ASLEEP') return night ? 'SLEEPING' : 'WAKING_UP';
  if (s === 'WAKING_UP') return night ? 'FALLING_ASLEEP' : 'IDLE';
  return s;
}

export function restFrame(s: PigRestState): RestFrame {
  if (s === 'SLEEPING') return 'sleep';
  return s === 'FALLING_ASLEEP' || s === 'WAKING_UP' ? 'wake' : 'idle';
}

/** Delay before this pig starts a transition: 0..staggerMs, fixed per id. */
export const staggerMs = (idHash: number): number => idHash % (PIG_SLEEP.staggerMs + 1);
