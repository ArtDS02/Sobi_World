// The picture of one fish (GĐ14): the sprite is drawn as a strip of segments (a Phaser Rope) so its body can bend — a
// travelling wave that is strong at the tail and fades towards the head, like a fish beating its tail (or, by its
// swim style, a whole-body ripple, curling tentacles, flapping wing tips — swimStyles.ts). On the Canvas
// renderer (no Rope) it is a plain image. A zone over it takes the clicks (a bent strip has no simple hit shape).
// The sprites face right: the tail is on the left of the texture.
// A species with drawn swim frames (decision 050 (5)) shows them in turn with the tail beat (swimFrameAt): the strip wears
// the frame that holds, a second strip bent the same way dissolves the next one in over it, and the coded bend is kept
// small (DRAWN_BEND) since the drawings already move the tail. Holding still it shows its plain picture.
import * as Phaser from 'phaser';
import { bendAt, DRAWN_BEND, swimFrameAt, type BendMode } from './swimStyles';

const SEGMENTS = 14;

export class FishBody {
  readonly obj: Phaser.GameObjects.Rope | Phaser.GameObjects.Image;
  readonly hit: Phaser.GameObjects.Zone;
  private readonly rope: Phaser.GameObjects.Rope | null;
  private width = 1;
  private height = 1;
  private key: string;
  /** Texture keys of the drawn swim frames (move 1, 2, 3), or none. */
  private frames: readonly string[] = [];
  /** The next frame dissolving in (a strip on top), made when frames are set. */
  private next: Phaser.GameObjects.Rope | null = null;
  private tint = 0xffffff;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    depth: number,
    /** The species art, for its drawn swim frames (none: code bend only). */
    art = '',
  ) {
    this.key = key;
    const bendable = scene.renderer.type === Phaser.WEBGL;
    this.rope = bendable ? scene.add.rope(x, y, key) : null;
    this.obj = (this.rope ?? scene.add.image(x, y, key)).setDepth(depth);
    this.hit = scene.add.zone(x, y, 1, 1).setDepth(depth).setInteractive({ useHandCursor: true });
    this.measure();
    if (art) this.useFramesOf(art);
  }

  private measure() {
    const f = this.obj.frame;
    this.width = f.width;
    this.height = f.height;
    if (this.rope) this.rope.setPoints(SEGMENTS);
  }

  setTexture(key: string) {
    this.key = key;
    this.show(key);
  }

  /** Uses species art `art`'s drawn swim frames (`<art>_swim1..3`) once all three are loaded; until then the plain picture. */
  useFramesOf(art: string) {
    const keys = [1, 2, 3].map((k) => `${art}_swim${k}`);
    this.setFrames(art && keys.every((k) => this.scene.textures.exists(k)) ? keys : []);
  }

  /** The drawn swim frames (all three, the same size), or [] for the plain picture bent by code only. */
  setFrames(keys: readonly string[]) {
    if (keys.join() === this.frames.join()) return;
    this.frames = keys.length === 3 ? keys : [];
    if (this.frames.length && this.rope && !this.next) {
      this.next = this.scene.add.rope(this.obj.x, this.obj.y, this.frames[1]!).setDepth(this.obj.depth).setVisible(false);
      this.next.setPoints(SEGMENTS);
      this.next.setColors(this.tint);
    }
    if (!this.frames.length) this.next?.setVisible(false);
    this.show(this.frames[0] ?? this.key);
  }

  /** Puts a picture on the strip; re-measures only when its size changes. */
  private show(key: string) {
    if (this.obj.texture.key === key) return;
    const before = `${this.width}x${this.height}`;
    this.obj.setTexture(key);
    const f = this.obj.frame;
    if (`${f.width}x${f.height}` !== before) this.measure();
    if (this.rope) this.rope.setColors(this.tint);
  }

  setTint(colour: number) {
    this.tint = colour;
    if (this.rope) this.rope.setColors(colour);
    else (this.obj as Phaser.GameObjects.Image).setTint(colour);
    this.next?.setColors(colour);
  }

  /** Drawn size at the current scale. */
  get displayWidth(): number {
    return this.width * Math.abs(this.obj.scaleX);
  }

  get displayHeight(): number {
    return this.height * Math.abs(this.obj.scaleY);
  }

  /**
   * Places the fish: where, which way, tilt, size; `phase` and `bend` (0..1 of its height) shape the tail beat. `swim` false
   * (holding still) shows the plain picture even when the species has drawn frames.
   */
  pose(x: number, y: number, flip: boolean, rotation: number, sx: number, sy: number, phase: number, bend: number, mode: BendMode = 'tail', swim = true) {
    const drawn = swim && this.frames.length === 3;
    const at = drawn ? swimFrameAt(phase) : null;
    this.show(at ? this.frames[at.from]! : this.key);
    if (drawn) bend *= DRAWN_BEND;
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
      const next = this.next;
      if (next) {
        const on = !!at && at.w > 0 && at.from !== at.to;
        next.setVisible(on);
        if (on) {
          if (next.texture.key !== this.frames[at.to]) next.setTexture(this.frames[at.to]!).setColors(this.tint);
          next.setPosition(x, y).setRotation(rotation).setScale(sx, sy).setFlipX(flip).setAlpha(at.w).setDepth(this.obj.depth);
          const top = next.points;
          for (let i = 0; i < top.length; i += 1) top[i]!.y = pts[i]!.y;
          next.setDirty();
        }
      }
    } else {
      (this.obj as Phaser.GameObjects.Image).setFlipX(flip);
    }
    const w = this.width * Math.abs(sx);
    const h = this.height * Math.abs(sy);
    this.hit.setPosition(x, y).setSize(w, h);
    this.hit.input?.hitArea.setTo(0, 0, w, h);
  }

  destroy() {
    this.next?.destroy();
    this.obj.destroy();
    this.hit.destroy();
  }
}
