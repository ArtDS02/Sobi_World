// Where a pig stands and how it poses (spec §11, art standard §2.4, §3). It executes what the pig's
// brain decides (DECISIONS PL-1): walk to a point, stop, rest poses (fall asleep → sleep → wake up),
// look around; plus idle breathing, walk squash/stretch and the 120 ms turn. reduceMotion turns
// the tweens off. No timers of its own and nothing reaches the store or the save; the position
// lives only in this object.
import * as Phaser from 'phaser';
import { FEEDBACK } from '../../../../core/config/feedback';
import { PIG_LIFE } from '../../../../core/config/pigLife';
import { playRestPose } from '../fx/restPoses';
import type { PigMotion } from '../state/pigVisualState';
import { isAwake, type PigRestState } from '../state/sleepCycle';
import { clampToEllipse, facesLeft, insideEllipse, walkDistance, walkMs } from '../state/wander';
import { hashId, type FarmLayout } from '../view/pigView';

/** Pose multipliers on top of the pig's scale: breathing / squash (bx, by) and the turn (turn). */
export interface Pose {
  bx: number;
  by: number;
  turn: number;
}

type PoseKind = 'idle' | 'walk' | 'still' | 'rest';

export class PigMover {
  /** Feet position in design px; null until the first view is applied. */
  pos: { x: number; y: number } | null = null;
  facingLeft = false;
  readonly pose: Pose = { bx: 1, by: 1, turn: 1 };
  /** Where the pig is heading (its feet position while it stands). */
  dest: { x: number; y: number } | null = null;
  private walk: Phaser.Tweens.Tween | null = null;
  private poseTween: Phaser.Tweens.Tween | null = null;
  private turnTween: Phaser.Tweens.TweenChain | null = null;
  private poseKind: PoseKind | null = null;
  /** Rest pose (PL-1); IDLE while awake (WALKING = IDLE + a running walk). */
  private restState: PigRestState = 'IDLE';
  /** Standing at a chosen place (trough, sleep spot, a friend): crowd pushes leave it there. */
  private anchored = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pigId: string,
    private readonly layout: FarmLayout,
    /** Re-lay the sprite after any change. */
    private readonly onChange: () => void,
    /** Selected, interacting or leaving: a walk pauses until this turns false. */
    private readonly paused: () => boolean,
    /** A feedback state plays (eat / clean / happy): hold a neutral pose. */
    private readonly interacting: () => boolean,
    /** settings.reduceMotion: no walks, no pose tweens, instant turns. */
    private readonly reduceMotion: () => boolean,
  ) {}

  /** First view: stand at home facing the derived way, in the brain's starting pose. */
  place(home: { x: number; y: number }, facingLeft: boolean, rest: PigRestState) {
    if (this.pos) return;
    this.pos = { ...home };
    this.dest = { ...home };
    this.facingLeft = facingLeft;
    this.setRest(rest);
  }

  /** On the way to the last walk target (paused walks count). */
  get walking(): boolean {
    return this.walk !== null;
  }

  /** Walk to `to` at `speed` × the stroll speed; the brain notices the arrival (walking false). */
  walkTo(to: { x: number; y: number }, speed: number) {
    const pos = this.pos;
    if (!pos || this.reduceMotion()) return;
    this.walk?.stop();
    this.anchored = false;
    this.dest = { ...to };
    this.face(facesLeft(pos.x, to.x, this.facingLeft));
    this.walk = this.scene.tweens.add({
      targets: pos,
      x: to.x,
      y: to.y,
      duration: walkMs(walkDistance(to.x - pos.x, to.y - pos.y)) / Math.max(0.1, speed),
      ease: 'Sine.easeInOut',
      onUpdate: this.onChange,
      onComplete: () => {
        this.walk = null;
        this.anchored = !insideEllipse(this.layout, pos) || this.restState !== 'IDLE';
        this.refresh();
      },
    });
    this.refresh();
  }

  /** Stop where it is (or stay at the walk target it reached). */
  stop() {
    this.walk?.stop();
    this.walk = null;
    if (this.pos) this.dest = { ...this.pos };
    this.refresh();
  }

  /** Rest pose: IDLE (awake, breathing), FALLING_ASLEEP, SLEEPING, WAKING_UP (PL-1). */
  setRest(state: PigRestState) {
    const was = this.restState;
    this.restState = state === 'WALKING' ? 'IDLE' : state;
    if (this.restState === 'IDLE') {
      if (was !== 'IDLE') this.poseKind = null; // awake again: breathe as usual
      this.refresh();
      return;
    }
    if (this.walk) this.stop();
    this.poseKind = 'rest';
    this.poseTween?.stop();
    const phase = hashId(this.pigId);
    this.poseTween = playRestPose(
      this.scene,
      this.pose,
      this.restState,
      phase,
      this.reduceMotion(),
      this.onChange,
    );
    this.onChange();
  }

  /** Look over the shoulder and back (curious pigs): two quick turns. */
  lookAround() {
    if (this.reduceMotion()) return;
    const back = this.facingLeft;
    this.face(!back);
    this.scene.time.delayedCall(PIG_LIFE.idle.lookAroundMs / 2, () => this.face(back));
  }

  /** Turn toward a point's x (a friend, the trough). */
  faceX(x: number) {
    if (this.pos) this.face(facesLeft(this.pos.x, x, this.facingLeft));
  }

  /** Pushed by a crowded neighbour (separation): only while standing free in the walk area. */
  nudge(dx: number, dy: number) {
    if (!this.pos || this.walk || this.anchored || this.restState !== 'IDLE') return;
    this.pos = clampToEllipse(this.layout, { x: this.pos.x + dx, y: this.pos.y + dy });
    this.dest = { ...this.pos };
    this.onChange();
  }

  /** Stand anchored where it is (eating, visiting): crowd pushes ignore it until it walks. */
  anchor() {
    this.anchored = true;
  }

  /** For pigVisualState: walking (not paused), the rest flow, or standing. */
  get motion(): PigMotion {
    if (this.restState === 'SLEEPING') return 'sleep';
    if (!isAwake(this.restState)) return 'drowsy';
    return this.walk && !this.walk.isPaused() ? 'walk' : 'still';
  }

  /**
   * Pause a walk while the pig is held, resume when it is free again. Pose: neutral during an
   * interaction, squash while walking, otherwise breathing (sick and pregnant pigs too).
   */
  refresh() {
    const blocked = this.paused() || this.reduceMotion();
    if (this.walk) {
      if (blocked && !this.walk.isPaused()) this.walk.pause();
      else if (!blocked && this.walk.isPaused()) this.walk.resume();
    }
    if (!isAwake(this.restState)) {
      this.onChange(); // the rest pose keeps playing
      return;
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
    this.walk?.stop();
    this.poseTween?.stop();
    this.turnTween?.stop();
    this.walk = this.poseTween = this.turnTween = null;
  }
}
