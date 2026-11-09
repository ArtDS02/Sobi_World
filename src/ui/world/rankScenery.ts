// Draws the rank scenery of a cloud tier / garden zone (decision 056) over a scene's backdrop: the layers of
// systems/animation/rankScenery.ts, shown by the group on screen and its rank. Motion (a creature's bob, the halo's breath,
// the lanterns' flicker at night) is code on the frame loop, so it works without WebGL; reduced motion freezes it.
import type * as Phaser from 'phaser';
import { driftPose, frameColor, sceneryMotion, type RankFrame, type SceneryLayer } from '../../systems/animation/rankScenery';

type Img = Phaser.GameObjects.Image;

/** What a plot skin asks of the scenery (core/config/plotSkins.ts SkinTheme). */
export type SceneryTheme = { scenery: number; frame: number; particles: 'petal' | 'firefly' | 'both' | 'none' };

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

  private readonly frame: Phaser.GameObjects.Graphics | null;

  /** `fixed` makes an image of fixed art (the scene re-points it when its texture arrives late); `frame` is the rank frame around the plots. */
  constructor(
    scene: Phaser.Scene,
    layers: readonly SceneryLayer[],
    fixed: (x: number, y: number, id: string) => Img,
    private readonly frameRect?: RankFrame,
  ) {
    this.frame = frameRect ? scene.add.graphics().setDepth(frameRect.depth) : null;
    this.drawn = layers.map((layer) => {
      const arts = layer.drift ? Array.from({ length: layer.drift.count }, () => layer.art as string) : typeof layer.art === 'string' ? [layer.art] : layer.art;
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
  draw(group: number, rank: number, theme: SceneryTheme | null = null) {
    this.group = group;
    this.rank = rank;
    this.drawFrame(rank, theme?.frame);
    for (const { layer, images } of this.drawn) {
      const parts = theme?.particles ?? 'both';
      const wanted = layer.kind === 'petal' ? parts === 'petal' || parts === 'both' : layer.kind === 'firefly' ? parts === 'firefly' || parts === 'both' : true;
      const on = wanted && layer.minRank <= rank && rank <= (layer.maxRank ?? 5);
      images.forEach((img, i) => {
        img.setVisible(on && (layer.drift !== undefined || images.length === 1 || i === group));
        // The skin's mood tints the whole scenery so it agrees with the plots; additive glows keep their own light.
        if (theme && !layer.additive) img.setTint(theme.scenery);
        else img.clearTint();
      });
    }
  }

  private drawFrame(rank: number, themed?: number) {
    const f = this.frameRect;
    const colour = frameColor(rank) === null ? null : (themed ?? frameColor(rank));
    this.frame?.clear();
    if (!f || colour === null) return;
    this.frame?.lineStyle(10, colour, 0.85).strokeRoundedRect(f.x, f.y, f.width, f.height, 36);
  }

  /** One frame of motion. */
  update(timeMs: number, night: boolean, still: boolean) {
    for (const { layer, images, baseY } of this.drawn) {
      if (layer.minRank > this.rank || this.rank > (layer.maxRank ?? 5)) continue;
      if (layer.drift) {
        const d = layer.drift;
        images.forEach((img, i) => {
          const p = driftPose(layer.kind, d, i, timeMs, still);
          img.setPosition(p.x, p.y).setAlpha(p.alpha);
        });
        continue;
      }
      const pose = sceneryMotion(layer.kind, timeMs, night, still);
      for (const img of images) img.setY(baseY + pose.dy).setAlpha(pose.alpha);
    }
  }

  /** The group and rank last drawn (for tests and the scene's change detection). */
  get shown(): { group: number; rank: number } {
    return { group: this.group, rank: this.rank };
  }
}
