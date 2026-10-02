// One pig on the farm canvas (§11.2): image, selection marker, fx overlays. Feedback tweens (§11.3)
// move a separate `motion` offset and PigMover owns wandering, so a re-sync never fights them.
import * as Phaser from 'phaser';
import { anchorOffset, type Anchors } from '../../core/assets/anchors';
import { PIG_FEET_Y, type AnchorName, type FxId } from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';
import { FEEDBACK } from '../../core/config/feedback';
import type { AnimationId } from '../feedback/feedbackTable';
import {
  FEEDBACK_STATE,
  canWander,
  pigVisualState,
  type ActiveFeedback,
  type VisualState,
} from '../state/pigVisualState';
import { pigScale, sleepLook, type FarmLayout, type PigView } from '../view/pigView';
import { playPigAnimation, type Motion, type TweenablePig } from '../fx/pigAnimations';
import { PigMover } from './PigMover';
import type { PlateAnchor } from './Nameplates';
import { PigOverlays } from './PigOverlays';
import { SickTint } from './SickTint';

export const PIG_ID_DATA = 'pigId';

interface Applied {
  view: PigView;
  anchors: Anchors;
  selected: boolean;
  anchorOf: (fx: FxId) => AnchorName;
}

export interface PigEnv {
  layout: FarmLayout;
  /** Trough x in design px (eat turns toward it), or null without a trough. */
  troughX: () => number | null;
  /** settings.reduceMotion right now. */
  reduceMotion: () => boolean;
}

const T = FEEDBACK.TWEEN;
/** How long each feedback state holds (yoyo tweens run there and back). */
const HOLD_MS: Record<'eat' | 'clean' | 'happy', number> = {
  eat: T.eat.ms * 2 * (T.eat.repeat + 1),
  clean: T.clean.ms * 2 * (T.clean.repeat + 1),
  happy: T.happy.ms * 2 * (T.happy.repeat + 1),
};

export class PigSprite {
  private readonly image: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Ellipse;
  private readonly bright: Phaser.FX.ColorMatrix | null;
  private readonly overlays: PigOverlays;
  private applied: Applied | null = null;
  private readonly motion: Motion = { dx: 0, dy: 0, scale: 1, angle: 0, alpha: 1, bright: 0 };
  private readonly mover: PigMover;
  private feedback: ActiveFeedback | null = null;
  private leaving = false;
  private readonly sick: SickTint;
  /** What the shared animation code may touch. */
  private readonly handle: TweenablePig;

  constructor(
    private readonly scene: Phaser.Scene,
    pigId: string,
    view: PigView,
    private readonly env: PigEnv,
  ) {
    const sel = FARM_VIEW.SELECTION;
    this.marker = scene.add
      .ellipse(0, 0, 1, 1, sel.color, sel.alpha)
      .setStrokeStyle(sel.strokeWidth, sel.stroke)
      .setVisible(false);
    this.image = scene.add
      .image(view.x, view.y, this.textureFor(view))
      .setOrigin(0.5, PIG_FEET_Y)
      .setData(PIG_ID_DATA, pigId)
      .setInteractive({
        pixelPerfect: true,
        alphaTolerance: FARM_VIEW.HIT_ALPHA,
        useHandCursor: true,
      });
    this.overlays = new PigOverlays(scene);
    this.sick = new SickTint(scene, env.reduceMotion, () => this.layout());
    this.bright = this.image.preFX?.addColorMatrix() ?? null; // WebGL only
    this.mover = new PigMover(
      scene,
      pigId,
      env.layout,
      () => this.layout(),
      () => this.mayWander(),
      () => this.feedback !== null && this.scene.time.now < this.feedback.until,
      () => env.reduceMotion(),
    );
    this.handle = {
      motion: this.motion,
      mover: this.mover,
      layout: () => this.layout(),
      tween: (c) => this.tween(c),
      reset: (k) => this.reset(k),
      troughX: () => env.troughX(),
    };
  }

  private textureFor(view: PigView): string {
    return this.scene.textures.exists(view.textureId) ? view.textureId : view.fallbackId;
  }

  private mayWander(): boolean {
    const a = this.applied;
    return (
      !this.leaving && !!a && canWander(a.view.care, this.scene.time.now, this.feedback, a.selected)
    );
  }

  /** Skin row drawn right now (after the breed-default fallback); null before the first view. */
  get skinId(): string | null {
    return this.applied?.view.skinId ?? null;
  }

  /** The state this pig shows right now (spec §11 table). */
  visualState(): VisualState {
    const care = this.applied?.view.care ?? { isSick: false, pregnancy: null };
    return pigVisualState(care, this.scene.time.now, this.feedback, this.mover.motion);
  }

  apply(view: PigView, anchors: Anchors, selected: boolean, anchorOf: (fx: FxId) => AnchorName) {
    if (this.leaving) return;
    this.sick.follow(view.care.isSick);
    this.applied = { view, anchors, selected, anchorOf };
    this.mover.place({ x: view.x, y: view.y }, view.flipX);
    this.mover.refresh();
    this.layout();
  }

  private setTexture(key: string) {
    if (this.image.texture.key === key) return;
    this.image.setTexture(key);
    // The pixel-perfect hit area keeps its first size; follow the new frame.
    (this.image.input?.hitArea as Phaser.Geom.Rectangle | undefined)?.setSize(
      this.image.width,
      this.image.height,
    );
  }

  /** Idle frame, or the sleep look (`_sleep` frame, else idle + fx_zzz, spec §11.4 / Q5). */
  private look(view: PigView): { textureId: string; overlays: readonly FxId[] } {
    if (this.visualState() !== 'sleep') {
      return { textureId: this.textureFor(view), overlays: view.overlays };
    }
    const sleep = sleepLook(view, (k) => this.scene.textures.exists(k));
    const textureId = sleep.textureId === view.textureId ? this.textureFor(view) : sleep.textureId;
    return {
      textureId,
      overlays: sleep.overlay ? [...view.overlays, sleep.overlay] : view.overlays,
    };
  }

  /** Wander position + pose + feedback motion → every game object of the pig. */
  private layout() {
    const pos = this.mover.pos;
    if (!this.applied || !pos) return;
    const { view, anchors, selected, anchorOf } = this.applied;
    const look = this.look(view);
    this.setTexture(look.textureId);
    // Sick: green tint on top of the fx_sick overlay (spec §11 table).
    this.sick.apply(this.image);
    const m = this.motion;
    const pose = this.mover.pose;
    const { height } = this.env.layout.designSize;
    const scale = pigScale(view.growth, pos.y / height, this.env.layout);
    const displayH = FARM_VIEW.PIG_DISPLAY_PX * scale * m.scale;
    const flipX = this.mover.facingLeft;
    const x = pos.x + m.dx;
    const y = pos.y + m.dy;
    const base = displayH / this.image.height;
    this.image
      .setScale(base * pose.bx * pose.turn, base * pose.by)
      .setPosition(x, y)
      .setFlipX(flipX)
      .setAngle(flipX ? -m.angle : m.angle)
      .setAlpha(m.alpha)
      .setDepth(pos.y); // Y-sort (spec §11, D23)
    this.bright?.brightness(1 + m.bright * T.cleanBright.amount);
    const displayW = this.image.width * base;

    const sel = FARM_VIEW.SELECTION;
    this.marker
      .setPosition(x, pos.y + m.dy)
      .setSize(displayW * sel.width, displayH * sel.height)
      .setDepth(pos.y - 0.5)
      .setVisible(selected && !this.leaving);

    this.overlays.sync({
      fx: look.overlays,
      animate: !this.env.reduceMotion(),
      anchors,
      anchorOf,
      flipX,
      scale,
      depth: pos.y,
      displayW,
      displayH,
      x,
      y,
      alpha: m.alpha,
    });
  }

  /** World position of an anchor right now (for particle bursts). */
  anchorPoint(name: AnchorName): { x: number; y: number } {
    if (!this.applied) return { x: this.image.x, y: this.image.y };
    const w = Math.abs(this.image.displayWidth);
    const off = anchorOffset(
      this.applied.anchors,
      name,
      this.mover.facingLeft,
      w,
      this.image.displayHeight,
    );
    return { x: this.image.x + off.x, y: this.image.y + off.y };
  }

  private tween(config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>) {
    this.scene.tweens.add({
      targets: this.motion,
      onUpdate: () => this.layout(),
      ...config,
    });
  }

  /** Where the name plate hangs (U05); null before the first view or while leaving. */
  plateAnchor(): PlateAnchor | null {
    const pos = this.mover.pos;
    if (!pos || !this.applied || this.leaving) return null;
    return { x: this.image.x, feetY: this.image.y, depth: pos.y, alpha: this.motion.alpha };
  }

  /** Feet position right now (start point for a newborn). */
  feet(): { x: number; y: number } {
    return { x: this.image.x, y: this.image.y };
  }

  /** Holds a feedback state (eat / clean / happy): wandering pauses until it ends. */
  private hold(animation: AnimationId, delayMs: number) {
    const state = FEEDBACK_STATE[animation];
    if (!state) return;
    const until = this.scene.time.now + delayMs + HOLD_MS[state];
    this.feedback = { state, until };
    this.mover.refresh();
    this.scene.time.delayedCall(delayMs + HOLD_MS[state], () => {
      if (this.feedback?.until === until) this.feedback = null;
      if (!this.leaving) this.mover.refresh();
    });
  }

  /** Feedback animation (§11.3); `exit` is played by `leave`. `from`: popIn starts there. */
  play(animation: AnimationId, delay: number, from?: { x: number; y: number }) {
    if (this.leaving) return;
    this.hold(animation, delay);
    playPigAnimation(this.handle, animation, delay, from);
  }

  private reset(key: keyof Motion) {
    this.motion[key] = key === 'scale' || key === 'alpha' ? 1 : 0;
    this.layout();
  }

  /** Removed from the save: hop off and fade (§11.2), or vanish at once with reduceMotion. */
  leave(reduceMotion: boolean, done: () => void) {
    this.leaving = true;
    this.mover.refresh();
    this.image.disableInteractive();
    this.marker.setVisible(false);
    if (reduceMotion) {
      this.destroy();
      done();
      return;
    }
    this.tween({
      dy: -T.exit.px,
      alpha: 0,
      duration: T.exit.ms,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.destroy();
        done();
      },
    });
  }

  destroy() {
    this.mover.destroy();
    this.sick.destroy();
    this.scene.tweens.killTweensOf(this.motion);
    this.image.destroy();
    this.marker.destroy();
    this.overlays.destroy();
  }
}
