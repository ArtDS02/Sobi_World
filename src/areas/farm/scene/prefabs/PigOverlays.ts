// The fx_* overlays of one pig (sick, pregnant, zzz) on their anchors, layer 5 (spec §11,
// art standard §3, §5). Anchors mirror with the pig's facing; multi-frame fx (fx_zzz) animate
// unless reduceMotion is on.
import * as Phaser from 'phaser';
import type { Anchors } from '../../../../core/assets/anchors';
import type { AnchorName, FxId } from '../../../../core/config/assetIds';
import { FARM_VIEW } from '../config/farmView';
import { overlayLayout } from '../view/overlayLayout';
import { FALLBACK_FX_KEY, fxAnimKey } from '../view/textureKeys';

export interface OverlayFrame {
  fx: readonly FxId[];
  anchors: Anchors;
  anchorOf: (fx: FxId) => AnchorName;
  flipX: boolean;
  /** Pig scale (growth × depth) and Y-sort depth. */
  scale: number;
  depth: number;
  displayW: number;
  displayH: number;
  /** Pig feet position. */
  x: number;
  y: number;
  alpha: number;
  /** Play multi-frame overlays (off with reduceMotion: first frame only). */
  animate: boolean;
}

export class PigOverlays {
  private sprites: Phaser.GameObjects.Sprite[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  sync(f: OverlayFrame) {
    while (this.sprites.length > f.fx.length) this.sprites.pop()?.destroy();
    const placed = overlayLayout(f);
    f.fx.forEach((fx, i) => {
      const key = this.scene.textures.exists(fx) ? fx : FALLBACK_FX_KEY;
      const sprite = this.sprites[i] ?? this.scene.add.sprite(0, 0, key);
      this.sprites[i] = sprite;
      if (sprite.texture.key !== key) sprite.setTexture(key);
      this.animate(sprite, fx, f.animate);
      const p = placed[i]!;
      sprite
        .setDisplaySize(p.size, p.size)
        .setPosition(p.x, p.y)
        .setAlpha(f.alpha)
        .setDepth(FARM_VIEW.OVERLAY_DEPTH + f.depth);
    });
  }

  private animate(sprite: Phaser.GameObjects.Sprite, fx: FxId, on: boolean) {
    const anim = fxAnimKey(fx);
    if (!this.scene.anims.exists(anim)) return;
    if (!on) {
      if (sprite.anims.isPlaying) sprite.anims.stop();
      sprite.setFrame(0);
    } else if (sprite.anims.currentAnim?.key !== anim || !sprite.anims.isPlaying) {
      sprite.play(anim);
    }
  }

  destroy() {
    for (const s of this.sprites) s.destroy();
    this.sprites = [];
  }
}
