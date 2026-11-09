// A plant picture bending in a breeze (systems/animation/plantBend.ts): a vertical Rope that copies an Image's art, place, scale,
// depth and tint every frame and draws it bent on its stem. The Image keeps its job for everything else (tweens move it, other code reads
// it) but is drawn see-through while the bend shows. The Image's origin must be the middle of its bottom edge. WebGL only: the
// caller keeps the plain rotation without it (`BentPlant.canBend`).
import * as Phaser from 'phaser';
import { bendRows, type BendShape } from '../../systems/animation';

export class BentPlant {
  readonly rope: Phaser.GameObjects.Rope;
  private readonly verts: Float32Array;
  private key = '';
  private tint = -1;
  private on = false;

  static canBend(scene: Phaser.Scene): boolean {
    return scene.game.renderer.type === Phaser.WEBGL;
  }

  constructor(
    scene: Phaser.Scene,
    private readonly img: Phaser.GameObjects.Image,
    private readonly rows: number,
  ) {
    // A count of points spreads them evenly over the frame (Phaser takes a number though its typings say points).
    this.rope = scene.add.rope(img.x, img.y, img.texture.key, undefined, rows as unknown as Phaser.Types.Math.Vector2Like[], false).setVisible(false);
    this.verts = new Float32Array(rows * 4);
  }

  /** Draws the Image's picture bent: its top leans `amp` radians at sway phase `phase`. */
  draw(amp: number, phase: number, shape: BendShape) {
    const { img, rope } = this;
    if (!this.on) {
      this.on = true;
      img.setAlpha(0);
    }
    const key = img.texture.key;
    if (key !== this.key) {
      this.key = key;
      rope.setTexture(key);
      rope.setPoints(this.rows as unknown as Phaser.Types.Math.Vector2Like[]);
    }
    if (img.tintTopLeft !== this.tint) {
      this.tint = img.tintTopLeft;
      rope.setColors(this.tint);
    }
    rope.setVisible(img.visible).setPosition(img.x, img.y).setScale(img.scaleX, img.scaleY).setDepth(img.depth);
    bendRows(this.verts, this.rows, rope.frame.width, rope.frame.height, amp, phase, shape);
    rope.vertices.set(this.verts);
    rope.dirty = false;
  }

  /** Back to the plain Image (this flower does not bend, or motion is reduced). */
  off() {
    if (!this.on) return;
    this.on = false;
    this.img.setAlpha(1);
    this.rope.setVisible(false);
  }
}
