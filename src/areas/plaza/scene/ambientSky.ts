// The plaza's sky and shore: clouds drifting over the top, foam lapping the sea's edge, sparkles on the water.
// Waves and sparkles are looping tweens (no per-frame work); clouds move in one cheap loop.
import * as Phaser from 'phaser';
import type { GroundShape, PlazaLayout } from '../../../../content/schemas/plaza/layout';
import { DOT } from '../../../ui/world/softTextures';
import { textureKey } from '../../../ui/world/keys';
import { PLAZA_AMBIENT } from './ambientConfig';

type Ellipse = Extract<GroundShape, { kind: 'ellipse' }>;

export class Clouds {
  private readonly items: { img: Phaser.GameObjects.Image; speed: number }[] = [];

  constructor(scene: Phaser.Scene, layout: PlazaLayout) {
    const c = PLAZA_AMBIENT.clouds;
    const { width, height } = layout.designSize;
    c.ids.forEach((id, i) => {
      const key = textureKey(id);
      if (!scene.textures.exists(key)) return;
      const img = scene.add.image(0, 0, key).setOrigin(0.5, 0.5).setAlpha(c.alpha).setDepth(c.depth);
      img.setScale(c.widths[i % c.widths.length]! / img.width);
      const y = (c.band.from + ((i + 0.5) / c.ids.length) * (c.band.to - c.band.from)) * height;
      // Spread them over the whole width at the start, so the sky is never empty.
      img.setPosition(((i + 0.5) / c.ids.length) * width, y);
      this.items.push({ img, speed: c.speeds[i % c.speeds.length]! });
    });
  }

  update(dtMs: number, frameWidth: number) {
    for (const { img, speed } of this.items) {
      img.x += (speed * dtMs) / 1000;
      const half = img.displayWidth / 2;
      if (img.x - half > frameWidth) img.x = -half;
    }
  }

  destroy() {
    for (const { img } of this.items) img.destroy();
    this.items.length = 0;
  }
}

/** Foam lines creeping up to the shore and fading, and a few sparkles; both only over the part of the sea in view. */
export class Shore {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly scene: Phaser.Scene, layout: PlazaLayout) {
    const water = layout.ground.find((g): g is Ellipse => g.kind === 'ellipse' && g.fill === 'water');
    if (!water) return;
    const { width, height } = layout.designSize;
    const cx = water.x * width;
    const cy = water.y * height;
    const rx = (water.width * width) / 2;
    const ry = (water.height * height) / 2;
    const w = PLAZA_AMBIENT.water;
    const inView = (x: number, y: number) => x >= 0 && x <= width && y >= 0 && y <= height;
    for (let i = 0; i < w.waves; i++) {
      // Angles of the rim that are inside the frame, spread evenly.
      const angle = -Math.PI / 2 + ((i + 0.5) / w.waves) * (Math.PI / 2);
      const px = cx + Math.cos(angle) * rx;
      const py = cy + Math.sin(angle) * ry;
      if (!inView(px, py)) continue;
      const g = scene.add.graphics().setDepth(w.depth);
      g.lineStyle(w.lineWidth, w.color, 1);
      const pts: Phaser.Math.Vector2[] = [];
      for (let k = -4; k <= 4; k++) {
        const a = angle + k * 0.035;
        pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * (rx - 6), cy + Math.sin(a) * (ry - 6)));
      }
      g.strokePoints(pts, false);
      g.setAlpha(0);
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      scene.tweens.add({
        targets: g,
        alpha: { from: 0, to: w.alpha },
        x: { from: -nx * w.travel, to: nx * 4 },
        y: { from: -ny * w.travel, to: ny * 4 },
        duration: w.periodMs,
        delay: (i * w.periodMs) / w.waves,
        repeat: -1,
        ease: 'Sine.easeInOut',
        yoyo: false,
        onRepeat: () => g.setAlpha(0),
      });
      this.objects.push(g);
    }
    for (let i = 0; i < w.sparkles; i++) {
      const angle = -Math.PI / 2 + ((i * 0.618) % 1) * (Math.PI / 2);
      const r = 0.45 + ((i * 0.37) % 0.45);
      const x = cx + Math.cos(angle) * rx * r;
      const y = cy + Math.sin(angle) * ry * r;
      if (!inView(x, y)) continue;
      const s = scene.add.image(x, y, DOT).setDepth(w.depth + 1).setAlpha(0).setScale(1.2);
      scene.tweens.add({
        targets: s,
        alpha: { from: 0, to: 0.95 },
        duration: 700 + (i % 4) * 160,
        delay: i * 380,
        yoyo: true,
        repeat: -1,
        repeatDelay: 900 + (i % 3) * 700,
      });
      this.objects.push(s);
    }
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.objects);
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
  }
}
