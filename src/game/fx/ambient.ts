// Ambient life on the farm (spec §11.1, R12A): clouds drift and wrap around, trees and the grass
// sway gently. Visual only; everything stops while reduceMotion is on (spec §10.4).
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { ambientKind, driftX } from '../view/ambientMotion';

type Placed = Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;

export class Ambient {
  private readonly drifting: Placed[] = [];
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private paused = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reduceMotion: () => boolean,
  ) {}

  add(id: string, obj: Placed) {
    const kind = ambientKind(id);
    if (kind === 'drift') this.drifting.push(obj);
    else if (kind === 'sway') this.tweens.push(this.sway(obj));
    this.sync();
  }

  private sway(obj: Placed): Phaser.Tweens.Tween {
    const A = FARM_VIEW.AMBIENT;
    if (obj instanceof Phaser.GameObjects.TileSprite) {
      return this.scene.tweens.add({
        targets: obj,
        tilePositionX: obj.tilePositionX + A.grassPx,
        duration: A.sway.ms,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    return this.scene.tweens.add({
      targets: obj,
      scaleY: obj.scaleY * (1 + A.sway.scaleY),
      x: obj.x + A.sway.dxPx,
      duration: A.sway.ms,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Follow settings.reduceMotion (called on every store sync). */
  sync() {
    const off = this.reduceMotion();
    if (off === this.paused) return;
    this.paused = off;
    for (const t of this.tweens) {
      if (off) t.pause();
      else t.resume();
    }
  }

  /** Scene update step. */
  update(dtMs: number) {
    if (this.paused) return;
    const width = this.scene.scale.gameSize.width;
    for (const c of this.drifting) c.x = driftX(c.x, c.displayWidth / 2, width, dtMs);
  }
}
