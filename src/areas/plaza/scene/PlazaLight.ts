// The plaza's light of the day (day / night, spec §3.1 mood): one multiply layer over the world, tinted by the
// same day-night look the farm uses, from the player's local clock. Polled slowly; a change glides in.
import * as Phaser from 'phaser';
import { DAY_NIGHT } from '../../../core/config/dayNight';
import { dayScene, mixColor, minuteOf } from '../../../core/engine/dayNight';
import { PLAZA_AMBIENT } from './ambientConfig';

export interface LightLevel {
  /** 0..1: how much the lamps shine. */
  lights: number;
  /** Multiplier of the shadows' strength. */
  shadow: number;
}

export class PlazaLight {
  private readonly layer: Phaser.GameObjects.Rectangle;
  private readonly timer: Phaser.Time.TimerEvent;
  private tween: Phaser.Tweens.Tween | null = null;
  private colour = 0xffffff;

  constructor(
    private readonly scene: Phaser.Scene,
    frame: { width: number; height: number },
    private readonly now: () => number,
    private readonly onLevel: (level: LightLevel) => void,
  ) {
    const L = PLAZA_AMBIENT.light;
    const bleed = Math.max(frame.width, frame.height) * 2;
    this.layer = scene.add
      .rectangle(frame.width / 2, frame.height / 2, bleed * 2, bleed * 2, 0xffffff)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(L.depth);
    this.timer = scene.time.addEvent({ delay: L.pollMs, loop: true, callback: () => this.refresh() });
    this.refresh(true);
  }

  /** Reads the clock now (also when the scene wakes up after a stay in an Area). */
  refresh(instant = false) {
    const L = PLAZA_AMBIENT.light;
    const date = new Date(this.now());
    const scene = dayScene(minuteOf(date.getHours(), date.getMinutes()), DAY_NIGHT);
    // Only part of the look's tint is used, so the character stays easy to see at night.
    const target = mixColor(0xffffff, scene.look.ambient, L.strength);
    this.onLevel({ lights: scene.look.lights, shadow: scene.look.shadow });
    if (target === this.colour) return;
    this.tween?.stop();
    if (instant) {
      this.colour = target;
      this.layer.setFillStyle(target);
      return;
    }
    const from = this.colour;
    const state = { t: 0 };
    this.tween = this.scene.tweens.add({
      targets: state,
      t: 1,
      duration: L.transitionMs,
      onUpdate: () => {
        this.colour = mixColor(from, target, state.t);
        this.layer.setFillStyle(this.colour);
      },
    });
  }

  destroy() {
    this.timer.remove();
    this.tween?.stop();
    this.layer.destroy();
  }
}
