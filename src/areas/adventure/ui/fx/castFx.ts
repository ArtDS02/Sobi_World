// The caster's side of a skill: the rune circle on the ground with its column of light, the light gathering at the chest before
// the skill leaves, and the teleport light that brings every fighter onto the field when a battle starts (adventure-big-update-1 §5–§8). Each recipe fills the battle canvas's world at the moment it is called (shapes can
// wait inside it); battleStage.ts decides when.
import { addShape, burst, clamp01, easeIn, easeOut, easeOutBack, lerp, type FxWorld, type Pt } from './fxEngine';
import { TAU, type Look } from './looks';

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
