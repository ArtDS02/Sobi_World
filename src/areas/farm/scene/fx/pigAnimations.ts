// Feedback animations of one pig (spec §11 table, §11.3): tweens on the pig's motion offsets.
// eat / clean / happy are visual states (state/pigVisualState.ts); the sprite holds them.
import type * as Phaser from 'phaser';
import { FEEDBACK } from '../../../../core/config/feedback';
import type { AnimationId } from '../feedback/feedbackTable';
import type { PigMover } from '../prefabs/PigMover';

const T = FEEDBACK.TWEEN;

/** How long each feedback state holds (yoyo tweens run there and back). */
export const HOLD_MS: Record<'eat' | 'clean' | 'happy', number> = {
  eat: T.eat.ms * 2 * (T.eat.repeat + 1),
  clean: T.clean.ms * 2 * (T.clean.repeat + 1),
  happy: T.happy.ms * 2 * (T.happy.repeat + 1),
};

/** Feedback offsets: dy (px, up is negative), scale multiplier, angle (deg), alpha, brightness. */
export interface Motion {
  dx: number;
  dy: number;
  scale: number;
  angle: number;
  alpha: number;
  bright: number;
}

export interface TweenablePig {
  motion: Motion;
  mover: PigMover;
  layout(): void;
  tween(config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>): void;
  reset(key: keyof Motion): void;
  /** Trough x in design px, or null. */
  troughX(): number | null;
}

/** Starts the tweens of `animation` after `delay` ms. `from`: popIn starts there. */
export function playPigAnimation(
  p: TweenablePig,
  animation: AnimationId,
  delay: number,
  from?: { x: number; y: number },
) {
  switch (animation) {
    case 'bounce':
      p.motion.dy = -T.bounce.dropPx;
      p.layout();
      p.tween({ dy: 0, duration: T.bounce.ms, ease: 'Bounce.easeOut', delay });
      break;
    case 'happy': // hop (spec §11: happy = hop tween + particles from the event row)
      p.tween({
        dy: -T.happy.px,
        duration: T.happy.ms,
        yoyo: true,
        repeat: T.happy.repeat,
        ease: 'Quad.easeOut',
        delay,
      });
      break;
    case 'eat': {
      // Head down ~8° toward the trough (spec §11 table).
      const tx = p.troughX();
      const pos = p.mover.pos;
      if (tx !== null && pos) p.mover.face(tx < pos.x);
      p.tween({
        angle: T.eat.deg,
        duration: T.eat.ms,
        yoyo: true,
        repeat: T.eat.repeat,
        delay,
      });
      break;
    }
    case 'clean':
      p.tween({
        bright: 1,
        duration: T.cleanBright.ms,
        yoyo: true,
        delay,
        onComplete: () => p.reset('bright'),
      });
      p.tween({
        angle: T.clean.deg,
        duration: T.clean.ms,
        yoyo: true,
        repeat: T.clean.repeat,
        delay,
        onComplete: () => p.reset('angle'),
      });
      break;
    case 'popIn':
      p.motion.scale = T.popIn.from;
      if (from && p.mover.pos) {
        p.motion.dx = from.x - p.mover.pos.x;
        p.motion.dy = from.y - p.mover.pos.y;
        p.tween({ dx: 0, dy: 0, duration: T.popIn.moveMs, ease: 'Sine.easeInOut', delay });
      }
      p.layout();
      p.tween({ scale: 1, duration: T.popIn.ms, ease: 'Back.easeOut', delay });
      break;
    case 'grow':
      p.motion.scale = T.grow.from;
      p.layout();
      p.tween({ scale: 1, duration: T.grow.ms, ease: 'Back.easeOut', delay });
      break;
    case 'shake':
    case 'wiggle':
    case 'exit':
      break;
  }
}
