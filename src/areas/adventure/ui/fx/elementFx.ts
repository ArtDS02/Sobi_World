// The effect recipes of the battle canvas (adventure-big-update-1): the magic circle a caster draws before a skill, each element's
// travel and impact (fire balls and blasts, water orbs and splashes, leaves and vines, falling rocks, steel slashes, bolts from the
// sky, dark smoke, beams of light, the void pulling in), slams, auras, heals, buffs and curses, the tears of a fighter that is hit,
// the stars of a stunned one, a guard's shield, a knock-out's puff and the teleport light that brings every fighter onto the field.
// Each recipe fills the world at the moment it is called (shapes can wait inside it); battleStage.ts decides when.
import type { Element } from '../../../../systems/combat/types';
import { addShape, burst, clamp01, easeIn, easeInOut, easeOut, easeOutBack, flash, lerp, shake, type FxWorld, type Pt } from './fxEngine';

export interface Look {
  color: string;
  glow: string;
}

/** The colours of each element's effects (the shapes differ too, not only the colour). */
export const LOOKS: Readonly<Record<Element | 'NEUTRAL' | 'HEAL', Look & { dark: string }>> = {
  FIRE: { color: '#ff7a2a', glow: '#ffd36a', dark: '#b8320c' },
  WATER: { color: '#3fb2ff', glow: '#d8f4ff', dark: '#1660b0' },
  NATURE: { color: '#5cc24e', glow: '#d6ffa8', dark: '#2c7a2a' },
  EARTH: { color: '#c08a50', glow: '#f6deb0', dark: '#6b4524' },
  METAL: { color: '#cfd9e6', glow: '#ffffff', dark: '#6c7b8c' },
  LIGHTNING: { color: '#ffe14a', glow: '#fffbd0', dark: '#c99a00' },
  DARK: { color: '#7a4ed0', glow: '#d9b8ff', dark: '#2a1650' },
  LIGHT: { color: '#ffe98a', glow: '#ffffff', dark: '#d9a520' },
  VOID: { color: '#8c7cff', glow: '#e4dcff', dark: '#2e2470' },
  NEUTRAL: { color: '#ffe7b0', glow: '#ffffff', dark: '#a0703a' },
  HEAL: { color: '#7ef0a0', glow: '#e8fff0', dark: '#2c9a5a' },
};

export const lookOf = (e: Element | null): Look & { dark: string } => (e ? LOOKS[e] : LOOKS.NEUTRAL);

const TAU = Math.PI * 2;

// ---- the magic circle and the charge ---------------------------------------------------------------------------------

/**
 * The rune circle on the ground around a caster (seen from the side, so squashed), a column of light behind it and motes rising,
 * for `dur` seconds. `big` = an Ultimate (wider, two circles turning against each other).
 */
export function magicCircle(w: FxWorld, feet: Pt, height: number, look: Look, dur: number, big: boolean) {
  const R = Math.max(70, height * 0.62) * (big ? 1.45 : 1);
  const runes = Array.from({ length: big ? 16 : 12 }, () => Math.floor(w.rand() * 4));
  addShape(w, {
    wait: 0,
    dur,
    add: true,
    ground: true,
    draw(ctx, t) {
      const grow = easeOutBack(clamp01(t / 0.28));
      const fade = t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1;
      const r = R * grow;
      const spin = t * dur * (big ? 1.6 : 1.1);
      ctx.translate(feet.x, feet.y);
      ctx.globalAlpha = 0.9 * fade;
      // The column of light behind the caster.
      const col = ctx.createLinearGradient(0, 0, 0, -height * 1.5);
      col.addColorStop(0, look.color);
      col.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.4 * fade * (0.8 + 0.2 * Math.sin(t * dur * 12));
      ctx.fillRect(-r * 0.55, -height * 1.5, r * 1.1, height * 1.5);
      ctx.globalAlpha = 0.95 * fade;
      ctx.scale(1, 0.34);
      ctx.shadowColor = look.glow;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = look.color;
      // Soft disc.
      const disc = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
      disc.addColorStop(0, 'rgba(255,255,255,0.0)');
      disc.addColorStop(0.75, look.color);
      disc.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.4 * fade;
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = fade;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = look.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.84, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = look.glow;
      // Ticks and runes on the band between the two rings, turning.
      ctx.save();
      ctx.rotate(spin);
      for (let i = 0; i < runes.length; i += 1) {
        const a = (i / runes.length) * TAU;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(r * 0.92, 0);
        ctx.rotate(Math.PI / 2);
        ctx.scale(1.6, 1.6);
        ctx.lineWidth = 3;
        ctx.beginPath();
        switch (runes[i]) {
          case 0:
            ctx.moveTo(-5, -4);
            ctx.lineTo(0, 4);
            ctx.lineTo(5, -4);
            break;
          case 1:
            ctx.arc(0, 0, 4, 0, TAU);
            break;
          case 2:
            ctx.moveTo(-5, 0);
            ctx.lineTo(5, 0);
            ctx.moveTo(0, -4);
            ctx.lineTo(0, 4);
            break;
          default:
            ctx.moveTo(-4, -4);
            ctx.lineTo(4, 4);
            ctx.moveTo(4, -4);
            ctx.lineTo(-4, 4);
        }
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      // The star inside, turning the other way.
      ctx.save();
      ctx.rotate(-spin * 0.7);
      ctx.strokeStyle = look.color;
      ctx.lineWidth = 5;
      const n = big ? 8 : 6;
      const step = big ? 3 : 2;
      ctx.beginPath();
      for (let i = 0; i <= n; i += 1) {
        const a = ((i * step) % n) * (TAU / n);
        const x = Math.cos(a) * r * 0.8;
        const y = Math.sin(a) * r * 0.8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (!big) {
        ctx.beginPath();
        for (let i = 0; i <= n; i += 1) {
          const a = ((i * step + 1) % n) * (TAU / n);
          const x = Math.cos(a) * r * 0.8;
          const y = Math.sin(a) * r * 0.8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * TAU;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, 5, 0, TAU);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, TAU);
      ctx.stroke();
      ctx.restore();
      if (big) {
        ctx.save();
        ctx.rotate(spin * 1.4);
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.18, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    },
    tick(t, dt, world) {
      // Motes rising from the ring.
      if (t > 0.9) return;
      const n = dt * (big ? 70 : 38);
      for (let i = 0; i < n; i += 1) {
        const a = world.rand() * TAU;
        burst(world, {
          count: 1,
          at: { x: feet.x + Math.cos(a) * R * 0.85, y: feet.y + Math.sin(a) * R * 0.3 },
          speed: [40, 120],
          angle: -Math.PI / 2,
          cone: 0.25,
          life: [0.5, 0.9],
          size: [2, 5],
          colors: [look.glow, look.color],
          shape: world.rand() < 0.3 ? 'rune' : 'glow',
          drag: 1.2,
        });
      }
    },
  });
}

/** Light gathering at the caster's chest just before the skill leaves (the wind-up). */
export function charge(w: FxWorld, chest: Pt, look: Look, dur: number, big: boolean) {
  const R = big ? 110 : 70;
  addShape(w, {
    wait: 0,
    dur,
    add: true,
    draw(ctx, t) {
      const r = lerp(6, big ? 34 : 22, easeOut(t));
      const g = ctx.createRadialGradient(chest.x, chest.y, 0, chest.x, chest.y, r * 2.2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, look.glow);
      g.addColorStop(0.6, look.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(chest.x, chest.y, r * 2.2, 0, TAU);
      ctx.fill();
    },
    tick(_t, dt, world) {
      const n = dt * (big ? 90 : 50);
      for (let i = 0; i < n; i += 1) {
        const a = world.rand() * TAU;
        const d = R * (0.7 + world.rand() * 0.5);
        const at = { x: chest.x + Math.cos(a) * d, y: chest.y + Math.sin(a) * d };
        const life = 0.28;
        burst(world, { count: 1, at, speed: [d / life, d / life], angle: a + Math.PI, cone: 0, life: [life, life], size: [2, 4], shrink: 1, colors: [look.glow, look.color], shape: 'spark' });
      }
    },
  });
}

// ---- travelling effects --------------------------------------------------------------------------------------------

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

// ---- landing -------------------------------------------------------------------------------------------------------

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
function swirl(w: FxWorld, at: Pt, look: Look, out: boolean) {
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

// ---- support, statuses, reactions ----------------------------------------------------------------------------------

/** A soft ring rising around a friend (a support skill landing). */
export function aura(w: FxWorld, feet: Pt, height: number, look: Look) {
  for (let i = 0; i < 3; i += 1) {
    addShape(w, {
      wait: i * 0.12,
      dur: 0.7,
      add: true,
      draw(ctx, t) {
        const y = feet.y - height * 0.9 * easeOut(t);
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.strokeStyle = look.color;
        ctx.shadowColor = look.glow;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(feet.x, y, 70 - i * 8, 22 - i * 2, 0, 0, TAU);
        ctx.stroke();
      },
    });
  }
  burst(w, { count: 22, at: feet, spread: 60, speed: [60, 160], angle: -Math.PI / 2, cone: 0.3, life: [0.6, 1.1], size: [3, 6], colors: [look.glow, look.color], shape: 'star', spin: 4, drag: 1, flat: 0.3 });
}

export function heal(w: FxWorld, feet: Pt, height: number) {
  const look = LOOKS.HEAL;
  aura(w, feet, height, look);
  burst(w, { count: 14, at: { x: feet.x, y: feet.y - height * 0.3 }, spread: 50, speed: [50, 120], angle: -Math.PI / 2, cone: 0.25, life: [0.8, 1.3], size: [7, 11], shrink: 0.6, colors: ['#7ef0a0', '#c8ffd8'], shape: 'plus', drag: 1 });
}

/** Arrows going up (a buff) or down (a curse) over a unit. */
export function statusArrows(w: FxWorld, feet: Pt, height: number, good: boolean) {
  const color = good ? ['#7fd0ff', '#ffe17a'] : ['#b07ae0', '#7a4ed0'];
  burst(w, {
    count: 8,
    at: { x: feet.x, y: feet.y - (good ? height * 0.2 : height * 0.95) },
    spread: 50,
    speed: [60, 120],
    angle: good ? -Math.PI / 2 : Math.PI / 2,
    cone: 0.1,
    life: [0.7, 1],
    size: [9, 13],
    shrink: 0.8,
    colors: color,
    shape: 'arrow',
    drag: 1.2,
    flat: 0.4,
  });
  if (!good) burst(w, { count: 8, at: { x: feet.x, y: feet.y - height * 0.5 }, spread: 40, speed: [10, 40], life: [0.8, 1.2], size: [16, 26], shrink: 1.5, colors: ['rgba(90,50,140,0.4)'], shape: 'smoke', add: false });
  // Arrows point up; turn the falling ones over.
  if (!good) for (const p of w.particles.slice(-16)) if (p.shape === 'arrow') p.rot = Math.PI;
}

/** The tears of a fighter that was hit: drops jumping from both eyes and falling, for a while. */
export function tears(w: FxWorld, eyes: Pt, facing: 1 | -1, strong: boolean) {
  const n = strong ? 7 : 5;
  for (let i = 0; i < n; i += 1) {
    for (const side of [-1, 1] as const) {
      burst(w, {
        count: 1,
        at: { x: eyes.x + side * 14 + facing * 6, y: eyes.y },
        speed: [90, 170],
        angle: -Math.PI / 2 + side * 0.9,
        cone: 0.25,
        life: [0.55, 0.75],
        size: [4.5, 6.5],
        shrink: 0.8,
        colors: ['#6fc8ff', '#a8e0ff'],
        shape: 'drop',
        g: 700,
        add: false,
        wait: i * 0.07,
      });
    }
  }
}

/** A dodge: a pale afterimage stays where the body was (the stage draws the picture, this only adds the swish). */
export function swish(w: FxWorld, at: Pt, facing: 1 | -1) {
  burst(w, { count: 10, at, spread: 30, speed: [120, 260], angle: facing === 1 ? Math.PI : 0, cone: 0.3, life: [0.2, 0.35], size: [2, 3], colors: ['#ffffff', '#e8f4ff'], shape: 'spark' });
}

/** Stars turning over the head of a stunned unit. */
export function stunStars(w: FxWorld, head: Pt, dur: number) {
  addShape(w, {
    wait: 0,
    dur,
    add: false,
    draw(ctx, t) {
      ctx.translate(head.x, head.y);
      ctx.scale(1, 0.4);
      ctx.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
      for (let i = 0; i < 3; i += 1) {
        const a = t * dur * 6 + (i * TAU) / 3;
        ctx.save();
        ctx.translate(Math.cos(a) * 34, Math.sin(a) * 34);
        ctx.scale(1, 2.5);
        ctx.fillStyle = '#ffe14a';
        ctx.strokeStyle = '#c99a00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k < 10; k += 1) {
          const b = (k * Math.PI) / 5 - Math.PI / 2;
          const r = k % 2 === 0 ? 8 : 3.5;
          ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    },
  });
}

/** A bubble of light in front of a guarding unit. */
export function shield(w: FxWorld, chest: Pt, height: number, facing: 1 | -1, dur: number) {
  addShape(w, {
    wait: 0,
    dur,
    add: true,
    draw(ctx, t) {
      const open = easeOutBack(clamp01(t / 0.3));
      const fade = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
      ctx.globalAlpha = 0.75 * fade;
      ctx.translate(chest.x + facing * height * 0.32, chest.y);
      ctx.scale(open * 0.45, open);
      const r = height * 0.55;
      const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r);
      g.addColorStop(0, 'rgba(150,220,255,0)');
      g.addColorStop(0.8, 'rgba(150,220,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
    },
  });
}

/** The puff of a knock-out. */
export function koPuff(w: FxWorld, feet: Pt, height: number) {
  burst(w, { count: 18, at: { x: feet.x, y: feet.y - height * 0.3 }, spread: 40, speed: [30, 110], life: [0.8, 1.3], size: [20, 34], shrink: 1.6, colors: ['rgba(240,235,225,0.6)', 'rgba(210,200,190,0.5)'], shape: 'smoke', add: false, g: -30 });
  burst(w, { count: 10, at: { x: feet.x, y: feet.y - height * 0.7 }, spread: 20, speed: [60, 140], angle: -Math.PI / 2, cone: 0.8, life: [0.7, 1], size: [5, 8], colors: ['#ffffff', '#ffe9a8'], shape: 'star', spin: 6 });
}

/** The light that brings a fighter onto the field when a battle starts. */
export function teleportIn(w: FxWorld, feet: Pt, height: number, color: string, delay: number) {
  addShape(w, {
    wait: delay,
    dur: 0.75,
    add: true,
    draw(ctx, t) {
      const wd = (t < 0.3 ? easeOut(t / 0.3) : 1 - easeIn((t - 0.3) / 0.7)) * 60;
      const g = ctx.createLinearGradient(feet.x - wd, 0, feet.x + wd, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.4, color);
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(0.6, color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(feet.x - wd, 0, wd * 2, feet.y + 6);
      ctx.beginPath();
      ctx.ellipse(feet.x, feet.y, wd * 1.6, wd * 0.45, 0, 0, TAU);
      ctx.fill();
    },
    tick(t, dt, world) {
      if (t > 0.6) return;
      burst(world, { count: Math.ceil(dt * 60), at: { x: feet.x, y: feet.y - height * world.rand() }, spread: 30, speed: [30, 90], angle: -Math.PI / 2, cone: 0.3, life: [0.4, 0.8], size: [2, 4], colors: ['#ffffff', color], shape: 'glow' });
    },
  });
  addShape(w, { wait: delay + 0.22, dur: 0.01, add: true, draw() {}, tick: (_t, _dt, world) => burst(world, { count: 1, at: feet, speed: [0, 0], life: [0.5, 0.5], size: [24, 24], shrink: 7, colors: ['#ffffff'], shape: 'ring' }) });
}
