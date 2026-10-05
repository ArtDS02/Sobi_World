// World object dressing (farm layout rework): a soft shadow at the feet, the hover "boing" on
// clickable objects and the pulsing notification badge. Visual only.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../../../core/config/farmView';
import { SHADOW_LIGHT_KEY } from './DayNightLayer';

/** Flat ellipse under the object's feet, just below it in depth. */
export function addShadow(
  scene: Phaser.Scene,
  img: Phaser.GameObjects.Image,
): Phaser.GameObjects.Ellipse {
  const s = FARM_VIEW.SHADOW;
  const w = img.displayWidth * s.width;
  return scene.add
    .ellipse(img.x, img.y - w * s.height * 0.25, w, w * s.height, s.color, s.alpha)
    .setDepth(img.depth - 0.5);
}

/** The same soft shadow under a moving pig: follows its feet every layout. */
export class FeetShadow {
  private readonly shape: Phaser.GameObjects.Ellipse;

  constructor(private readonly scene: Phaser.Scene) {
    const s = FARM_VIEW.SHADOW;
    this.shape = scene.add.ellipse(0, 0, 1, 1, s.color, s.alpha);
  }

  follow(x: number, feetY: number, width: number, alpha: number) {
    const s = FARM_VIEW.SHADOW;
    this.shape
      .setPosition(x, feetY)
      .setSize(width * s.width, width * s.width * s.height)
      .setDepth(feetY - 0.6)
      // Day / night shadow strength (DN), 1 until the layer sets it.
      .setAlpha(alpha * ((this.scene.registry.get(SHADOW_LIGHT_KEY) as number | undefined) ?? 1));
  }

  hide() {
    this.shape.setVisible(false);
  }

  destroy() {
    this.shape.destroy();
  }
}

/** Squash-and-stretch pulse while the pointer enters a clickable object. */
export function addHover(
  scene: Phaser.Scene,
  img: Phaser.GameObjects.Image,
  reduceMotion: () => boolean,
) {
  const base = { x: img.scaleX, y: img.scaleY };
  const h = FARM_VIEW.HOVER;
  img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
    if (reduceMotion()) return;
    scene.tweens.killTweensOf(img);
    img.setScale(base.x, base.y);
    scene.tweens.add({
      targets: img,
      scaleX: base.x * h.scaleX,
      scaleY: base.y * h.scaleY,
      duration: h.ms,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => img.setScale(base.x, base.y),
    });
  });
}

/** Red count bubble at the object's top-right; hidden at 0. */
export class Badge {
  private readonly root: Phaser.GameObjects.Container;
  private readonly label: Phaser.GameObjects.Text;
  private readonly pulse: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    img: Phaser.GameObjects.Image,
    private readonly reduceMotion: () => boolean,
  ) {
    const b = FARM_VIEW.BADGE;
    const x = img.x + img.displayWidth * (1 - img.originX) - b.r * 1.2;
    const y = img.y - img.displayHeight * img.originY + b.r * 0.6;
    const ring = scene.add.circle(0, 0, b.r + b.ringPx, b.ring);
    const dot = scene.add.circle(0, 0, b.r, b.color);
    this.label = scene.add
      .text(0, 0, '', {
        color: '#ffffff',
        fontSize: `${b.fontPx}px`,
        fontFamily: FARM_VIEW.LABEL.fontFamily,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.root = scene.add
      .container(x, y, [ring, dot, this.label])
      .setDepth(img.depth + FARM_VIEW.LABEL.depthAbove)
      .setVisible(false);
    this.pulse = scene.tweens.add({
      targets: this.root,
      scale: b.pulse,
      duration: b.ms,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: reduceMotion(),
    });
  }

  set(count: number) {
    this.root.setVisible(count > 0);
    this.label.setText(String(count));
    const off = this.reduceMotion();
    if (off && !this.pulse.isPaused()) {
      this.pulse.pause();
      this.root.setScale(1);
    } else if (!off && this.pulse.isPaused()) this.pulse.resume();
  }
}
