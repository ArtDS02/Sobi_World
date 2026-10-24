// Support and reactions: a ring rising around a friend, a heal, arrows of a buff or a curse, the tears of a fighter that was
// hit, the swish of a dodge, stars over a stunned one, a guard's shield, the puff of a knock-out (adventure-big-update-1 §5–§8). Each recipe fills the battle canvas's world at the moment it is called (shapes can
// wait inside it); battleStage.ts decides when.
import { addShape, burst, clamp01, easeOut, easeOutBack, type FxWorld, type Pt } from './fxEngine';
import { LOOKS, TAU, type Look } from './looks';

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
