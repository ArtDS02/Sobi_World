// The drawn strokes the impacts are made of: crossing slashes, a jagged bolt from the sky, a column of light, smoke or light
// turning in to a point (adventure-big-update-1 §5–§8). Each recipe fills the battle canvas's world at the moment it is called (shapes can
// wait inside it); battleStage.ts decides when.
import { addShape, clamp01, easeIn, easeOut, lerp, type FxWorld, type Pt } from './fxEngine';
import { TAU, type Look } from './looks';

/** Two or three crossing bright slashes over a point. */
export function slashes(w: FxWorld, at: Pt, color: string, glow: string, n: number) {
  for (let i = 0; i < n; i += 1) {
    const ang = -0.6 + i * 1.1 + (w.rand() * 0.3 - 0.15);
    const len = 150 + w.rand() * 40;
    addShape(w, {
      wait: i * 0.06,
      dur: 0.32,
      add: true,
      draw(ctx, t) {
        const head = easeOut(clamp01(t / 0.5));
        const tail = easeIn(clamp01((t - 0.25) / 0.75));
        ctx.translate(at.x, at.y);
        ctx.rotate(ang);
        ctx.shadowColor = glow;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        const a = lerp(-len / 2, len / 2, tail);
        const b = lerp(-len / 2, len / 2, head);
        ctx.lineWidth = 14 * (1 - t);
        ctx.beginPath();
        ctx.moveTo(a, Math.sin((a / len) * Math.PI) * -18);
        ctx.quadraticCurveTo((a + b) / 2, -26, b, Math.sin((b / len) * Math.PI) * -18);
        ctx.stroke();
      },
    });
  }
}

/** A jagged bolt from the sky with branches, flickering. */
export function bolt(w: FxWorld, from: Pt, to: Pt, look: Look, dur: number) {
  const seg = 14;
  const pts: Pt[] = [];
  for (let i = 0; i <= seg; i += 1) {
    const t = i / seg;
    const jitter = i === 0 || i === seg ? 0 : (w.rand() * 2 - 1) * 46 * Math.sin(Math.PI * t);
    pts.push({ x: lerp(from.x, to.x, t) + jitter, y: lerp(from.y, to.y, t) });
  }
  const branches = [4, 8, 11].map((i) => {
    const p = pts[i]!;
    const side = w.rand() < 0.5 ? -1 : 1;
    return [p, { x: p.x + side * (40 + w.rand() * 50), y: p.y + 40 + w.rand() * 40 }, { x: p.x + side * (70 + w.rand() * 60), y: p.y + 90 + w.rand() * 50 }];
  });
  addShape(w, {
    wait: 0,
    dur,
    add: true,
    draw(ctx, t) {
      const on = Math.sin(t * 40) > -0.4 ? 1 : 0.35;
      ctx.globalAlpha = (1 - t * t) * on;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const path = (list: Pt[]) => {
        ctx.beginPath();
        list.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      };
      ctx.shadowColor = look.color;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = look.color;
      ctx.lineWidth = 12;
      path(pts);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      path(pts);
      ctx.lineWidth = 2;
      for (const b of branches) path(b);
    },
  });
}

/** A column of light from above onto a target (Light). */
export function beam(w: FxWorld, feet: Pt, look: Look, dur: number, width: number) {
  addShape(w, {
    wait: 0,
    dur,
    add: true,
    draw(ctx, t) {
      const open = t < 0.2 ? easeOut(t / 0.2) : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
      const wd = width * open;
      const g = ctx.createLinearGradient(feet.x - wd, 0, feet.x + wd, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.35, look.color);
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(0.65, look.color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = g;
      ctx.fillRect(feet.x - wd, -200, wd * 2, feet.y + 210);
      ctx.beginPath();
      ctx.ellipse(feet.x, feet.y, wd * 1.3, wd * 0.4, 0, 0, TAU);
      ctx.fill();
    },
  });
}

/** Smoke or light turning in to a point (Dark pours out, Void pulls in). */
export function swirl(w: FxWorld, at: Pt, look: Look, out: boolean) {
  const n = 36;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * TAU;
    const d = out ? 10 : 140;
    const speed = out ? 260 : -300;
    w.particles.push({
      x: at.x + Math.cos(a) * d,
      y: at.y + Math.sin(a) * d * 0.7,
      vx: Math.cos(a + 0.9) * speed,
      vy: Math.sin(a + 0.9) * speed * 0.7,
      g: 0,
      drag: 2.6,
      age: 0,
      life: 0.6,
      size: out ? 7 : 5,
      size2: out ? 2 : 1,
      rot: 0,
      spin: 0,
      color: i % 2 === 0 ? look.glow : look.color,
      alpha: 1,
      shape: 'glow',
      add: true,
      wait: 0,
    });
  }
}
