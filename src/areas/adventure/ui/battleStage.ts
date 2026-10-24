// The battle's stage (adventure-big-update-1 §5–§8): one canvas over the field that never goes away while the DOM under it is redrawn,
// and a frame loop that plays the step on screen (battleFxView.playingStep: who acts when, from battleMotion.ts). For every beat the
// caster first stands in a magic circle with its chant, then winds up and the skill travels and lands in its element's style; the one
// reached is knocked back and cries (a hit), or only leans away (a miss), heals, glows or shivers; a knocked-out unit falls into a puff.
// A new battle first brings every fighter in with a teleport light, flickering into place. The fighters' bodies (DOM) are moved by
// tweens computed each frame from the step's clock, so a redraw in the middle never restarts anything. Sounds are cued on the same
// clock. Presentation only: it reads the step and the DOM, never the battle. Reduced motion: no canvas, no tweens (sounds stay).
import { playingStep } from './battleFxView';
import { stepCues, type Anchor, type BattleSound, type Cue } from './battleCues';
import { draw } from './fx/fxDraw';
import { busy, newWorld, seeded, shakeOffset, step, type FxWorld } from './fx/fxEngine';
import { hash, poseOf } from './battlePose';

export type { BattleSound };

export interface BattleStageDeps {
  /** The overlay the canvas is laid over (the Adventure's host). */
  host: HTMLElement;
  sound?: (key: BattleSound) => void;
  reduceMotion: () => boolean;
}

export interface BattleStage {
  /** The battle is (or is not) on screen: the loop runs while it is, or while effects are still fading. */
  setActive(active: boolean): void;
  dispose(): void;
}

export function createBattleStage(d: BattleStageDeps): BattleStage {
  const canvas = document.createElement('canvas');
  canvas.className = 'adventure-ui__fxcanvas';
  canvas.setAttribute('aria-hidden', 'true');
  // The ground layer lies under the fighters (magic circles), the air layer over them.
  const groundCanvas = document.createElement('canvas');
  groundCanvas.className = 'adventure-ui__fxcanvas is-ground';
  groundCanvas.setAttribute('aria-hidden', 'true');
  d.host.append(groundCanvas, canvas);
  const ctx = canvas.getContext('2d');
  const gctx = groundCanvas.getContext('2d');
  let world: FxWorld = newWorld();
  let key = '';
  let cues: Cue[] = [];
  let anchors = new Map<string, Anchor>();
  let active = false;
  let frame = 0;
  let last = 0;

  function measure(root: HTMLElement): Map<string, Anchor> {
    const base = canvas.getBoundingClientRect();
    const out = new Map<string, Anchor>();
    for (const unit of root.querySelectorAll<HTMLElement>('[data-unit]')) {
      const body = unit.querySelector<HTMLElement>('[data-body]');
      if (!body) continue;
      const r = unit.getBoundingClientRect();
      const left = r.left - base.left + body.offsetLeft;
      const top = r.top - base.top + body.offsetTop;
      const h = body.offsetHeight;
      const w = body.offsetWidth;
      const side = unit.dataset.side === 'enemy' ? 'enemy' : 'ally';
      const facing = side === 'ally' ? 1 : -1;
      out.set(unit.dataset.unit!, {
        side,
        feet: { x: left + w / 2, y: top + h },
        chest: { x: left + w / 2, y: top + h * 0.55 },
        eyes: { x: left + w / 2 + facing * w * 0.16, y: top + h * 0.42 },
        height: h,
        width: w,
        body,
        img: body.querySelector('img'),
        down: unit.classList.contains('is-down'),
      });
    }
    return out;
  }

  function resize(): boolean {
    const r = d.host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    for (const c of [canvas, groundCanvas]) {
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    }
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    return r.width > 0;
  }

  function tick() {
    // The page clock (not the frame's own stamp), the same one the step's clock reads.
    const now = performance.now();
    frame = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const root = d.host.querySelector<HTMLElement>('.adventure-ui__battle');
    const reduce = d.reduceMotion();
    if (root && resize()) {
      anchors = measure(root);
      const p = playingStep();
      if (p.key !== key) {
        key = p.key;
        world.rand = seeded(hash(key));
        cues = stepCues(p, { world: () => world, anchors: () => anchors, sound: d.sound, reduceMotion: d.reduceMotion });
        // A step already under way when it first shows (a reload) skips what is long past.
        const into = now - p.at;
        for (const c of cues) if (c.at < into - 250) c.done = true;
      }
      const t = now - p.at;
      for (const c of cues) {
        if (c.done || c.at > t) continue;
        c.done = true;
        c.fire();
      }
      for (const [id, a] of anchors) {
        if (reduce) {
          a.body.style.transform = '';
          a.body.style.filter = '';
          a.body.style.opacity = '';
          continue;
        }
        const pose = poseOf(id, a, anchors, p, t, now);
        a.body.style.transform = pose.tf;
        a.body.style.filter = pose.filter;
        a.body.style.opacity = pose.opacity < 0.999 ? pose.opacity.toFixed(2) : '';
      }
      step(world, dt);
      paint(root, reduce);
    } else {
      step(world, dt);
      paint(null, reduce);
    }
    if (active || busy(world)) frame = requestAnimationFrame(tick);
  }

  function paint(root: HTMLElement | null, reduce: boolean) {
    if (!ctx || !gctx) return;
    const r = d.host.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    gctx.clearRect(0, 0, r.width, r.height);
    const field = root?.querySelector<HTMLElement>('.adventure-ui__field');
    const off = reduce ? { x: 0, y: 0 } : shakeOffset(world);
    if (field) field.style.transform = off.x || off.y ? `translate(${off.x.toFixed(1)}px, ${off.y.toFixed(1)}px)` : '';
    if (reduce || !root) return;
    if (world.dim > 0.01) {
      ctx.fillStyle = `rgba(14, 10, 30, ${(world.dim * 0.85).toFixed(3)})`;
      ctx.fillRect(0, 0, r.width, r.height);
    }
    gctx.save();
    gctx.translate(off.x, off.y);
    draw(gctx, world, 'ground');
    gctx.restore();
    ctx.save();
    ctx.translate(off.x, off.y);
    draw(ctx, world, 'air');
    ctx.restore();
    if (world.flash) {
      const k = world.flash.left / world.flash.dur;
      ctx.globalAlpha = world.flash.alpha * k;
      ctx.fillStyle = world.flash.color;
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.globalAlpha = 1;
    }
  }

  const start = () => {
    if (!frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  };

  return {
    setActive(next) {
      active = next;
      canvas.classList.toggle('is-on', next);
      groundCanvas.classList.toggle('is-on', next);
      if (next) start();
      else {
        world = newWorld();
        key = '';
        cues = [];
      }
    },
    dispose() {
      active = false;
      if (frame) cancelAnimationFrame(frame);
      canvas.remove();
      groundCanvas.remove();
    },
  };
}

