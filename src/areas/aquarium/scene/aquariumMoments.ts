// Small moments of the Aquarium (GĐ14, decision 034), presentation only:
// - a fish just hatched: the egg cracks into two halves that tumble away, with a sparkle and a few bubbles;
// - a catch: the fish leaps out of the water by the fishing spot in an arc, then flies to the bag (top right);
// - a fish clicked: it startles (the scene makes it dart off) and, if it is fond of you, hearts float up;
// - a hungry fish at the surface nibbles at it: a small ring and a bubble.
import * as Phaser from 'phaser';
import { textureKey } from '../../../ui/world/keys';
import { AQUARIUM_VIEW } from './aquariumView';

const key = (scene: Phaser.Scene, art: string): string | null => (scene.textures.exists(textureKey(art)) ? textureKey(art) : null);

export class AquariumMoments {
  constructor(private readonly scene: Phaser.Scene) {}

  /** The egg at (x, y) cracks: two halves fly apart and fade, a sparkle pops. */
  hatch(x: number, y: number) {
    const v = AQUARIUM_VIEW;
    const egg = key(this.scene, v.egg.art);
    if (egg) {
      for (const side of [-1, 1]) {
        const half = this.scene.add.image(x, y, egg).setOrigin(0.5, 1).setDepth(v.depth.egg + 1);
        const s = v.egg.width / half.width;
        half.setScale(s).setCrop(side < 0 ? 0 : half.width / 2, 0, half.width / 2, half.height);
        this.scene.tweens.add({ targets: half, x: x + side * 34, y: y - 18, angle: side * 70, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => half.destroy() });
      }
    }
    this.sparkle(x, y - 24, 46);
  }

  private sparkle(x: number, y: number, px: number) {
    const k = key(this.scene, AQUARIUM_VIEW.sparkleArt);
    if (!k) return;
    const img = this.scene.add.image(x, y, k).setDepth(AQUARIUM_VIEW.depth.sparkle).setScale(0);
    this.scene.tweens.add({ targets: img, scale: px / img.width, angle: 90, duration: 260, yoyo: true, ease: 'Back.easeOut', onComplete: () => img.destroy() });
  }

  /**
   * A catch: `art` (the fish, or the item's icon) leaps from the water at `from` in an arc and lands in the bag at `bag`,
   * shrinking on the way; `splash` rings the water where it left.
   */
  leap(art: string, from: { x: number; y: number }, bag: { x: number; y: number }, splash: (x: number, y: number) => void) {
    const m = AQUARIUM_VIEW.moments.leap;
    const k = key(this.scene, art);
    if (!k) return;
    const img = this.scene.add.image(from.x, from.y, k).setDepth(AQUARIUM_VIEW.depth.badge - 3);
    const size = m.px / Math.max(img.width, img.height);
    img.setScale(size * 0.6).setFlipX(bag.x < from.x);
    splash(from.x, from.y);
    const top = { x: from.x - 60, y: from.y - m.height };
    // Up and over (a tween on a 0..1 counter drives a quadratic curve), a wiggle, then off to the bag.
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(from.x, from.y), new Phaser.Math.Vector2(top.x, top.y - m.height * 0.5), new Phaser.Math.Vector2(top.x - 40, from.y - m.height * 0.4));
    const p = new Phaser.Math.Vector2();
    const t = { u: 0 };
    this.scene.tweens.add({
      targets: t,
      u: 1,
      duration: m.arcMs,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        curve.getPoint(t.u, p);
        img.setPosition(p.x, p.y).setRotation(Math.sin(t.u * Math.PI * 3) * 0.3).setScale(size * (0.6 + 0.4 * Math.sin(t.u * Math.PI)));
      },
      onComplete: () => {
        this.sparkle(img.x, img.y, 40);
        this.scene.tweens.add({ targets: img, x: bag.x, y: bag.y, scale: size * 0.35, rotation: 0, duration: m.flyMs, ease: 'Quad.easeIn', onComplete: () => img.destroy() });
      },
    });
  }

  /** Hearts float up from a fish that is fond of you (1 to 3 by its hearts). */
  hearts(x: number, y: number, count: number) {
    const k = key(this.scene, AQUARIUM_VIEW.moments.heartArt);
    if (!k) return;
    for (let i = 0; i < count; i += 1) {
      const img = this.scene.add.image(x + (i - (count - 1) / 2) * 22, y, k).setDepth(AQUARIUM_VIEW.depth.sparkle).setAlpha(0);
      const s = 30 / img.width;
      img.setScale(s * 0.5);
      this.scene.tweens.add({ targets: img, y: y - 60 - i * 10, alpha: { from: 1, to: 0 }, scale: s, duration: 900, delay: i * 120, ease: 'Sine.easeOut', onComplete: () => img.destroy() });
    }
  }
}
