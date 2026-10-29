// The lines of the battle scripts (decision 044): a beam with a white core (on to the edge of the screen when it goes through), a
// wavy tether with particles running along it, a cone blown from the mouth with particles inside. Drawn on the stroke layer each frame.
import type { FxAnchor } from './fxPlayer';
import type { ActHost } from './fxActs';

type Pt = { x: number; y: number };
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const fadeIO = (t: number, inn = 0.12, out = 0.25) => (t < inn ? t / inn : t > 1 - out ? (1 - t) / out : 1);

export function beam(h: ActHost, from: FxAnchor, to: FxAnchor, color: number, width: number, dur: number, through: boolean) {
  const W = h.scene.scale.width;
  const o = from.chest;
  let end = to.chest;
  if (through) {
    const dx = to.chest.x - o.x;
    const k = dx === 0 ? 1 : ((dx > 0 ? W + 40 : -40) - o.x) / dx;
    end = { x: o.x + dx * k, y: o.y + (to.chest.y - o.y) * k };
  }
  h.add(dur, (t, g) => {
    const open = t < 0.2 ? easeOut(t / 0.2) : t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1 + Math.sin(t * 60) * 0.06;
    g.lineStyle(width * 1.8 * open, color, 0.35);
    g.lineBetween(o.x, o.y, end.x, end.y);
    g.lineStyle(width * open, color, 0.85);
    g.lineBetween(o.x, o.y, end.x, end.y);
    g.lineStyle(width * 0.4 * open, 0xffffff, 1);
    g.lineBetween(o.x, o.y, end.x, end.y);
  });
}

export function tether(h: ActHost, from: FxAnchor, to: FxAnchor, color: number, wave: number, dur: number, ref: string | null) {
  const o = from.chest;
  const e = to.chest;
  let since = 0;
  h.add(dur, (t, g, dt) => {
    const alpha = fadeIO(t, 0.15, 0.25);
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i += 1) {
      const s = i / 24;
      const off = Math.sin(s * Math.PI * 3 - t * 20) * wave * Math.sin(s * Math.PI);
      pts.push({ x: o.x + (e.x - o.x) * s, y: o.y + (e.y - o.y) * s + off });
    }
    g.lineStyle(8, color, 0.35 * alpha);
    g.strokePoints(pts);
    g.lineStyle(3, 0xffffff, alpha);
    g.strokePoints(pts);
    since += dt;
    if (ref && since > 0.06) {
      since = 0;
      const s = Math.random();
      h.bursts.play(ref, { x: o.x + (e.x - o.x) * s, y: o.y + (e.y - o.y) * s });
    }
  });
}

export function cone(h: ActHost, from: FxAnchor, to: FxAnchor, color: number, width: number, dur: number, ref: string | null) {
  const dir = from.side === 'ally' ? 1 : -1;
  const o = { x: from.chest.x + dir * from.width * 0.35, y: from.head.y + from.height * 0.08 };
  const end = { x: to.chest.x + dir * to.width * 0.5, y: to.chest.y };
  const ang = Math.atan2(end.y - o.y, end.x - o.x);
  const len = Math.hypot(end.x - o.x, end.y - o.y);
  let since = 0;
  h.add(dur, (t, g, dt) => {
    const reach = len * Math.min(1, t / 0.25);
    const alpha = fadeIO(t, 0.1, 0.25) * (0.55 + Math.sin(t * 50) * 0.08);
    const half = (width / 2) * Math.min(1, t / 0.25);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const tip = { x: o.x + Math.cos(ang) * reach, y: o.y + Math.sin(ang) * reach };
    g.fillStyle(color, alpha);
    g.fillTriangle(o.x, o.y, tip.x + nx * half, tip.y + ny * half, tip.x - nx * half, tip.y - ny * half);
    g.fillStyle(0xffffff, alpha * 0.6);
    g.fillTriangle(o.x, o.y, tip.x + nx * half * 0.35, tip.y + ny * half * 0.35, tip.x - nx * half * 0.35, tip.y - ny * half * 0.35);
    since += dt;
    if (ref && since > 0.045) {
      since = 0;
      const s = 0.3 + Math.random() * 0.7;
      const side = (Math.random() * 2 - 1) * half * s;
      h.bursts.play(ref, { x: o.x + Math.cos(ang) * reach * s + nx * side, y: o.y + Math.sin(ang) * reach * s + ny * side }, { mirror: dir < 0 });
    }
  });
}
