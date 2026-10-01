// One pig on the farm canvas (spec §11, §11.2): applies a PigView, never computes game state.
// Base image + selection marker under the feet + fx overlays on their anchors (layer 5).
import * as Phaser from 'phaser';
import { anchorOffset, type Anchors } from '../../core/assets/anchors';
import { PIG_FEET_Y, type AnchorName, type FxId } from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';
import type { PigView } from '../view/pigView';
import { FALLBACK_FX_KEY } from '../view/textureKeys';

export const PIG_ID_DATA = 'pigId';

export class PigSprite {
  private readonly image: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Ellipse;
  private overlays: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    pigId: string,
    view: PigView,
  ) {
    const sel = FARM_VIEW.SELECTION;
    this.marker = scene.add
      .ellipse(0, 0, 1, 1, sel.color, sel.alpha)
      .setStrokeStyle(sel.strokeWidth, sel.stroke)
      .setVisible(false);
    this.image = scene.add
      .image(view.x, view.y, this.textureFor(view))
      .setOrigin(0.5, PIG_FEET_Y)
      .setData(PIG_ID_DATA, pigId)
      .setInteractive({
        pixelPerfect: true,
        alphaTolerance: FARM_VIEW.HIT_ALPHA,
        useHandCursor: true,
      });
  }

  private textureFor(view: PigView): string {
    return this.scene.textures.exists(view.textureId) ? view.textureId : view.fallbackId;
  }

  apply(view: PigView, anchors: Anchors, selected: boolean, anchorOf: (fx: FxId) => AnchorName) {
    const key = this.textureFor(view);
    if (this.image.texture.key !== key) {
      this.image.setTexture(key);
      // The pixel-perfect hit area keeps its first size; follow the new frame.
      (this.image.input?.hitArea as Phaser.Geom.Rectangle | undefined)?.setSize(
        this.image.width,
        this.image.height,
      );
    }
    const displayH = FARM_VIEW.PIG_DISPLAY_PX * view.scale;
    this.image
      .setScale(displayH / this.image.height)
      .setPosition(view.x, view.y)
      .setFlipX(view.flipX)
      .setDepth(view.depth);
    const displayW = this.image.displayWidth;

    const sel = FARM_VIEW.SELECTION;
    this.marker
      .setPosition(view.x, view.y)
      .setSize(displayW * sel.width, displayH * sel.height)
      .setDepth(view.depth - 0.5)
      .setVisible(selected);

    this.syncOverlays(view, anchors, anchorOf, displayW, displayH);
  }

  private syncOverlays(
    view: PigView,
    anchors: Anchors,
    anchorOf: (fx: FxId) => AnchorName,
    displayW: number,
    displayH: number,
  ) {
    while (this.overlays.length > view.overlays.length) this.overlays.pop()?.destroy();
    const size = FARM_VIEW.FX_DISPLAY_PX * view.scale;
    const step = size + FARM_VIEW.FX_STACK_GAP_PX * view.scale;
    const n = view.overlays.length;
    view.overlays.forEach((fx, i) => {
      const key = this.scene.textures.exists(fx) ? fx : FALLBACK_FX_KEY;
      const img = this.overlays[i] ?? this.scene.add.image(0, 0, key);
      this.overlays[i] = img;
      if (img.texture.key !== key) img.setTexture(key);
      const off = anchorOffset(anchors, anchorOf(fx), view.flipX, displayW, displayH);
      img
        .setDisplaySize(size, size)
        .setPosition(view.x + off.x + (i - (n - 1) / 2) * step, view.y + off.y)
        .setDepth(FARM_VIEW.OVERLAY_DEPTH + view.depth);
    });
  }

  destroy() {
    this.image.destroy();
    this.marker.destroy();
    for (const o of this.overlays) o.destroy();
    this.overlays = [];
  }
}
