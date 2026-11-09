// Draws the rank scenery of a cloud tier / garden zone (decision 056) over a scene's backdrop: the layers of
// systems/animation/rankScenery.ts, shown by the group on screen and its rank. Motion (a creature's bob, the halo's breath,
// the lanterns' flicker at night) is code on the frame loop, so it works without WebGL; reduced motion freezes it.
import type * as Phaser from 'phaser';
import { sceneryMotion, type SceneryLayer } from '../../systems/animation/rankScenery';

type Img = Phaser.GameObjects.Image;

interface Drawn {
  layer: SceneryLayer;
  /** One image per art id (landmarks have one per group; the others one). */
  images: Img[];
  baseY: number;
}

export class RankScenery {
  private readonly drawn: Drawn[];
  private group = 0;
  private rank = 1;

  /** `fixed` makes an image of fixed art (the scene re-points it when its texture arrives late). */
  constructor(layers: readonly SceneryLayer[], fixed: (x: number, y: number, id: string) => Img) {
    this.drawn = layers.map((layer) => {
      const arts = typeof layer.art === 'string' ? [layer.art] : layer.art;
      const images = arts.map((id) => {
        const img = fixed(layer.x, layer.y, id).setDepth(layer.depth).setScale(layer.scale ?? 1).setVisible(false);
        if (layer.feet) img.setOrigin(0.5, 1);
        if (layer.additive) img.setBlendMode('ADD');
        return img;
      });
      return { layer, images, baseY: layer.y };
    });
  }

  /** Shows the layers of `rank` for group `group` (a landmark only for its own tier / zone). */
  draw(group: number, rank: number) {
    this.group = group;
    this.rank = rank;
    for (const { layer, images } of this.drawn) {
      const on = layer.minRank <= rank;
      images.forEach((img, i) => img.setVisible(on && (images.length === 1 || i === group)));
    }
  }

  /** One frame of motion. */
  update(timeMs: number, night: boolean, still: boolean) {
    for (const { layer, images, baseY } of this.drawn) {
      if (layer.minRank > this.rank) continue;
      const pose = sceneryMotion(layer.kind, timeMs, night, still);
      for (const img of images) img.setY(baseY + pose.dy).setAlpha(pose.alpha);
    }
  }

  /** The group and rank last drawn (for tests and the scene's change detection). */
  get shown(): { group: number; rank: number } {
    return { group: this.group, rank: this.rank };
  }
}
