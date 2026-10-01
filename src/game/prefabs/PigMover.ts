// Where a pig stands and how it poses (spec §11, art standard §2.4, §3): visual-only wandering
// inside the walk area, naps between strolls, idle breathing, walk squash/stretch and the 120 ms
// turn; reduceMotion turns all of it off. Nothing here reaches the store or the save; the
// position lives only in this object.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { FEEDBACK } from '../../core/config/feedback';
import type { PigMotion } from '../state/pigVisualState';
import { facesLeft, napsDuring, restMs, walkMs, wanderTarget } from '../state/wander';
import { hashId, type FarmLayout } from '../view/pigView';

/** Pose multipliers on top of the pig's scale: breathing / squash (bx, by) and the turn (turn). */
export interface Pose {
  bx: number;
  by: number;
  turn: number;
}

type PoseKind = 'idle' | 'walk' | 'still';

export class PigMover {
  /** Feet position in design px; null until the first view is applied. */
  pos: { x: number; y: number } | null = null;
  facingLeft = false;
  readonly pose: Pose = { bx: 1, by: 1, turn: 1 };
  private home = { x: 0, y: 0 };
  private step = 0;
  private walk: Phaser.Tweens.Tween | null = null;
  private poseTween: Phaser.Tweens.Tween | null = null;
  private turnTween: Phaser.Tweens.TweenChain | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;
  private poseKind: PoseKind | null = null;
  /** Asleep for the current rest (DECISIONS R09B-1); any interaction wakes the pig. */
  private napping = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pigId: string,
    private readonly layout: FarmLayout,
    /** Re-lay the sprite after any change. */
    private readonly onChange: () => void,
    /** Whether the pig may stroll right now (visual state idle, not selected). */
    private readonly mayWander: () => boolean,
    /** A feedback state plays (eat / clean / happy): hold a neutral pose. */
    private readonly interacting: () => boolean,
    /** settings.reduceMotion: no strolls, no pose tweens, instant turns. */
    private readonly reduceMotion: () => boolean,
  ) {}

  /** First view: stand at home facing the derived way, start breathing and the stroll timer. */
  place(home: { x: number; y: number }, facingLeft: boolean) {
    this.home = home;
    if (this.pos) return;
    this.pos = { ...home };
    this.facingLeft = facingLeft;
    this.rest();
  }

  /** For pigVisualState: strolling (not paused), napping, or standing. */
  get motion(): PigMotion {
    if (this.walk && !this.walk.isPaused()) return 'walk';
    return this.napping ? 'nap' : 'still';
  }

  private blocked(): boolean {
    return this.reduceMotion() || !this.mayWander();
  }

  /** Rest before the next stroll; some rests are naps. */
  private rest() {
    this.napping = !this.blocked() && napsDuring(this.pigId, this.step);
    this.refresh();
    this.schedule(restMs(this.pigId, this.step));
  }

  /**
   * Pause a stroll while the pig may not wander, resume when it may again. Pose: neutral during
   * an interaction, squash while walking, otherwise breathing (sick and pregnant pigs too).
   */
  refresh() {
    const blocked = this.blocked();
    if (blocked) this.napping = false; // selected or acted on: wake up
    if (this.walk) {
      if (blocked && !this.walk.isPaused()) this.walk.pause();
      else if (!blocked && this.walk.isPaused()) this.walk.resume();
    }
    const walking = this.walk !== null && !blocked;
    const still = this.interacting() || this.reduceMotion();
    this.setPose(still ? 'still' : walking ? 'walk' : 'idle');
    this.onChange();
  }

  /** Turn to face left / right: scaleX 1 → 0, flip, 0 → 1 in POSE.turnMs (art standard §2.4). */
  face(left: boolean) {
    if (left === this.facingLeft) return;
    this.turnTween?.stop();
    if (this.reduceMotion()) {
      this.facingLeft = left;
      this.pose.turn = 1;
      this.onChange();
      return;
    }
    const half = FEEDBACK.POSE.turnMs / 2;
    this.turnTween = this.scene.tweens.chain({
      targets: this.pose,
      tweens: [
        {
          turn: 0,
          duration: half,
          onComplete: () => {
            this.facingLeft = left;
          },
        },
        { turn: 1, duration: half },
      ],
      onUpdate: this.onChange,
      onComplete: () => {
        this.pose.turn = 1;
        this.facingLeft = left;
        this.turnTween = null;
        this.onChange();
      },
    });
  }

  private schedule(ms: number) {
    this.timer?.remove();
    this.timer = this.scene.time.delayedCall(ms, () => this.stroll());
  }

  private stroll() {
    if (!this.pos || this.blocked()) {
      this.schedule(FARM_VIEW.WANDER.retryMs);
      return;
    }
    const pos = this.pos;
    this.napping = false;
    this.step += 1;
    const to = wanderTarget(this.pigId, this.step, this.home, this.layout);
    this.face(facesLeft(pos.x, to.x, this.facingLeft));
    this.walk = this.scene.tweens.add({
      targets: pos,
      x: to.x,
      y: to.y,
      duration: walkMs(Math.hypot(to.x - pos.x, to.y - pos.y)),
      ease: 'Sine.easeInOut',
      onUpdate: this.onChange,
      onComplete: () => {
        this.walk = null;
        this.rest();
      },
    });
    this.setPose('walk');
  }

  /** idle: slow breathing; walk: squash / stretch; still: neutral (an interaction plays). */
  private setPose(kind: PoseKind) {
    if (kind === this.poseKind) return;
    this.poseKind = kind;
    this.poseTween?.stop();
    this.poseTween = null;
    this.pose.bx = 1;
    this.pose.by = 1;
    const P = FEEDBACK.POSE;
    if (kind === 'idle') {
      this.poseTween = this.scene.tweens.add({
        targets: this.pose,
        by: 1 + P.breathe.amount,
        bx: 1 - P.breathe.amount / 2,
        duration: P.breathe.ms,
        delay: hashId(this.pigId) % P.breathe.ms, // pigs do not breathe in unison
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: this.onChange,
      });
    } else if (kind === 'walk') {
      this.poseTween = this.scene.tweens.add({
        targets: this.pose,
        bx: P.squash.x,
        by: P.squash.y,
        duration: P.squash.ms,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: this.onChange,
      });
    }
    this.onChange();
  }

  destroy() {
    this.timer?.remove();
    this.walk?.stop();
    this.poseTween?.stop();
    this.turnTween?.stop();
    this.walk = this.poseTween = this.turnTween = this.timer = null;
  }
}
