// Sick tint of one pig (spec §11 table: green tint; §11.3 PIG_TREATED: the tint fades): full at
// once when the pig falls ill, fading out after a cure (instantly with reduceMotion).
import type * as Phaser from 'phaser';
import { FARM_VIEW } from '../config/farmView';

/** White (no tint) blended toward `tint` by `t` in 0..1, per channel. Pure. */
export function mixTint(tint: number, t: number): number {
  const ch = (shift: number) => {
    const c = (tint >> shift) & 0xff;
    return Math.round(0xff + (c - 0xff) * t) << shift;
  };
  return ch(16) | ch(8) | ch(0);
}

export class SickTint {
  /** 1 = full sick tint, 0 = none. */
  private readonly state = { level: 0 };
  private wasSick: boolean | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reduceMotion: () => boolean,
    private readonly onChange: () => void,
  ) {}

  follow(isSick: boolean) {
    const was = this.wasSick ?? isSick;
    this.wasSick = isSick;
    if (isSick) {
      this.scene.tweens.killTweensOf(this.state);
      this.state.level = 1;
    } else if (was) {
      // Just cured. Otherwise (healthy before and now) the level is 0 or still fading.
      this.scene.tweens.killTweensOf(this.state);
      if (this.reduceMotion()) this.state.level = 0;
      else {
        this.scene.tweens.add({
          targets: this.state,
          level: 0,
          duration: FARM_VIEW.SICK_TINT_FADE_MS,
          onUpdate: this.onChange,
        });
      }
    }
  }

  apply(image: Phaser.GameObjects.Image) {
    if (this.state.level <= 0) image.clearTint();
    else image.setTint(mixTint(FARM_VIEW.SICK_TINT, this.state.level));
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.state);
  }
}
