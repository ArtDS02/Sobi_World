// Painted farm backdrop (farm layout rework): one canvas texture under everything — sky gradient,
// two wavy hill bands, grass with light dots, a lighter oval where the pigs roam, the back fence and
// a few small flowers. Replaces the env_sky / hills / ground images (no white edges, no seams).
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { hashId } from '../view/pigView';

const KEY = 'farm_backdrop';

/** Stable pseudo-random in [0, 1) per index (no Math.random: the backdrop never changes). */
const unit = (i: number, salt: number) => (hashId(`bg:${i}:${salt}`) % 10007) / 10007;

export function drawBackdrop(scene: Phaser.Scene, width: number, height: number) {
  if (scene.textures.exists(KEY)) scene.textures.remove(KEY);
  const tex = scene.textures.createCanvas(KEY, width, height);
  if (!tex) return;
  const ctx = tex.getContext();
  const B = FARM_VIEW.BACKDROP;

  const sky = ctx.createLinearGradient(0, 0, 0, B.sky.gradientEndY);
  sky.addColorStop(0, B.sky.top);
  sky.addColorStop(1, B.sky.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, B.grass.top + 10);

  for (const h of B.hills) {
    ctx.fillStyle = h.color;
    ctx.beginPath();
    ctx.moveTo(0, B.grass.top + 10);
    for (let x = 0; x <= width; x += 8) {
      const t = (x / width) * Math.PI * 2 * h.waves + h.phase;
      ctx.lineTo(x, h.baseY - Math.sin(t) * h.amp - Math.sin(t * 2.3) * h.amp * 0.3);
    }
    ctx.lineTo(width, B.grass.top + 10);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = B.grass.color;
  ctx.fillRect(0, B.grass.top, width, height - B.grass.top);

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
  for (let i = 0; i < B.grass.dots; i++) {
    const x = unit(i, 1) * width;
    const y = B.grass.top + 30 + unit(i, 2) * (height - B.grass.top - 30);
    ctx.beginPath();
    ctx.ellipse(x, y, B.grass.dotR * 1.6, B.grass.dotR, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFence(ctx, width);

  for (const f of B.flowers) drawFlower(ctx, f.x, f.y);
  tex.refresh();
  scene.add.image(0, 0, KEY).setOrigin(0).setDepth(-Infinity);
}

function drawFence(ctx: CanvasRenderingContext2D, width: number) {
  const F = FARM_VIEW.BACKDROP.fence;
  const top = F.y - F.height;
  ctx.lineWidth = 2;
  ctx.strokeStyle = F.dark;
  ctx.fillStyle = F.wood;
  for (const ry of [top + F.height * 0.28, top + F.height * 0.62]) {
    ctx.fillRect(0, ry, width, F.railH);
    ctx.strokeRect(-2, ry, width + 4, F.railH);
  }
  for (let x = F.postEvery / 2; x < width; x += F.postEvery) {
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
