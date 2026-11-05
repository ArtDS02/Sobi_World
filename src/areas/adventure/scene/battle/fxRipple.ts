// prop_displace (decision 049): a prop picture laid on a Phaser Rope so it bends along a travelling wave (ui/propMotion.ts rippleOffsets)
// — a wave crest that flows, a whale that swims — instead of a still picture only moved. It answers the same calls fxProps.ts makes on
// an Image, so every prop path can use it. WebGL only: the caller draws a plain Image otherwise.
import * as Phaser from 'phaser';
import type { PropMods } from '../../ui/propMotion';
import { rippleOffsets } from '../../ui/propMotion';

/** What fxProps.ts needs from the picture of a prop (an Image, or a RippleProp). */
export interface PropPicture {
  x: number;
  y: number;
  rotation: number;
  readonly width: number;
  readonly height: number;
  setDepth(v: number): PropPicture;
  setBlendMode(v: Phaser.BlendModes): PropPicture;
  setTint(c: number): PropPicture;
  setFlipX(v: boolean): PropPicture;
  setOrigin(x: number, y: number): PropPicture;
  setPosition(x: number, y: number): PropPicture;
  setDisplaySize(w: number, h: number): PropPicture;
  setAlpha(a: number): PropPicture;
  setRotation(r: number): PropPicture;
  destroy(): void;
}

/** Points along the picture's width: enough for a smooth bend, few enough to stay cheap. */
const SEGMENTS = 24;

export class RippleProp implements PropPicture {
  private readonly rope: Phaser.GameObjects.Rope;
  private readonly fw: number;
  private readonly fh: number;
  private originY = 0.5;

  constructor(
    scene: Phaser.Scene,
    key: string,
    private readonly ripple: NonNullable<PropMods['ripple']>,
  ) {
    const frame = scene.textures.getFrame(key);
    this.fw = frame.width;
    this.fh = frame.height;
    // The strip's points, centred: from the left edge to the right edge of the picture.
    const points = Array.from({ length: SEGMENTS }, (_, i) => ({ x: -this.fw / 2 + (this.fw * i) / (SEGMENTS - 1), y: 0 }));
    this.rope = scene.add.rope(0, 0, key, undefined, points, true);
  }

  get x() {
    return this.rope.x;
  }
  set x(v: number) {
    this.rope.x = v;
  }
  get y() {
    return this.rope.y;
  }
  set y(v: number) {
    this.rope.y = v;
  }
  get rotation() {
    return this.rope.rotation;
  }
  set rotation(v: number) {
    this.rope.rotation = v;
  }
  get width() {
    return this.fw;
  }
  get height() {
    return this.fh;
  }

  setDepth(v: number) {
    this.rope.setDepth(v);
    return this;
  }
  setBlendMode(v: Phaser.BlendModes) {
    this.rope.setBlendMode(v);
    return this;
  }
  setTint(c: number) {
    this.rope.setColors(c);
    return this;
  }
  setFlipX(v: boolean) {
    this.rope.setFlipX(v);
    return this;
  }
  /** Only the vertical origin matters (the strip is centred across): 1 stands the picture on its bottom edge. */
  setOrigin(_x: number, y: number) {
    this.originY = y;
    return this;
  }
  setPosition(x: number, y: number) {
    this.rope.setPosition(x, y);
    return this;
  }
  setDisplaySize(w: number, h: number) {
    this.rope.setScale(w / Math.max(1, this.fw), h / Math.max(1, this.fh));
    return this;
  }
  setAlpha(a: number) {
    this.rope.setAlpha(a);
    return this;
  }
  setRotation(r: number) {
    this.rope.setRotation(r);
    return this;
  }

  /** Bend the strip for `time` seconds into the act. */
  bend(time: number) {
    const off = rippleOffsets(this.ripple, this.rope.points.length, time);
    const base = (0.5 - this.originY) * this.fh;
    this.rope.points.forEach((p, i) => {
      p.y = base + off[i]! * this.fh;
    });
    this.rope.setDirty();
  }

  destroy() {
    this.rope.destroy();
  }
}

/** Whether ripples can be drawn here (a Rope needs WebGL). */
export const canRipple = (scene: Phaser.Scene) => scene.renderer.type === Phaser.WEBGL;
