// Gift boxes on the farm (U06). Mirrors save.gifts.boxes: a box appears static (catch-up) and
// floats gently; the director's GIFT_SPAWNED / GIFT_OPENED steps play the pop and the open.
// A box gone from the save stays as "leaving" until its open animation ends (like a sold pig).
import * as Phaser from 'phaser';
import { GIFT_PROP_ID } from '../../../../core/config/assetIds';
import { FEEDBACK } from '../../../../core/config/feedback';
import type { GiftBox } from '../../../../core/types';
import type { Point } from '../view/giftPlacement';
import { FALLBACK_PROP_KEY, textureKey } from '../view/textureKeys';

export const GIFT_ID_DATA = 'giftId';
const G = FEEDBACK.GIFT;

export class GiftBoxes {
  private readonly boxes = new Map<string, Phaser.GameObjects.Image>();
  private readonly leaving = new Map<string, Phaser.GameObjects.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reduceMotion: () => boolean,
  ) {}

  /** Positions of the boxes on the farm (placement avoids them). */
  points(): Point[] {
    return [...this.boxes.values()].map((b) => ({ x: b.x, y: b.y }));
  }

  get(id: string): Phaser.GameObjects.Image | undefined {
    return this.boxes.get(id) ?? this.leaving.get(id);
  }

  sync(gifts: readonly GiftBox[], place: (box: GiftBox) => Point) {
    const ids = new Set(gifts.map((g) => g.id));
    for (const [id, img] of this.boxes) {
      if (ids.has(id)) continue;
      this.boxes.delete(id);
      this.leave(id, img);
    }
    for (const box of gifts) {
      if (this.boxes.has(box.id)) continue;
      const at = place(box);
      const key = this.scene.textures.exists(textureKey(GIFT_PROP_ID))
        ? textureKey(GIFT_PROP_ID)
        : FALLBACK_PROP_KEY;
      const img = this.scene.add
        .image(at.x, at.y, key)
        .setOrigin(0.5, 1)
        .setDepth(at.y)
        .setData(GIFT_ID_DATA, box.id)
        .setInteractive({ useHandCursor: true });
      img.setScale(G.displayPx / img.height);
      img.setData('baseScale', img.scaleX).setData('baseY', at.y);
      this.boxes.set(box.id, img);
      this.idle(img);
    }
  }

  /** Small float, only while it lies on the farm (stopped by spawn / open / destroy). */
  private idle(img: Phaser.GameObjects.Image) {
    if (this.reduceMotion()) return;
    this.scene.tweens.add({
      targets: img,
      y: (img.getData('baseY') as number) - G.idle.px,
      duration: G.idle.ms,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** GIFT_SPAWNED: hidden during the smoke, then pop with a slight tilt, then idle. */
  spawn(id: string, delayMs: number) {
    const img = this.boxes.get(id);
    if (!img) return;
    const base = img.getData('baseScale') as number;
    this.scene.tweens.killTweensOf(img);
    img
      .setScale(0)
      .setY(img.getData('baseY') as number)
      .setAngle(-G.popAngleDeg);
    const steps = G.popScale.map((s, i) => ({
      scale: base * s,
      angle: i === 0 ? G.popAngleDeg : 0,
      duration: G.popMs[i]!,
      ease: i === 0 ? 'Back.easeOut' : 'Sine.easeInOut',
    }));
    this.scene.tweens.chain({
      targets: img,
      delay: delayMs + G.anticipationMs,
      tweens: steps,
      onComplete: () => this.idle(img),
    });
  }

  /** GIFT_OPENED: squeeze, then pop open (grow + fade) and go. */
  open(id: string, delayMs: number) {
    const img = this.leaving.get(id);
    if (!img) return;
    const base = img.getData('baseScale') as number;
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.chain({
      targets: img,
      delay: delayMs,
      tweens: [
        { scale: base * G.open.squeeze, duration: G.open.squeezeMs, ease: 'Sine.easeOut' },
        { scale: base * G.open.pop, alpha: 0, duration: G.open.popMs, ease: 'Quad.easeOut' },
      ],
      onComplete: () => this.drop(id),
    });
  }

  /** Removed from the save: wait for the open animation, or vanish (reduceMotion / no event). */
  private leave(id: string, img: Phaser.GameObjects.Image) {
    img.disableInteractive();
    this.leaving.set(id, img);
    if (this.reduceMotion()) return this.drop(id);
    const total = G.open.squeezeMs + G.open.popMs;
    this.scene.time.delayedCall(total * 3, () => this.drop(id)); // safety net
  }

  private drop(id: string) {
    const img = this.leaving.get(id);
    if (!img) return;
    this.scene.tweens.killTweensOf(img);
    img.destroy();
    this.leaving.delete(id);
  }

  destroy() {
    for (const img of [...this.boxes.values(), ...this.leaving.values()]) {
      this.scene.tweens.killTweensOf(img);
      img.destroy();
    }
    this.boxes.clear();
    this.leaving.clear();
  }
}
