// Day / night sky (DN): gradient colours, star positions and the moon, in world coordinates. No
// Phaser — the farm scene paints the gradient into a thin texture and draws stars / moon as shapes;
// the admin preview paints everything with `paintSky`.
import { DAY_NIGHT_VIEW, type PhaseLook } from '../../../../core/config/dayNight';
import { FARM_VIEW } from '../../../../core/config/farmView';
import { SKY_BOTTOM_Y } from './backdropPaint';
import type { WorldRect } from './farmCamera';
import { hashId } from './pigView';

const CELL = 100;

export const cssColor = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

const unit = (a: number, b: number, salt: number) =>
  (hashId(`star:${a}:${b}:${salt}`) % 10007) / 10007;

/** Vertical sky gradient from `top` down to the hills (same stops as the old BACKDROP sky). */
export function paintSkyGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  width: number,
  look: PhaseLook,
) {
  const g = ctx.createLinearGradient(0, 0, 0, FARM_VIEW.BACKDROP.sky.gradientEndY);
  g.addColorStop(0, cssColor(look.skyTop));
  g.addColorStop(1, cssColor(look.skyBottom));
  ctx.fillStyle = g;
  ctx.fillRect(x, top, width, SKY_BOTTOM_Y - top);
}

export interface Star {
  x: number;
  y: number;
  r: number;
}

/** Stable stars over the sky band of `rect` (per world cell, so they stay put on resize). */
export function starPoints(rect: WorldRect): Star[] {
  const V = DAY_NIGHT_VIEW;
  const stars: Star[] = [];
  const whole = Math.floor(V.starsPerCell);
  for (let cx = Math.floor(rect.x / CELL); cx * CELL < rect.x + rect.width; cx++) {
    for (let cy = Math.floor(rect.y / CELL); cy * CELL < V.starsMaxY; cy++) {
      const n = whole + (unit(cx, cy, 99) < V.starsPerCell - whole ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const y = (cy + unit(cx, cy, i * 3 + 1)) * CELL;
        if (y > V.starsMaxY) continue;
        const r = V.starR[0] + unit(cx, cy, i * 3 + 2) * (V.starR[1] - V.starR[0]);
        stars.push({ x: (cx + unit(cx, cy, i * 3)) * CELL, y, r });
      }
    }
  }
  return stars;
}

/** The whole sky on a 2D canvas (admin preview): gradient, stars and moon by the look's alphas. */
export function paintSky(ctx: CanvasRenderingContext2D, rect: WorldRect, look: PhaseLook) {
  const V = DAY_NIGHT_VIEW;
  paintSkyGradient(ctx, rect.x, rect.y, rect.width, look);
  ctx.save();
  ctx.fillStyle = cssColor(V.starColor);
  ctx.globalAlpha = look.stars;
  for (const s of starPoints(rect)) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  const m = V.moon;
  ctx.globalAlpha = look.moon * m.haloAlpha;
  ctx.fillStyle = cssColor(m.halo);
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.haloR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = look.moon;
  ctx.fillStyle = cssColor(m.color);
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
