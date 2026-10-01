// The fx_* overlays of one pig (sick, pregnant, zzz) on their anchors, layer 5 (spec §11,
// art standard §3, §5). Anchors mirror with the pig's facing.
import * as Phaser from 'phaser';
import { anchorOffset, type Anchors } from '../../core/assets/anchors';
import type { AnchorName, FxId } from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';
import { FALLBACK_FX_KEY } from '../view/textureKeys';

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
}

export class PigOverlays {
  private images: Phaser.GameObjects.Image[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  sync(f: OverlayFrame) {
    while (this.images.length > f.fx.length) this.images.pop()?.destroy();
    const size = FARM_VIEW.FX_DISPLAY_PX * f.scale;
    const step = size + FARM_VIEW.FX_STACK_GAP_PX * f.scale;
    const n = f.fx.length;
    f.fx.forEach((fx, i) => {
      const key = this.scene.textures.exists(fx) ? fx : FALLBACK_FX_KEY;
      const img = this.images[i] ?? this.scene.add.image(0, 0, key);
      this.images[i] = img;
      if (img.texture.key !== key) img.setTexture(key);
      const off = anchorOffset(f.anchors, f.anchorOf(fx), f.flipX, f.displayW, f.displayH);
      img
        .setDisplaySize(size, size)
        .setPosition(f.x + off.x + (i - (n - 1) / 2) * step, f.y + off.y)
        .setAlpha(f.alpha)
        .setDepth(FARM_VIEW.OVERLAY_DEPTH + f.depth);
    });
  }

  destroy() {
    for (const o of this.images) o.destroy();
    this.images = [];
  }
}
