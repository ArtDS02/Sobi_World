// Pig visual state (spec §11, art standard §3): derived from the pig, the feedback animation that
// is playing and whether the pig is wandering — never stored. Pure, so the priority is tested.
import type { Pig } from '../../core/types';
import type { AnimationId } from '../feedback/feedbackTable';

export type VisualState =
  'idle' | 'walk' | 'eat' | 'clean' | 'sleep' | 'happy' | 'sick' | 'pregnant';

/** States a feedback animation puts the pig in for its duration (§11.3). */
export type FeedbackState = Extract<VisualState, 'eat' | 'clean' | 'happy'>;

/** A feedback state that holds until `until` (same clock as `now`). */
export interface ActiveFeedback {
  state: FeedbackState;
  until: number;
}

/** What the pig's own body is doing: standing, strolling or napping (PigMover). */
export type PigMotion = 'still' | 'walk' | 'nap';

/** Which feedback animations are pig visual states; the rest are one-off tweens (popIn, grow). */
export const FEEDBACK_STATE: Partial<Record<AnimationId, FeedbackState>> = {
  eat: 'eat',
  clean: 'clean',
  happy: 'happy',
};

/**
 * Priority: a running feedback state (the player just acted) > sick > pregnant > sleep > walk >
 * idle. Only a healthy, free pig naps (PigMover decides, DECISIONS R09B-1); a nap reported for a
 * sick or pregnant pig is ignored.
 */
export function pigVisualState(
  pig: Pick<Pig, 'isSick' | 'pregnancy'>,
  now: number,
  feedback: ActiveFeedback | null,
  motion: PigMotion = 'still',
): VisualState {
  if (feedback && now < feedback.until) return feedback.state;
  if (pig.isSick) return 'sick';
  if (pig.pregnancy) return 'pregnant';
  if (motion === 'nap') return 'sleep';
  return motion === 'walk' ? 'walk' : 'idle';
}

/**
 * Wandering is for a healthy, free pig only: it pauses while selected or while a feedback state
 * plays, and sick / pregnant / sleeping pigs rest (spec §11: pauses during interaction).
 */
export function canWander(
  pig: Pick<Pig, 'isSick' | 'pregnancy'>,
  now: number,
  feedback: ActiveFeedback | null,
  selected: boolean,
): boolean {
  if (selected) return false;
  const state = pigVisualState(pig, now, feedback);
  return state === 'idle';
}
