// The picture of one fish (GĐ14): the sprite is drawn as a strip of segments (a Phaser Rope) so its body can bend — a
// travelling wave that is strong at the tail and fades towards the head, like a fish beating its tail (or, by its
// swim style, a whole-body ripple, curling tentacles, flapping wing tips — swimStyles.ts). On the Canvas
// renderer (no Rope) it is a plain image. A zone over it takes the clicks (a bent strip has no simple hit shape).
// The sprites face right: the tail is on the left of the texture.
import * as Phaser from 'phaser';
import { bendAt, type BendMode } from './swimStyles';

const SEGMENTS = 14;

export class FishBody {
  readonly obj: Phaser.GameObjects.Rope | Phaser.GameObjects.Image;
  readonly hit: Phaser.GameObjects.Zone;
  private readonly rope: Phaser.GameObjects.Rope | null;
  private width = 1;
  private height = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string, depth: number) {
    const bendable = scene.renderer.type === Phaser.WEBGL;
    this.rope = bendable ? scene.add.rope(x, y, key) : null;
    this.obj = (this.rope ?? scene.add.image(x, y, key)).setDepth(depth);
    this.hit = scene.add.zone(x, y, 1, 1).setDepth(depth).setInteractive({ useHandCursor: true });
    this.measure();
  }

  private measure() {
    const f = this.obj.frame;
    this.width = f.width;
    this.height = f.height;
    if (this.rope) this.rope.setPoints(SEGMENTS);
  }

  setTexture(key: string) {
    this.obj.setTexture(key);
    this.measure();
  }

  setTint(colour: number) {
    if (this.rope) this.rope.setColors(colour);
    else (this.obj as Phaser.GameObjects.Image).setTint(colour);
  }

  /** Drawn size at the current scale. */
  get displayWidth(): number {
    return this.width * Math.abs(this.obj.scaleX);
  }

  get displayHeight(): number {
    return this.height * Math.abs(this.obj.scaleY);
  }

  /** Places the fish: where, which way, tilt, size; `phase` and `bend` (0..1 of its height) shape the tail beat. */
  pose(x: number, y: number, flip: boolean, rotation: number, sx: number, sy: number, phase: number, bend: number, mode: BendMode = 'tail') {
    this.obj.setPosition(x, y).setRotation(rotation).setScale(sx, sy);
    if (this.rope) {
      this.rope.setFlipX(flip);
      const pts = this.rope.points;
      const last = pts.length - 1;
      for (let i = 0; i <= last; i += 1) {
        // With the texture flipped the tail is on the right of the strip.
        const u = flip ? 1 - i / last : i / last;
        pts[i]!.y = bendAt(mode, u, phase, bend * this.height);
      }
      this.rope.setDirty();
    } else {
      (this.obj as Phaser.GameObjects.Image).setFlipX(flip);
    }
    const w = this.width * Math.abs(sx);
    const h = this.height * Math.abs(sy);
    this.hit.setPosition(x, y).setSize(w, h);
    this.hit.input?.hitArea.setTo(0, 0, w, h);
  }

  destroy() {
    this.obj.destroy();
    this.hit.destroy();
  }
}
