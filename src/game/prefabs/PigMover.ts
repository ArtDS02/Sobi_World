// Where a pig stands and how it poses (spec §11, art standard §2.4, §3): visual-only wandering
// inside the walk area, naps between strolls, idle breathing, walk squash/stretch, the 120 ms
// turn and the global night rest (fall asleep → sleep → wake up, DECISIONS PS-1); reduceMotion
// turns the tweens off (rest changes are then instant). Nothing here reaches the store or the save; the
// position lives only in this object.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { PIG_SLEEP } from '../../core/config/dayNight';
import { FEEDBACK } from '../../core/config/feedback';
import { playRestPose } from '../fx/restPoses';
import type { PigMotion } from '../state/pigVisualState';
import {
  initialRest,
  isAwake,
  onDayNight,
  onTransitionEnd,
  staggerMs,
  type PigRestState,
} from '../state/sleepCycle';
import {
  clampToEllipse,
  facesLeft,
  napsDuring,
  restMs,
  walkDistance,
  walkMs,
  wanderTarget,
} from '../state/wander';
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
  private step = 0;
  private walk: Phaser.Tweens.Tween | null = null;
  private poseTween: Phaser.Tweens.Tween | null = null;
  private turnTween: Phaser.Tweens.TweenChain | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;
  private poseKind: PoseKind | null = null;
  /** Asleep for the current rest (DECISIONS R09B-1); any interaction wakes the pig. */
  private napping = false;
  /** Night rest state (PS-1); IDLE while awake (WALKING = IDLE + a running stroll). */
  private restState: PigRestState = 'IDLE';
  private restTimer: Phaser.Time.TimerEvent | null = null;

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
    /** Where the other pigs stand: strolls keep clear of them. */
    private readonly others: () => { x: number; y: number }[] = () => [],
    /** Share of rests spent napping (more at night, DN). */
    private readonly napChance: () => number = () => FARM_VIEW.WANDER.napChance,
    /** Whether it is sleep time on the farm right now (the global day/night signal). */
    private readonly night: () => boolean = () => false,
  ) {}

  /** First view: stand at home facing the derived way, start breathing and the stroll timer. */
  place(home: { x: number; y: number }, facingLeft: boolean) {
    if (this.pos) return;
    this.pos = { ...home };
    this.dest = { ...home };
    this.facingLeft = facingLeft;
    // Spawn / birth / load at night: already asleep, never walking (PS-1).
    this.restState = initialRest(this.night());
    if (this.restState === 'SLEEPING') this.restPose('SLEEPING');
    this.rest();
  }

  /** Rest state now: IDLE / WALKING by day, the sleep flow at night. */
  get restNow(): PigRestState {
    if (this.restState === 'IDLE' && this.walk && !this.walk.isPaused()) return 'WALKING';
    return this.restState;
  }

  /**
   * The farm switched between day and night (one signal for all pigs): after this pig's stagger,
   * start falling asleep / waking up. A walking pig stops where it is.
   */
  setNight() {
    this.restTimer?.remove();
    const delay = this.reduceMotion() ? 0 : staggerMs(hashId(this.pigId));
    this.restTimer = this.scene.time.delayedCall(delay, () => {
      this.restTimer = null;
      const next = onDayNight(this.restState, this.night());
      if (next !== this.restState) this.startRest(next);
    });
  }

  private startRest(state: PigRestState): void {
    this.restState = state;
    if (state === 'IDLE') {
      this.poseKind = null; // awake again: breathe and stroll as usual
      this.rest();
      return;
    }
    this.restPose(state);
    if (state === 'SLEEPING') return;
    this.walk?.stop(); // falling asleep / waking up: a walking pig stops where it is
    this.walk = null;
    if (this.pos) this.dest = { ...this.pos };
    this.napping = false;
    const ms = state === 'FALLING_ASLEEP' ? PIG_SLEEP.fallAsleepMs : PIG_SLEEP.wakeUpMs;
    const done = (): void => this.startRest(onTransitionEnd(state, this.night()));
    if (this.reduceMotion()) return done();
    this.restTimer = this.scene.time.delayedCall(ms, () => {
      this.restTimer = null;
      done();
    });
  }

  /** Settling down (falling asleep), slow sleep breathing, or the wake-up stretch. */
  private restPose(state: PigRestState) {
    this.poseKind = 'rest';
    this.poseTween?.stop();
    const phase = hashId(this.pigId);
    this.poseTween = playRestPose(this.scene, this.pose, state, phase, this.reduceMotion(), this.onChange);
    this.onChange();
  }

  /** Pushed by a crowded neighbour (separation): only while standing, kept in the ellipse. */
  nudge(dx: number, dy: number) {
    if (!this.pos || this.walk) return;
    this.pos = clampToEllipse(this.layout, { x: this.pos.x + dx, y: this.pos.y + dy });
    this.dest = { ...this.pos };
    this.onChange();
  }

  /** For pigVisualState: strolling (not paused), napping, or standing. */
  get motion(): PigMotion {
    if (this.restState === 'SLEEPING') return 'sleep';
    if (!isAwake(this.restState)) return 'drowsy';
    if (this.walk && !this.walk.isPaused()) return 'walk';
    return this.napping ? 'nap' : 'still';
  }

  private blocked(): boolean {
    return this.reduceMotion() || !this.mayWander() || !isAwake(this.restState);
  }

  /** Rest before the next stroll; some rests are naps. */
  private rest() {
    this.napping = !this.blocked() && napsDuring(this.pigId, this.step, this.napChance());
    this.refresh();
    this.schedule(restMs(this.pigId, this.step, this.napping));
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
    const to = wanderTarget(this.pigId, this.step, this.layout, this.others());
    this.dest = to;
    this.face(facesLeft(pos.x, to.x, this.facingLeft));
    this.walk = this.scene.tweens.add({
      targets: pos,
      x: to.x,
      y: to.y,
      duration: walkMs(walkDistance(to.x - pos.x, to.y - pos.y)),
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
    this.restTimer?.remove();
    this.restTimer = null;
    this.walk?.stop();
    this.poseTween?.stop();
    this.turnTween?.stop();
    this.walk = this.poseTween = this.turnTween = this.timer = null;
  }
}
