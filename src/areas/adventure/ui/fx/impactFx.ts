// What lands on a target, each element its own burst (blasts, splashes, leaves and vines, rocks, sparks, bolts, smoke, light,
// the void pulling in), a slam on the ground, and a blow on a whole side from above (adventure-big-update-1 §5–§8). Each recipe fills the battle canvas's world at the moment it is called (shapes can
// wait inside it); battleStage.ts decides when.
import type { Element } from '../../../../systems/combat/types';
import { addShape, burst, clamp01, easeOut, flash, shake, type FxWorld, type Pt } from './fxEngine';
import { beam, bolt, slashes, swirl } from './strokeFx';
import { lookOf, TAU, type Look } from './looks';

/** What lands on a target: each element its own burst; `heavy` = a critical or a super-effective blow, `big` = an Ultimate. */
export function impact(w: FxWorld, at: Pt, feet: Pt, element: Element | null, heavy: boolean, big: boolean, own: string | null) {
  const look = lookOf(element);
  const k = (heavy ? 1.35 : 1) * (big ? 1.5 : 1);
  const ring = (color: string, size: number, life = 0.45) => burst(w, { count: 1, at: feet, speed: [0, 0], life: [life, life], size: [size * 0.2, size * 0.2], shrink: 5, colors: [color], shape: 'ring' });
  switch (element) {
    case 'FIRE':
      burst(w, { count: Math.round(46 * k), at, spread: 14, speed: [120, 420 * k], life: [0.35, 0.8], size: [8, 18], colors: ['#ff9a3a', '#ffcf5a', '#ff5a1a', '#fff1b0'], shape: 'ember', g: -60, drag: 2.2 });
      burst(w, { count: Math.round(10 * k), at, spread: 20, speed: [20, 80], life: [0.8, 1.4], size: [18, 30], shrink: 2, colors: ['rgba(70,50,50,0.4)'], shape: 'smoke', g: -50, add: false });
      burst(w, { count: 1, at, speed: [0, 0], life: [0.25, 0.25], size: [90 * k, 90 * k], shrink: 1.4, colors: ['rgba(255,200,90,0.9)'], shape: 'glow' });
      ring('#ffb04a', 140 * k);
      flash(w, '#ffb050', heavy || big ? 0.35 : 0.18, 0.25);
      shake(w, heavy || big ? 12 : 6, 0.3);
      break;
    case 'WATER':
      burst(w, { count: Math.round(40 * k), at, spread: 10, speed: [160, 380 * k], angle: -Math.PI / 2, cone: 1.3, life: [0.5, 0.9], size: [4, 9], colors: ['#bfe8ff', '#6fc8ff', '#ffffff'], shape: 'drop', g: 900, add: false });
      burst(w, { count: Math.round(14 * k), at, spread: 26, speed: [20, 90], life: [0.6, 1.1], size: [5, 11], colors: ['#d8f4ff', '#6fc8ff'], shape: 'bubble', g: -60 });
      ring('#9ad8ff', 150 * k, 0.6);
      ring('#ffffff', 90 * k, 0.4);
      shake(w, heavy || big ? 8 : 4, 0.25);
      break;
    case 'NATURE':
      burst(w, { count: Math.round(30 * k), at, spread: 12, speed: [100, 300 * k], life: [0.6, 1.1], size: [6, 11], shrink: 0.7, colors: ['#7ed957', '#4fae35', '#a8e57d'], shape: 'leaf', spin: 10, drag: 2, g: 120, add: false });
      burst(w, { count: Math.round(12 * k), at, spread: 20, speed: [40, 140], life: [0.8, 1.3], size: [5, 9], shrink: 0.7, colors: ['#ffd6e8', '#ffb0d0', '#ffffff'], shape: 'petal', spin: 6, drag: 1.5, g: 60, add: false });
      vines(w, feet, look, own === 'thorn' ? '#b06ae0' : null);
      shake(w, heavy || big ? 7 : 3, 0.25);
      break;
    case 'EARTH':
      burst(w, { count: Math.round(22 * k), at: feet, spread: 16, speed: [180, 420 * k], angle: -Math.PI / 2, cone: 1.1, life: [0.6, 1], size: [6, 13], shrink: 1, colors: ['#b0834a', '#8a6236', '#d6b07a'], shape: 'rock', spin: 10, g: 1200, add: false });
      burst(w, { count: Math.round(16 * k), at: feet, spread: 30, speed: [60, 180], angle: -Math.PI / 2, cone: 1.4, life: [0.8, 1.4], size: [20, 36], shrink: 1.8, colors: ['rgba(200,160,110,0.5)', 'rgba(170,130,90,0.45)'], shape: 'smoke', drag: 2, add: false, flat: 0.4 });
      ring('#d6b07a', 200 * k, 0.5);
      shake(w, heavy || big ? 16 : 10, 0.4);
      break;
    case 'METAL':
      slashes(w, at, '#ffffff', '#cfd9e6', heavy || big ? 3 : 2);
      burst(w, { count: Math.round(30 * k), at, spread: 6, speed: [250, 600 * k], life: [0.15, 0.35], size: [1.5, 3], shrink: 1, colors: ['#ffffff', '#ffe9a8', '#cfd9e6'], shape: 'spark', g: 600 });
      flash(w, '#ffffff', heavy || big ? 0.3 : 0.12, 0.15);
      shake(w, heavy || big ? 10 : 5, 0.25);
      break;
    case 'LIGHTNING':
      bolt(w, { x: at.x + (w.rand() * 60 - 30), y: at.y - 700 }, at, look, 0.32);
      if (heavy || big) bolt(w, { x: at.x + (w.rand() * 160 - 80), y: at.y - 700 }, { x: at.x + 20, y: at.y + 10 }, look, 0.26);
      burst(w, { count: Math.round(36 * k), at, spread: 8, speed: [200, 520 * k], life: [0.12, 0.3], size: [2, 3.5], shrink: 1, colors: ['#fffbd0', '#ffe14a', '#ffffff'], shape: 'spark' });
      burst(w, { count: 1, at, speed: [0, 0], life: [0.2, 0.2], size: [110 * k, 110 * k], shrink: 1.3, colors: ['rgba(255,250,200,0.95)'], shape: 'glow' });
      flash(w, '#fffbe0', heavy || big ? 0.55 : 0.32, 0.2);
      shake(w, heavy || big ? 12 : 7, 0.3);
      break;
    case 'DARK':
      swirl(w, at, look, true);
      burst(w, { count: Math.round(18 * k), at, spread: 24, speed: [30, 120], life: [0.8, 1.3], size: [18, 32], shrink: 1.6, colors: ['rgba(60,25,110,0.55)', 'rgba(30,10,60,0.5)'], shape: 'smoke', add: false });
      burst(w, { count: Math.round(20 * k), at, spread: 10, speed: [80, 240], life: [0.4, 0.8], size: [3, 6], colors: ['#d9b8ff', '#9a6ad6'], shape: 'glow' });
      flash(w, '#3a1a6a', heavy || big ? 0.32 : 0.15, 0.3);
      shake(w, heavy || big ? 9 : 4, 0.3);
      break;
    case 'LIGHT':
      beam(w, feet, look, 0.55, big ? 130 : heavy ? 95 : 70);
      burst(w, { count: Math.round(30 * k), at, spread: 18, speed: [80, 260 * k], life: [0.5, 1], size: [5, 10], shrink: 0.3, colors: ['#ffffff', '#fff2a8', '#ffe98a'], shape: 'star', spin: 6, drag: 2 });
      ring('#fff2a8', 160 * k, 0.55);
      flash(w, '#fffbe8', heavy || big ? 0.4 : 0.2, 0.3);
      break;
    case 'VOID':
      swirl(w, at, look, false);
      burst(w, { count: 1, at, speed: [0, 0], life: [0.5, 0.5], size: [140 * k, 140 * k], shrink: 0.05, colors: ['rgba(140,124,255,0.7)'], shape: 'ring' });
      burst(w, { count: Math.round(24 * k), at, spread: 4, speed: [200, 420], life: [0.3, 0.5], size: [3, 5], colors: ['#e4dcff', '#8c7cff'], shape: 'spark' });
      flash(w, '#2e2470', heavy || big ? 0.4 : 0.2, 0.3);
      shake(w, heavy || big ? 10 : 5, 0.3);
      break;
    default:
      // A plain blow: a white star, a short slash and dust.
      burst(w, { count: 1, at, speed: [0, 0], life: [0.18, 0.18], size: [60 * k, 60 * k], shrink: 1.5, colors: ['rgba(255,255,255,0.95)'], shape: 'star' });
      slashes(w, at, '#ffffff', look.glow, heavy ? 2 : 1);
      burst(w, { count: Math.round(18 * k), at, spread: 6, speed: [150, 380], life: [0.2, 0.4], size: [3, 6], colors: ['#ffffff', '#fff1c4'], shape: 'star', spin: 10 });
      burst(w, { count: 6, at: feet, spread: 20, speed: [30, 90], angle: -Math.PI / 2, cone: 1.2, life: [0.5, 0.9], size: [14, 24], shrink: 1.6, colors: ['rgba(210,190,150,0.45)'], shape: 'smoke', add: false, flat: 0.4 });
      shake(w, heavy ? 8 : 4, 0.22);
  }
}

/** The ground shaken under a target (a physical skill hitting a whole side). */
export function slam(w: FxWorld, feet: Pt, element: Element | null) {
  const look = lookOf(element ?? 'EARTH');
  for (let i = 0; i < 3; i += 1) burst(w, { count: 1, at: feet, speed: [0, 0], life: [0.55, 0.55], size: [30, 30], shrink: 7 + i * 1.5, colors: [i === 0 ? '#ffffff' : look.color], shape: 'ring', wait: i * 0.07 });
  burst(w, { count: 16, at: feet, spread: 20, speed: [200, 420], angle: -Math.PI / 2, cone: 1, life: [0.5, 0.9], size: [5, 11], colors: ['#b0834a', '#8a6236', '#d6b07a'], shape: 'rock', spin: 10, g: 1200, add: false });
  burst(w, { count: 10, at: feet, spread: 40, speed: [40, 140], angle: -Math.PI / 2, cone: 1.4, life: [0.7, 1.2], size: [20, 34], shrink: 1.8, colors: ['rgba(200,160,110,0.45)'], shape: 'smoke', add: false, flat: 0.4 });
  shake(w, 14, 0.4);
}

/** A blow that lands on a whole side from above (a skill aimed at every enemy): each element brings its own rain. */
export function fromAbove(w: FxWorld, feet: Pt, height: number, element: Element | null, delay: number) {
  const look = lookOf(element);
  const top = { x: feet.x + (w.rand() * 40 - 20), y: feet.y - height - 520 };
  const at = { x: feet.x, y: feet.y - height * 0.45 };
  switch (element) {
    case 'LIGHTNING':
      addShape(w, { wait: delay, dur: 0.01, add: true, draw() {}, tick: (_t, _dt, world) => bolt(world, top, at, look, 0.32) });
      break;
    case 'LIGHT':
      addShape(w, { wait: delay, dur: 0.01, add: true, draw() {}, tick: (_t, _dt, world) => beam(world, feet, look, 0.6, 80) });
      break;
    case 'FIRE':
      pillar(w, feet, height, look, delay);
      break;
    default:
      burst(w, { count: 14, at: top, spread: 60, speed: [500, 700], angle: Math.PI / 2, cone: 0.08, life: [0.6, 0.75], size: element === 'EARTH' ? [10, 18] : [4, 8], colors: [look.color, look.glow], shape: element === 'EARTH' ? 'rock' : element === 'WATER' ? 'drop' : element === 'NATURE' ? 'leaf' : element === 'METAL' ? 'shard' : 'glow', spin: 6, wait: delay, add: element !== 'EARTH' && element !== 'NATURE' });
  }
}

function pillar(w: FxWorld, feet: Pt, height: number, look: Look, delay: number) {
  addShape(w, {
    wait: delay,
    dur: 0.7,
    add: true,
    draw(ctx, t) {
      const h = height * 1.6 * easeOut(clamp01(t / 0.35));
      const wdt = 70 * (t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3);
      const g = ctx.createLinearGradient(0, feet.y, 0, feet.y - h);
      g.addColorStop(0, '#fff1b0');
      g.addColorStop(0.3, look.color);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(feet.x, feet.y - h / 2, wdt / 2, h / 2, 0, 0, TAU);
      ctx.fill();
    },
    tick(t, dt, world) {
      if (t > 0.8) return;
      burst(world, { count: Math.ceil(dt * 120), at: feet, spread: 30, speed: [200, 500], angle: -Math.PI / 2, cone: 0.25, life: [0.4, 0.8], size: [8, 16], colors: ['#ff9a3a', '#ffcf5a', '#ff5a1a'], shape: 'ember', drag: 1.5, flat: 0.4 });
    },
  });
}

/** Vines that grow out of the ground and wrap around the target (Nature); `berry` = a poison bead on each tip. */
function vines(w: FxWorld, feet: Pt, look: Look, berry: string | null) {
  const strands = Array.from({ length: 5 }, (_, i) => ({ side: i % 2 === 0 ? 1 : -1, reach: 50 + w.rand() * 50, lift: 80 + w.rand() * 90, off: (w.rand() * 2 - 1) * 30 }));
  addShape(w, {
    wait: 0,
    dur: 0.9,
    add: false,
    draw(ctx, t) {
      const grow = easeOut(clamp01(t / 0.45));
      const fade = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      ctx.globalAlpha = fade;
      ctx.lineCap = 'round';
      for (const s of strands) {
        ctx.strokeStyle = '#2f7a26';
        ctx.lineWidth = 7;
        const x0 = feet.x + s.off;
        const y0 = feet.y;
        const x1 = x0 + s.side * s.reach * grow;
        const y1 = y0 - s.lift * grow;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(x0 - s.side * 30, y0 - s.lift * 0.4 * grow, x1 + s.side * 20, y1 + 30, x1, y1);
        ctx.stroke();
        ctx.strokeStyle = look.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = berry ?? '#7ed957';
        ctx.beginPath();
        ctx.arc(x1, y1, berry ? 5 : 4, 0, TAU);
        ctx.fill();
      }
    },
  });
}
