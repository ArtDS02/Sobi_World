// FarmEffects on the Phaser farm (spec §11.3): tweens on pigs / trough / order board and
// one-shot particle bursts from the fx_* textures (placeholder art works the same).
import * as Phaser from 'phaser';
import type { FxId } from '../../../../core/config/assetIds';
import type { GameEvent } from '../../../../core/events';
import { FARM_VIEW } from '../../../../core/config/farmView';
import { FEEDBACK } from '../../../../core/config/feedback';
import type { FarmEffects } from '../feedback/effects';
import type { FeedbackTarget } from '../feedback/feedbackPlan';
import type { AnimationId } from '../feedback/feedbackTable';
import type { GiftBoxes } from '../prefabs/GiftBoxes';
import type { PigSprite } from '../prefabs/PigSprite';
import { FALLBACK_FX_KEY } from '../view/textureKeys';

export interface EffectTargets {
  pig(pigId: string): PigSprite | undefined;
  trough(): Phaser.GameObjects.Image | null;
  board(): Phaser.GameObjects.Image | null;
  gifts(): GiftBoxes;
  /** The life simulation (PL-1). */
  life(event: GameEvent): void;
}

export class SceneEffects implements FarmEffects {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly targets: EffectTargets,
  ) {}

  private object(target: FeedbackTarget): Phaser.GameObjects.Image | null {
    if (target.kind === 'trough') return this.targets.trough();
    if (target.kind === 'board') return this.targets.board();
    if (target.kind === 'gift') return this.targets.gifts().get(target.giftId) ?? null;
    return null;
  }

  animate(animation: AnimationId, target: FeedbackTarget, delayMs: number, from?: FeedbackTarget) {
    if (target.kind === 'pig') {
      const start = from?.kind === 'pig' ? this.targets.pig(from.pigId)?.feet() : undefined;
      this.targets.pig(target.pigId)?.play(animation, delayMs, start);
      return;
    }
    if (target.kind === 'gift') {
      if (animation === 'giftSpawn') this.targets.gifts().spawn(target.giftId, delayMs);
      if (animation === 'giftOpen') this.targets.gifts().open(target.giftId, delayMs);
      return;
    }
    const obj = this.object(target);
    if (!obj || this.scene.tweens.isTweening(obj)) return;
    const T = FEEDBACK.TWEEN;
    if (animation === 'shake') {
      const x = obj.x;
      this.scene.tweens.add({
        targets: obj,
        x: x + T.shake.px,
        duration: T.shake.ms,
        yoyo: true,
        repeat: T.shake.repeat,
        delay: delayMs,
        onComplete: () => obj.setX(x),
      });
    } else if (animation === 'wiggle') {
      this.scene.tweens.add({
        targets: obj,
        angle: T.wiggle.deg,
        duration: T.wiggle.ms,
        yoyo: true,
        repeat: T.wiggle.repeat,
        delay: delayMs,
        onComplete: () => obj.setAngle(0),
      });
    }
  }

  /** Burst origin: the pig's fx anchor, the top of an object, or the top of the scene. */
  private point(target: FeedbackTarget): { x: number; y: number } | null {
    if (target.kind === 'pig')
      return this.targets.pig(target.pigId)?.anchorPoint('fx_above') ?? null;
    if (target.kind === 'top') {
      const { width, height } = this.scene.scale;
      return { x: width * FEEDBACK.TOP_POINT.x, y: height * FEEDBACK.TOP_POINT.y };
    }
    const obj = this.object(target);
    return obj ? obj.getTopCenter(undefined, true) : null;
  }

  burst(fx: FxId, target: FeedbackTarget, delayMs: number) {
    const at = this.point(target);
    if (!at) return;
    const key = this.scene.textures.exists(fx) ? fx : FALLBACK_FX_KEY;
    const P = FEEDBACK.PARTICLE;
    const scale = P.sizePx / this.scene.textures.getFrame(key).width;
    const emitter = this.scene.add
      .particles(at.x, at.y, key, {
        speed: { min: P.speedMin, max: P.speedMax },
        angle: { min: P.angleMin, max: P.angleMax },
        lifespan: P.lifespanMs,
        gravityY: P.gravityY,
        scale: { start: scale, end: 0 },
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(FARM_VIEW.OVERLAY_DEPTH * 2);
    this.scene.time.delayedCall(delayMs, () => emitter.explode(P.count));
    this.scene.time.delayedCall(delayMs + P.lifespanMs + 100, () => emitter.destroy());
  }

  /** Reward text: rises and fades from the top of the target, then is destroyed. */
  life(event: GameEvent) {
    this.targets.life(event);
  }

  float(lines: readonly string[], target: FeedbackTarget, delayMs: number) {
    const at = this.point(target);
    if (!at) return;
    const F = FEEDBACK.GIFT.float;
    lines.forEach((line, i) => {
      const text = this.scene.add
        .text(at.x, at.y - i * F.lineGapPx, line, {
          color: F.color,
          fontSize: `${F.fontPx}px`,
          fontFamily: FARM_VIEW.LABEL.fontFamily,
          fontStyle: 'bold',
          stroke: F.stroke,
          strokeThickness: 6,
        })
        .setOrigin(0.5, 1)
        .setDepth(FARM_VIEW.OVERLAY_DEPTH * 2)
        .setScale(0.6)
        .setAlpha(0);
      this.scene.tweens.add({
        targets: text,
        y: text.y - F.risePx,
        scale: 1,
        alpha: { from: 1, to: 0, ease: 'Cubic.easeIn' },
        duration: F.ms,
        delay: delayMs,
        ease: 'Quad.easeOut',
        onComplete: () => text.destroy(),
      });
    });
  }
}
