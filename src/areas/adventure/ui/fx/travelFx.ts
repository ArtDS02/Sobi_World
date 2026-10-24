// A shot flying from its caster to its target in its element's style (fire ball, water orb, thorn, rock, steel star, light) (adventure-big-update-1 §5–§8). Each recipe fills the battle canvas's world at the moment it is called (shapes can
// wait inside it); battleStage.ts decides when.
import type { Element } from '../../../../systems/combat/types';
import { addShape, burst, easeInOut, lerp, type FxWorld, type Pt } from './fxEngine';
import { lookOf, TAU } from './looks';

/** A shot flying from `from` to `to` over `dur` seconds, with a trail in the element's style; lands nothing itself (see impact). */
export function projectile(w: FxWorld, from: Pt, to: Pt, dur: number, element: Element | null, own: string | null) {
  const look = lookOf(element);
  const arc = element === 'EARTH' ? -120 : element === 'WATER' || element === 'NATURE' ? -60 : -24;
  const pos = (t: number): Pt => ({ x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) + arc * Math.sin(Math.PI * t) });
  const thorn = own === 'thorn';
  addShape(w, {
    wait: 0,
    dur,
    add: element !== 'EARTH' && !thorn,
    draw(ctx, t) {
      const p = pos(easeInOut(t));
      const q = pos(easeInOut(Math.max(0, t - 0.04)));
      const ang = Math.atan2(p.y - q.y, p.x - q.x);
      ctx.translate(p.x, p.y);
      ctx.scale(1.6, 1.6);
      if (thorn || element === 'NATURE') {
        ctx.rotate(ang);
        ctx.fillStyle = thorn ? '#3d8a2e' : look.color;
        ctx.strokeStyle = '#1f4f18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(26, 0);
        ctx.lineTo(-14, -8);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-14, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (thorn) {
          ctx.fillStyle = '#b06ae0';
          ctx.beginPath();
          ctx.arc(20, 0, 4, 0, TAU);
          ctx.fill();
        }
        return;
      }
      if (element === 'EARTH') {
        ctx.rotate(t * 9);
        ctx.fillStyle = look.color;
        ctx.strokeStyle = look.dark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-22, -6);
        ctx.lineTo(-8, -22);
        ctx.lineTo(16, -16);
        ctx.lineTo(24, 6);
        ctx.lineTo(4, 22);
        ctx.lineTo(-18, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        return;
      }
      if (element === 'METAL') {
        ctx.rotate(t * 30);
        ctx.fillStyle = '#e9f0f8';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 12;
        for (let i = 0; i < 4; i += 1) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(26, -5);
          ctx.lineTo(6, 6);
          ctx.closePath();
          ctx.fill();
        }
        return;
      }
      const r = element === 'FIRE' ? 22 : element === 'DARK' || element === 'VOID' ? 20 : 17;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, look.glow);
      g.addColorStop(0.65, look.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.8, 0, TAU);
      ctx.fill();
      if (element === 'WATER') {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      }
    },
    tick(t, dt, world) {
      const p = pos(easeInOut(t));
      const n = Math.max(1, dt * 90);
      for (let i = 0; i < n; i += 1) {
        switch (element) {
          case 'FIRE':
            burst(world, { count: 1, at: p, spread: 10, speed: [10, 60], life: [0.3, 0.55], size: [8, 16], colors: ['#ff9a3a', '#ffcf5a', '#ff5a1a'], shape: 'ember', g: -80 });
            if (world.rand() < 0.3) burst(world, { count: 1, at: p, spread: 8, speed: [5, 30], life: [0.6, 1], size: [10, 22], shrink: 1.8, colors: ['rgba(80,60,60,0.35)'], shape: 'smoke', g: -40, add: false });
            break;
          case 'WATER':
            burst(world, { count: 1, at: p, spread: 10, speed: [20, 80], life: [0.3, 0.6], size: [3, 7], colors: ['#bfe8ff', '#6fc8ff'], shape: world.rand() < 0.5 ? 'bubble' : 'drop', g: 300 });
            break;
          case 'NATURE':
            burst(world, { count: 1, at: p, spread: 6, speed: [10, 50], life: [0.4, 0.8], size: [4, 8], shrink: 0.6, colors: ['#7ed957', '#4fae35', '#ffd6e8'], shape: 'leaf', spin: 8, add: false });
            break;
          case 'EARTH':
            if (world.rand() < 0.5) burst(world, { count: 1, at: p, spread: 10, speed: [10, 40], life: [0.4, 0.7], size: [8, 14], shrink: 2, colors: ['rgba(190,150,100,0.45)'], shape: 'smoke', add: false });
            break;
          case 'LIGHTNING':
            burst(world, { count: 1, at: p, spread: 10, speed: [80, 220], life: [0.12, 0.25], size: [2, 3], colors: ['#fffbd0', '#ffe14a'], shape: 'spark' });
            break;
          case 'DARK':
          case 'VOID':
            burst(world, { count: 1, at: p, spread: 10, speed: [10, 50], life: [0.5, 0.9], size: [10, 20], shrink: 1.6, colors: [element === 'DARK' ? 'rgba(70,30,120,0.5)' : 'rgba(90,80,200,0.45)'], shape: 'smoke', add: false });
            if (world.rand() < 0.4) burst(world, { count: 1, at: p, spread: 14, speed: [20, 60], life: [0.3, 0.6], size: [2, 4], colors: [lookOf(element).glow], shape: 'glow' });
            break;
          case 'METAL':
            burst(world, { count: 1, at: p, spread: 8, speed: [60, 160], life: [0.15, 0.3], size: [1.5, 2.5], colors: ['#ffffff', '#cfd9e6'], shape: 'spark' });
            break;
          default:
            burst(world, { count: 1, at: p, spread: 8, speed: [10, 50], life: [0.3, 0.6], size: [3, 6], colors: [lookOf(element).glow, lookOf(element).color], shape: thorn ? 'leaf' : 'star', spin: 6 });
        }
      }
    },
  });
}
