// Drawing the battle canvas's world (adventure-big-update-1 §5): every particle by its shape (glows, sparks, stars, leaves and
// petals, drops, embers, rocks, bubbles, shards, rings, smoke, pluses, arrows, runes), then the shapes of a layer. fxEngine.ts holds
// the world and moves it.
import { clamp01, lerp, type FxWorld, type Particle } from './fxEngine';

function star(ctx: CanvasRenderingContext2D, r: number, points = 5, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

/** Soft round sprites (a glow, an ember, a puff of smoke) drawn once per colour and stamped after: a gradient made for every
 * particle on every frame is what made big skills slow. */
const SPRITE = 64;
const sprites = new Map<string, CanvasImageSource | null>();
function softSprite(kind: 'glow' | 'ember' | 'smoke', color: string): CanvasImageSource | null {
  const key = `${kind}|${color}`;
  const have = sprites.get(key);
  if (have !== undefined) return have;
  const c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const g = c?.getContext('2d') ?? null;
  if (!c || !g) {
    sprites.set(key, null);
    return null;
  }
  c.width = c.height = SPRITE;
  const h = SPRITE / 2;
  const grad = g.createRadialGradient(h, h, 0, h, h, h);
  if (kind === 'ember') {
    grad.addColorStop(0, '#fff6c0');
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, 'rgba(255,60,0,0)');
  } else {
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE, SPRITE);
  sprites.set(key, c);
  return c;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const t = p.age / p.life;
  const size = lerp(p.size, p.size2, t);
  const fadeIn = Math.min(1, p.age / 0.06);
  const alpha = p.alpha * fadeIn * (1 - t * t);
  if (alpha <= 0.01 || size <= 0.2) return;
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
  if (p.shape === 'glow' || p.shape === 'ember' || p.shape === 'smoke') {
    const img = softSprite(p.shape, p.color);
    if (img) {
      ctx.drawImage(img, p.x - size, p.y - size, size * 2, size * 2);
      return;
    }
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  switch (p.shape) {
    case 'glow': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      g.addColorStop(0, p.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      break;
    }
    case 'spark': {
      const sp = Math.hypot(p.vx, p.vy);
      const len = Math.min(size * 6, sp * 0.06 + size);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, size * 0.5);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      break;
    }
    case 'star':
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      star(ctx, size, 4, 0.35);
      ctx.fill();
      break;
    case 'leaf':
    case 'petal':
      ctx.rotate(p.rot);
      ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.rot * 1.7)));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.quadraticCurveTo(0, p.shape === 'leaf' ? -size * 0.8 : -size, size, 0);
      ctx.quadraticCurveTo(0, p.shape === 'leaf' ? size * 0.8 : size * 0.5, -size, 0);
      ctx.fill();
      if (p.shape === 'leaf') {
        ctx.strokeStyle = 'rgba(30,80,20,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-size * 0.8, 0);
        ctx.lineTo(size * 0.8, 0);
        ctx.stroke();
      }
      break;
    case 'drop':
      ctx.rotate(Math.atan2(p.vy, p.vx) - Math.PI / 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, size * 1.4);
      ctx.bezierCurveTo(size, size * 0.2, size * 0.8, -size, 0, -size);
      ctx.bezierCurveTo(-size * 0.8, -size, -size, size * 0.2, 0, size * 1.4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(-size * 0.3, -size * 0.3, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ember': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      g.addColorStop(0, '#fff6c0');
      g.addColorStop(0.35, p.color);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rock':
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(-size, -size * 0.3);
      ctx.lineTo(-size * 0.3, -size);
      ctx.lineTo(size * 0.8, -size * 0.6);
      ctx.lineTo(size, size * 0.4);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.8, size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, -size * 0.3);
      ctx.lineTo(-size * 0.2, -size * 0.75);
      ctx.lineTo(size * 0.3, -size * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    case 'bubble':
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, size * 0.18);
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(-size * 0.35, -size * 0.35, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'shard':
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(size * 0.4, 0);
      ctx.lineTo(0, size * 1.5);
      ctx.lineTo(-size * 0.4, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'ring':
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, size * 0.12 * (1 - t));
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'smoke': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      g.addColorStop(0, p.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'plus':
      ctx.fillStyle = p.color;
      ctx.fillRect(-size * 0.25, -size, size * 0.5, size * 2);
      ctx.fillRect(-size, -size * 0.25, size * 2, size * 0.5);
      break;
    case 'arrow':
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.8, 0);
      ctx.lineTo(size * 0.3, 0);
      ctx.lineTo(size * 0.3, size);
      ctx.lineTo(-size * 0.3, size);
      ctx.lineTo(-size * 0.3, 0);
      ctx.lineTo(-size * 0.8, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'rune':
      ctx.rotate(p.rot);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, size * 0.2);
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size);
      ctx.lineTo(size * 0.5, -size * 0.2);
      ctx.lineTo(-size * 0.5, size * 0.3);
      ctx.lineTo(size * 0.4, size);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

/**
 * Draws one layer of the world: the ground (shapes laid under the fighters) or the air (every other shape, then the particles). The
 * flash and the dim are drawn by the stage over its whole canvas.
 */
export function draw(ctx: CanvasRenderingContext2D, w: FxWorld, layer: 'ground' | 'air' = 'air') {
  for (const s of w.shapes) {
    if (s.wait > 0 || !!s.ground !== (layer === 'ground')) continue;
    ctx.save();
    ctx.globalCompositeOperation = s.add ? 'lighter' : 'source-over';
    s.draw(ctx, clamp01(s.age / s.dur), w);
    ctx.restore();
  }
  if (layer === 'air') for (const p of w.particles) if (p.wait <= 0) drawParticle(ctx, p);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
