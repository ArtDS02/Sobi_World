// A ribbon across the stage (ANIM-006): a wave of water or wind sweeping over a row of units, drawn on the stroke layer as a filled
// strip with foam at its head. A code placeholder in the colour given; when the water kit (art_inbox A05) lands it can become a
// Phaser Rope textured with it on WebGL. Reduced motion never reaches here (acts are not played).
import type { Act } from '../../../../../content/schemas/adventure/battleScript';
import { RIBBON_MAX_LIVE, ribbonStep } from '../../ui/ribbonMotion';
import type { ActHost } from './fxActs';
import type { FxAnchor } from './fxPlayer';

const inOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
let live = 0;

export function playRibbon(h: ActHost, act: Extract<Act, { do: 'ribbon' }>, a: FxAnchor | null, from: FxAnchor | null) {
  if (live >= RIBBON_MAX_LIVE) return;
  live += 1;
  const W = h.scene.scale.width;
  const H = h.scene.scale.height;
  const flipped = ((from ?? a)?.side === 'enemy') !== !!act.flip;
  const dir = flipped ? -1 : 1;
  const y0 = a ? a.feet.y - (a.height * 0.35) : H * 0.62;
  const length = W * (act.length ?? 0.4);
  const thick = H * (act.thickness ?? 0.1);
  const spec = { n: 18, amp: H * (act.amp ?? 0.08), freq: act.freq ?? 2.2, speed: act.speed ?? 5 };
  const state: number[] = [];
  const color = act.color as number;
  h.add(
    act.dur,
    (t, g, dt) => {
      const head = (dir > 0 ? -0.1 : 1.1) * W + dir * (W * 1.2) * inOutSine(t);
      const off = ribbonStep(spec, (t * act.dur) / 1000, state, dt);
      const fade = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1;
      const n = off.length;
      const top: { x: number; y: number }[] = [];
      const bottom: { x: number; y: number }[] = [];
      for (let i = 0; i < n; i += 1) {
        // Point 0 is the tail, n - 1 the head.
        const s = i / (n - 1);
        const x = head - dir * length * (1 - s);
        const y = y0 + off[i]!;
        top.push({ x, y: y - (thick / 2) * (0.5 + 0.5 * s) });
        bottom.push({ x, y: y + (thick / 2) * (0.5 + 0.5 * s) });
      }
      g.fillStyle(color, 0.55 * fade);
      g.beginPath();
      top.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
      for (let i = n - 1; i >= 0; i -= 1) g.lineTo(bottom[i]!.x, bottom[i]!.y);
      g.closePath();
      g.fillPath();
      g.lineStyle(3, 0xffffff, 0.8 * fade);
      g.beginPath();
      top.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
      g.strokePath();
      if (act.foam) {
        g.fillStyle(0xffffff, 0.8 * fade);
        for (let j = 0; j < 4; j += 1) g.fillCircle(top[n - 1]!.x - dir * j * 9, top[n - 1]!.y + Math.sin(t * 30 + j * 2) * 5 - 4, 7 - j);
      }
    },
    () => {
      live = Math.max(0, live - 1);
    },
  );
}
