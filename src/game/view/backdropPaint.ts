// Painter of the farm backdrop (farm layout rework, DN): hills, grass with light dots, the lighter
// oval where the pigs roam, the back fence and a few small flowers, in world coordinates on a 2D
// canvas. The sky above the hills stays transparent — the day / night sky layer shows through.
// No Phaser: the admin day / night preview paints with it too.
import { FARM_VIEW } from '../../core/config/farmView';
import { SEASON_LOOKS, type BackdropPalette } from '../../core/config/seasons';
import type { WorldRect } from './farmCamera';
import { hashId } from './pigView';

/** Grass dots are scattered per world cell, so they stay put when the view grows. */
const DOT_CELL = 100;

/** Stable pseudo-random in [0, 1) (no Math.random: the backdrop never changes). */
const unit = (a: number, b: number, salt: number) =>
  (hashId(`bg:${a}:${b}:${salt}`) % 10007) / 10007;

/** Bottom of the sky band: the hills and the grass cover everything below. */
export const SKY_BOTTOM_Y = FARM_VIEW.BACKDROP.grass.top + 10;

/** The summer look is the farm's original palette (SE-1). */
export const DEFAULT_PALETTE: BackdropPalette = SEASON_LOOKS.summer.backdrop;

export function paintBackdrop(
  ctx: CanvasRenderingContext2D,
  r: WorldRect,
  pal: BackdropPalette = DEFAULT_PALETTE,
) {
  const B = FARM_VIEW.BACKDROP;
  const left = r.x;
  const right = r.x + r.width;
  const bottom = r.y + r.height;

  B.hills.forEach((h, i) => {
    ctx.fillStyle = pal.hills[i] ?? h.color;
    ctx.beginPath();
    ctx.moveTo(left, B.grass.top + 10);
    for (let x = Math.floor(left / 8) * 8; x <= right + 8; x += 8) {
      const t = (x / 1600) * Math.PI * 2 * h.waves + h.phase;
      ctx.lineTo(x, h.baseY - Math.sin(t) * h.amp - Math.sin(t * 2.3) * h.amp * 0.3);
    }
    ctx.lineTo(right + 8, B.grass.top + 10);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = pal.grass;
  ctx.fillRect(left, B.grass.top, r.width, bottom - B.grass.top);

  const o = { ...B.oval, color: pal.oval };
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

  ctx.fillStyle = pal.dot;
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
  for (const f of B.flowers) drawFlower(ctx, f.x, f.y, pal);
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

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, pal: BackdropPalette) {
  const r = FARM_VIEW.BACKDROP.flowerR;
  ctx.fillStyle = pal.petal;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y - r + Math.sin(a) * r, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = pal.flowerCore;
  ctx.beginPath();
  ctx.arc(x, y - r, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}
