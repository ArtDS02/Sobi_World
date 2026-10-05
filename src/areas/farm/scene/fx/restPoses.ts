// Night rest poses of a pig (DECISIONS PS-1): settling down while falling asleep, slow breathing
// while asleep, the stretch while waking up. They tween PigMover's pose multipliers only.
import type * as Phaser from 'phaser';
import { PIG_SLEEP } from '../../../../core/config/dayNight';
import type { PigRestState } from '../state/sleepCycle';

export interface RestPoseTarget {
  bx: number;
  by: number;
}

/**
 * Starts the pose of `state` on `pose` and returns its tween (null with reduceMotion: the pose is
 * set at once). `phase` offsets the sleep breathing so pigs do not breathe in unison.
 */
export function playRestPose(
  scene: Phaser.Scene,
  pose: RestPoseTarget,
  state: PigRestState,
  phase: number,
  reduceMotion: boolean,
  onChange: () => void,
): Phaser.Tweens.Tween | null {
  const S = PIG_SLEEP;
  if (state === 'SLEEPING' || reduceMotion) {
    const asleep = state === 'SLEEPING';
    pose.bx = asleep ? S.settle.bx : 1;
    pose.by = asleep ? S.settle.by : 1;
  }
  if (reduceMotion) return null;
  const base = { targets: pose, onUpdate: onChange };
  if (state === 'FALLING_ASLEEP') {
    return scene.tweens.add({
      ...base,
      bx: S.settle.bx,
      by: S.settle.by,
      duration: S.fallAsleepMs,
      ease: 'Sine.easeInOut',
    });
  }
  if (state === 'WAKING_UP') {
    return scene.tweens.add({
      ...base,
      bx: S.stretch.bx,
      by: S.stretch.by,
      duration: S.wakeUpMs / 2,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        pose.bx = 1;
        pose.by = 1;
      },
    });
  }
  return scene.tweens.add({
    ...base,
    by: S.settle.by * (1 + S.breathe.amount),
    duration: S.breathe.ms,
    delay: phase % S.breathe.ms,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
