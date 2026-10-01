// One pig on the farm canvas (spec §11, §11.2): applies a PigView, never computes game state.
// Base image + selection marker under the feet + fx overlays on their anchors (layer 5).
// Feedback tweens (§11.3) animate a separate `motion` offset, so a store re-sync never fights them.
import * as Phaser from 'phaser';
import { anchorOffset, type Anchors } from '../../core/assets/anchors';
import { PIG_FEET_Y, type AnchorName, type FxId } from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';
import { FEEDBACK } from '../../core/config/feedback';
import type { AnimationId } from '../feedback/feedbackTable';
import type { PigView } from '../view/pigView';
import { FALLBACK_FX_KEY } from '../view/textureKeys';

export const PIG_ID_DATA = 'pigId';

interface Motion {
  dy: number;
  scale: number;
  angle: number;
  alpha: number;
}

interface Applied {
  view: PigView;
  anchors: Anchors;
  selected: boolean;
  anchorOf: (fx: FxId) => AnchorName;
}

export class PigSprite {
  private readonly image: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Ellipse;
  private overlays: Phaser.GameObjects.Image[] = [];
  private applied: Applied | null = null;
  /** Tweened offsets: dy (px, up is negative), scale multiplier, angle (deg), alpha. */
  private readonly motion: Motion = { dy: 0, scale: 1, angle: 0, alpha: 1 };
  private leaving = false;

  constructor(
    private readonly scene: Phaser.Scene,
    pigId: string,
    view: PigView,
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
  }

  private textureFor(view: PigView): string {
    return this.scene.textures.exists(view.textureId) ? view.textureId : view.fallbackId;
  }

  apply(view: PigView, anchors: Anchors, selected: boolean, anchorOf: (fx: FxId) => AnchorName) {
    if (this.leaving) return;
    const key = this.textureFor(view);
    if (this.image.texture.key !== key) {
      this.image.setTexture(key);
      // The pixel-perfect hit area keeps its first size; follow the new frame.
      (this.image.input?.hitArea as Phaser.Geom.Rectangle | undefined)?.setSize(
        this.image.width,
        this.image.height,
      );
    }
    this.applied = { view, anchors, selected, anchorOf };
    this.layout();
  }

  /** Base view + motion offsets → every game object of the pig. */
  private layout() {
    if (!this.applied) return;
    const { view, anchors, selected, anchorOf } = this.applied;
    const m = this.motion;
    const displayH = FARM_VIEW.PIG_DISPLAY_PX * view.scale * m.scale;
    const y = view.y + m.dy;
    this.image
      .setScale(displayH / this.image.height)
      .setPosition(view.x, y)
      .setFlipX(view.flipX)
      .setAngle(view.flipX ? -m.angle : m.angle)
      .setAlpha(m.alpha)
      .setDepth(view.depth);
    const displayW = this.image.displayWidth;

    const sel = FARM_VIEW.SELECTION;
    this.marker
      .setPosition(view.x, view.y)
      .setSize(displayW * sel.width, displayH * sel.height)
      .setDepth(view.depth - 0.5)
      .setVisible(selected && !this.leaving);

    this.syncOverlays(view, anchors, anchorOf, displayW, displayH, y);
  }

  private syncOverlays(
    view: PigView,
    anchors: Anchors,
    anchorOf: (fx: FxId) => AnchorName,
    displayW: number,
    displayH: number,
    y: number,
  ) {
    while (this.overlays.length > view.overlays.length) this.overlays.pop()?.destroy();
    const size = FARM_VIEW.FX_DISPLAY_PX * view.scale;
    const step = size + FARM_VIEW.FX_STACK_GAP_PX * view.scale;
    const n = view.overlays.length;
    view.overlays.forEach((fx, i) => {
      const key = this.scene.textures.exists(fx) ? fx : FALLBACK_FX_KEY;
      const img = this.overlays[i] ?? this.scene.add.image(0, 0, key);
      this.overlays[i] = img;
      if (img.texture.key !== key) img.setTexture(key);
      const off = anchorOffset(anchors, anchorOf(fx), view.flipX, displayW, displayH);
      img
        .setDisplaySize(size, size)
        .setPosition(view.x + off.x + (i - (n - 1) / 2) * step, y + off.y)
        .setAlpha(this.motion.alpha)
        .setDepth(FARM_VIEW.OVERLAY_DEPTH + view.depth);
    });
  }

  /** World position of an anchor right now (for particle bursts). */
  anchorPoint(name: AnchorName): { x: number; y: number } {
    if (!this.applied) return { x: this.image.x, y: this.image.y };
    const { view, anchors } = this.applied;
    const off = anchorOffset(
      anchors,
      name,
      view.flipX,
      this.image.displayWidth,
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

  /** Feedback animation (§11.3); `exit` is played by `leave`. */
  play(animation: AnimationId, delayMs: number) {
    if (this.leaving) return;
    const T = FEEDBACK.TWEEN;
    const delay = delayMs;
    switch (animation) {
      case 'bounce':
        this.motion.dy = -T.bounce.dropPx;
        this.layout();
        this.tween({ dy: 0, duration: T.bounce.ms, ease: 'Bounce.easeOut', delay });
        break;
      case 'hop':
        this.tween({ dy: -T.hop.px, duration: T.hop.ms, yoyo: true, ease: 'Quad.easeOut', delay });
        break;
      case 'eat':
        this.tween({
          angle: T.eat.deg,
          duration: T.eat.ms,
          yoyo: true,
          repeat: T.eat.repeat,
          delay,
        });
        break;
      case 'clean':
      case 'shake':
        this.tween({
          angle: T.clean.deg,
          duration: T.clean.ms,
          yoyo: true,
          repeat: T.clean.repeat,
          delay,
          onComplete: () => this.reset('angle'),
        });
        break;
      case 'popIn':
        this.motion.scale = T.popIn.from;
        this.layout();
        this.tween({ scale: 1, duration: T.popIn.ms, ease: 'Back.easeOut', delay });
        break;
      case 'grow':
        this.motion.scale = T.grow.from;
        this.layout();
        this.tween({ scale: 1, duration: T.grow.ms, ease: 'Back.easeOut', delay });
        break;
      case 'wiggle':
      case 'exit':
        break;
    }
  }

  private reset(key: keyof Motion) {
    this.motion[key] = key === 'scale' || key === 'alpha' ? 1 : 0;
    this.layout();
  }

  /** Removed from the save: hop off and fade (§11.2), or vanish at once with reduceMotion. */
  leave(reduceMotion: boolean, done: () => void) {
    this.leaving = true;
    this.image.disableInteractive();
    this.marker.setVisible(false);
    if (reduceMotion) {
      this.destroy();
      done();
      return;
    }
    const T = FEEDBACK.TWEEN.exit;
    this.tween({
      dy: -T.px,
      alpha: 0,
      duration: T.ms,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.destroy();
        done();
      },
    });
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.motion);
    this.image.destroy();
    this.marker.destroy();
    for (const o of this.overlays) o.destroy();
    this.overlays = [];
  }
}
