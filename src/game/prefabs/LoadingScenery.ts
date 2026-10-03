// Scenery of the loading screen (DECISIONS AM-1): the season's painted farm backdrop under a morning
// sky, drifting clouds, crop beds, a front wooden fence, swaying grass tufts, rising sparkles and a
// few falling leaves. Shapes only (nothing is loaded yet); every motion is skipped with reduceMotion.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { LOADING_SCREEN as L } from '../../core/config/loadingScreen';
import { SEASON_LOOKS, type SeasonId } from '../../core/config/seasons';
import { fitCamera } from '../config/phaser';
import { backdropRect } from '../view/farmCamera';
import { paintBackdrop } from '../view/backdropPaint';
import type { FarmLayout } from '../view/pigView';

const KEY = 'preload_backdrop';

export function drawLoadingScenery(scene: Phaser.Scene, layout: FarmLayout, season: SeasonId, still: boolean) {
  const { width, height } = layout.designSize;
  fitCamera(scene, layout, (view) => paintSky(scene, backdropRect(view, width, height, FARM_VIEW.VIEW_MAX_EXTEND), season));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    if (scene.textures.exists(KEY)) scene.textures.remove(KEY);
  });
  clouds(scene, still);
  crops(scene);
  fence(scene);
  grass(scene, still);
  if (still) return;
  sparkles(scene);
  leaves(scene);
}

function paintSky(scene: Phaser.Scene, rect: { x: number; y: number; width: number; height: number }, season: SeasonId) {
  if (scene.textures.exists(KEY)) scene.textures.remove(KEY);
  const tex = scene.textures.createCanvas(KEY, rect.width, rect.height);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.translate(-rect.x, -rect.y);
  const grad = ctx.createLinearGradient(0, rect.y, 0, FARM_VIEW.BACKDROP.sky.gradientEndY);
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
  grad.addColorStop(0, hex(L.sky.top));
  grad.addColorStop(1, hex(L.sky.bottom));
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  paintBackdrop(ctx, rect, SEASON_LOOKS[season].backdrop);
  tex.refresh();
  scene.children.getByName(KEY)?.destroy();
  scene.add.image(rect.x, rect.y, KEY).setOrigin(0).setName(KEY).setDepth(-10);
}

function clouds(scene: Phaser.Scene, still: boolean) {
  const C = L.clouds;
  for (const [i, c] of C.list.entries()) {
    const g = scene.add.graphics().setDepth(-9);
    g.fillStyle(C.shade, C.alpha).fillEllipse(0, 14, 190, 46);
    g.fillStyle(C.color, C.alpha).fillCircle(-52, 0, 34).fillCircle(0, -18, 46).fillCircle(54, -2, 36).fillEllipse(0, 12, 180, 40);
    const cloud = scene.add.container(c.x, c.y, [g]).setScale(c.s).setDepth(-9);
    if (still) continue;
    scene.tweens.add({ targets: cloud, x: c.x + C.driftPx * (i % 2 ? -1 : 1), duration: C.driftMs, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
  }
}

function crops(scene: Phaser.Scene) {
  const C = L.crops;
  const g = scene.add.graphics().setDepth(-6);
  for (const bed of C.beds) {
    const h = C.rowGapPx * bed.rows + 16;
    g.fillStyle(C.soilDark, 1).fillRoundedRect(bed.x, bed.y - h + 6, bed.width, h, 16);
    g.fillStyle(C.soil, 1).fillRoundedRect(bed.x, bed.y - h, bed.width, h, 16);
    for (let r = 0; r < bed.rows; r++) {
      const y = bed.y - h + 22 + r * C.rowGapPx;
      for (let x = bed.x + 30 + (r % 2) * (C.plantEveryPx / 2); x < bed.x + bed.width - 20; x += C.plantEveryPx) {
        if ((x / C.plantEveryPx + r) % 3 < 1) {
          g.fillStyle(C.carrot, 1).fillTriangle(x - 7, y + 4, x + 7, y + 4, x, y + 20);
          g.fillStyle(C.leaf, 1).fillEllipse(x - 5, y - 4, 8, 18).fillEllipse(x + 5, y - 4, 8, 18);
        } else {
          g.fillStyle(C.leafDark, 1).fillCircle(x, y + 2, 15);
          g.fillStyle(C.leaf, 1).fillCircle(x - 6, y - 2, 10).fillCircle(x + 6, y - 2, 10).fillCircle(x, y + 6, 9);
        }
      }
    }
  }
}

function fence(scene: Phaser.Scene) {
  const F = L.fence;
  const g = scene.add.graphics().setDepth(-5);
  const rail = (y: number) =>
    g.fillStyle(F.outline, 1).fillRect(F.from, y - 2, F.to - F.from, F.railPx + 4).fillStyle(F.color, 1).fillRect(F.from, y, F.to - F.from, F.railPx);
  rail(F.y + 14);
  rail(F.y + 42);
  for (let x = F.from; x <= F.to; x += F.postEveryPx) {
    const w = F.postWidth;
    g.fillStyle(F.outline, 1).fillRoundedRect(x - w / 2 - 3, F.y - 3, w + 6, F.height + 6, { tl: w / 2, tr: w / 2, bl: 2, br: 2 });
    g.fillStyle(F.color, 1).fillRoundedRect(x - w / 2, F.y, w, F.height, { tl: w / 2 - 2, tr: w / 2 - 2, bl: 0, br: 0 });
  }
}

function grass(scene: Phaser.Scene, still: boolean) {
  const G = L.grass;
  for (let i = 0; i < G.tufts; i++) {
    const x = -400 + (i * 2400) / G.tufts + ((i * 37) % 40);
    const g = scene.add.graphics();
    g.fillStyle(i % 2 ? G.dark : G.color, 1).fillTriangle(-12, 0, -4, 0, -10, -30).fillTriangle(-5, 0, 5, 0, 0, -40).fillTriangle(4, 0, 12, 0, 10, -28);
    const tuft = scene.add.container(x, G.y - ((i * 13) % 30), [g]).setDepth(-4);
    if (still) continue;
    tuft.angle = -G.swayDeg / 2;
    scene.tweens.add({ targets: tuft, angle: G.swayDeg / 2, duration: G.swayMs + (i % 5) * 140, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
  }
}

function sparkles(scene: Phaser.Scene) {
  const S = L.sparkles;
  for (let i = 0; i < S.count; i++) {
    const g = scene.add.graphics().fillStyle(S.color, 1);
    g.fillTriangle(-2, 0, 2, 0, 0, -8).fillTriangle(-2, 0, 2, 0, 0, 8).fillTriangle(0, -2, 0, 2, -8, 0).fillTriangle(0, -2, 0, 2, 8, 0);
    const star = scene.add.container(Phaser.Math.Between(-200, 1800), Phaser.Math.Between(S.minY, S.maxY), [g]).setDepth(5).setAlpha(0);
    scene.tweens.add({
      targets: star, y: star.y - S.risePx, alpha: { from: 0, to: 0.9 }, angle: 90,
      duration: S.riseMs, delay: i * (S.riseMs / S.count), repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}

function leaves(scene: Phaser.Scene) {
  const F = L.leaves;
  for (let i = 0; i < F.count; i++) {
    const x = Phaser.Math.Between(-100, 1500);
    const y = Phaser.Math.Between(-60, 200);
    const leaf = scene.add.ellipse(x, y, 18, 9, F.colors[i % F.colors.length]).setDepth(5).setAlpha(0);
    scene.tweens.add({
      targets: leaf, x: x + F.driftPx, y: y + 620, angle: 360, alpha: { from: 0.9, to: 0 },
      duration: F.fallMs, delay: i * (F.fallMs / F.count), repeat: -1,
    });
  }
}
