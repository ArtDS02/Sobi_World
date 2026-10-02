// Painted farm backdrop (farm layout rework): one canvas texture under everything, redrawn to the
// camera view on resize — sky gradient, two wavy hill bands, grass with light dots, a lighter oval
// where the pigs roam, the back fence and a few small flowers. Replaces the env_sky / hills /
// ground images (no white edges, no seams).
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { fitCamera } from '../config/phaser';
import { backdropRect, type WorldRect } from '../view/farmCamera';
import type { FarmLayout } from '../view/pigView';
import { hashId } from '../view/pigView';

const KEY = 'farm_backdrop';
/** Grass dots are scattered per world cell, so they stay put when the view grows. */
const DOT_CELL = 100;

/** Stable pseudo-random in [0, 1) (no Math.random: the backdrop never changes). */
const unit = (a: number, b: number, salt: number) =>
  (hashId(`bg:${a}:${b}:${salt}`) % 10007) / 10007;

/**
 * The backdrop image under everything. `redraw` paints the given world rect (the camera view,
 * which can be wider or taller than the design frame); painting is in world coordinates.
 */
export class Backdrop {
  private image: Phaser.GameObjects.Image | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Fits the scene camera to the design frame and repaints the backdrop on every resize. */
  static follow(scene: Phaser.Scene, layout: FarmLayout) {
    const backdrop = new Backdrop(scene);
    const { width, height } = layout.designSize;
    fitCamera(scene, layout, (view) =>
      backdrop.redraw(backdropRect(view, width, height, FARM_VIEW.VIEW_MAX_EXTEND)),
    );
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
    paint(ctx, rect);
    tex.refresh();
    this.image = scene.add.image(rect.x, rect.y, KEY).setOrigin(0).setDepth(-Infinity);
  }
}

function paint(ctx: CanvasRenderingContext2D, r: WorldRect) {
  const B = FARM_VIEW.BACKDROP;
  const left = r.x;
  const right = r.x + r.width;
  const bottom = r.y + r.height;

  const sky = ctx.createLinearGradient(0, 0, 0, B.sky.gradientEndY);
  sky.addColorStop(0, B.sky.top);
  sky.addColorStop(1, B.sky.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(left, r.y, r.width, B.grass.top + 10 - r.y);

  for (const h of B.hills) {
    ctx.fillStyle = h.color;
    ctx.beginPath();
    ctx.moveTo(left, B.grass.top + 10);
    for (let x = Math.floor(left / 8) * 8; x <= right + 8; x += 8) {
      const t = (x / 1600) * Math.PI * 2 * h.waves + h.phase;
      ctx.lineTo(x, h.baseY - Math.sin(t) * h.amp - Math.sin(t * 2.3) * h.amp * 0.3);
    }
    ctx.lineTo(right + 8, B.grass.top + 10);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = B.grass.color;
  ctx.fillRect(left, B.grass.top, r.width, bottom - B.grass.top);

  const o = B.oval;
  ctx.save();
  ctx.translate(o.cx, o.cy);
  ctx.scale(1, o.ry / o.rx);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, o.rx);
  glow.addColorStop(0, o.color);
  glow.addColorStop(0.6, `${o.color}cc`);
  glow.addColorStop(1, `${o.color}00`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, o.rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = B.grass.dot;
  const perCell = (B.grass.dots * DOT_CELL * DOT_CELL) / (1600 * 600);
  for (let cx = Math.floor(left / DOT_CELL); cx * DOT_CELL < right; cx++) {
    for (let cy = Math.floor(B.grass.top / DOT_CELL); cy * DOT_CELL < bottom; cy++) {
      for (let i = 0; i < perCell; i++) {
        const x = (cx + unit(cx, cy, i * 2)) * DOT_CELL;
        const y = (cy + unit(cx, cy, i * 2 + 1)) * DOT_CELL;
        if (y < B.grass.top + 30) continue;
        ctx.beginPath();
        ctx.ellipse(x, y, B.grass.dotR * 1.6, B.grass.dotR, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawFence(ctx, left, right);
  for (const f of B.flowers) drawFlower(ctx, f.x, f.y);
}

function drawFence(ctx: CanvasRenderingContext2D, left: number, right: number) {
  const F = FARM_VIEW.BACKDROP.fence;
  const top = F.y - F.height;
  ctx.lineWidth = 2;
  ctx.strokeStyle = F.dark;
  ctx.fillStyle = F.wood;
  for (const ry of [top + F.height * 0.28, top + F.height * 0.62]) {
    ctx.fillRect(left, ry, right - left, F.railH);
    ctx.strokeRect(left - 2, ry, right - left + 4, F.railH);
  }
  const first = F.postEvery / 2 + Math.floor(left / F.postEvery) * F.postEvery;
  for (let x = first; x < right + F.postEvery; x += F.postEvery) {
    const l = x - F.postW / 2;
    ctx.beginPath();
    ctx.moveTo(l, F.y);
    ctx.lineTo(l, top + F.postW / 2);
    ctx.lineTo(x, top);
    ctx.lineTo(l + F.postW, top + F.postW / 2);
    ctx.lineTo(l + F.postW, F.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const B = FARM_VIEW.BACKDROP;
  const r = B.flowerR;
  ctx.fillStyle = B.petal;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y - r + Math.sin(a) * r, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = B.flowerCore;
  ctx.beginPath();
  ctx.arc(x, y - r, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}
