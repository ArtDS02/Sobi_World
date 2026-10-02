// Painted farm backdrop (farm layout rework): one canvas texture under the world, redrawn to the
// camera view on resize (painter: view/backdropPaint.ts). The sky above it is the day / night
// layer (DN), which gets the same view rect.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { fitCamera } from '../config/phaser';
import { backdropRect, type WorldRect } from '../view/farmCamera';
import type { FarmLayout } from '../view/pigView';
import { paintBackdrop } from '../view/backdropPaint';
import { DAY_NIGHT_VIEW } from '../../core/config/dayNight';

const KEY = 'farm_backdrop';

/**
 * The backdrop image under everything. `redraw` paints the given world rect (the camera view,
 * which can be wider or taller than the design frame); painting is in world coordinates.
 */
export class Backdrop {
  private image: Phaser.GameObjects.Image | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  /**
   * Fits the scene camera to the design frame and repaints the backdrop on every resize; `onRect`
   * gets the same painted rect (the day / night sky follows it).
   */
  static follow(scene: Phaser.Scene, layout: FarmLayout, onRect: (rect: WorldRect) => void) {
    const backdrop = new Backdrop(scene);
    const { width, height } = layout.designSize;
    fitCamera(scene, layout, (view) => {
      const rect = backdropRect(view, width, height, FARM_VIEW.VIEW_MAX_EXTEND);
      backdrop.redraw(rect);
      onRect(rect);
    });
  }

  redraw(rect: WorldRect) {
    const { scene } = this;
    if (scene.textures.exists(KEY)) {
      this.image?.destroy();
      scene.textures.remove(KEY);
    }
    const tex = scene.textures.createCanvas(KEY, rect.width, rect.height);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.translate(-rect.x, -rect.y);
    paintBackdrop(ctx, rect);
    tex.refresh();
    this.image = scene.add.image(rect.x, rect.y, KEY).setOrigin(0).setDepth(DAY_NIGHT_VIEW.backdropDepth);
  }
}
