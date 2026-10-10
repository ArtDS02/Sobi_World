// Alpha fade behind buildings (spec: readable character): a placement marked `fade` turns about half see-through
// while the character is behind it (drawn before it in depth order and overlapping its art), and comes back as
// soon as they step out. The opacity glides, so standing on the border never flickers.
import type * as Phaser from 'phaser';
import type { Rect, Vec } from '../../../systems/character';
import { PLAZA_AMBIENT } from './ambientConfig';

interface Faded {
  img: Phaser.GameObjects.Image;
  bounds: Rect;
  alpha: number;
}

export class FadeBehind {
  private readonly items: Faded[] = [];

  add(img: Phaser.GameObjects.Image, bounds: Rect) {
    this.items.push({ img, bounds, alpha: 1 });
  }

  /** `feet` = the character's feet; `body` = how big the sprite is (design px). */
  update(dtMs: number, feet: Vec, body: { halfWidth: number; height: number }) {
    const F = PLAZA_AMBIENT.fade;
    const k = Math.min(1, (F.ratePerSecond * dtMs) / 1000);
    const top = feet.y - body.height;
    for (const it of this.items) {
      const b = it.bounds;
      const behind =
        feet.y < b.y + b.height &&
        feet.x + body.halfWidth > b.x - F.marginPx &&
        feet.x - body.halfWidth < b.x + b.width + F.marginPx &&
        feet.y > b.y &&
        top < b.y + b.height;
      const target = behind ? F.behindAlpha : 1;
      if (it.alpha === target) continue;
      it.alpha += (target - it.alpha) * k;
      if (Math.abs(it.alpha - target) < 0.01) it.alpha = target;
      it.img.setAlpha(it.alpha);
    }
  }

  /** Everything solid again (the scene sleeps or is destroyed). */
  reset() {
    for (const it of this.items) {
      it.alpha = 1;
      it.img.setAlpha(1);
    }
  }
}
