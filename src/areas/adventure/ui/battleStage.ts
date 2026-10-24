// The battle's stage (adventure-big-update-1 §5–§8): one canvas over the field that never goes away while the DOM under it is redrawn,
// and a frame loop that plays the step on screen (battleFxView.playingStep: who acts when, from battleMotion.ts). For every beat the
// caster first stands in a magic circle with its chant, then winds up and the skill travels and lands in its element's style; the one
// reached is knocked back and cries (a hit), or only leans away (a miss), heals, glows or shivers; a knocked-out unit falls into a puff.
// A new battle first brings every fighter in with a teleport light, flickering into place. The fighters' bodies (DOM) are moved by
// tweens computed each frame from the step's clock, so a redraw in the middle never restarts anything. Sounds are cued on the same
// clock. Presentation only: it reads the step and the DOM, never the battle. Reduced motion: no canvas, no tweens (sounds stay).
import { ENTER_MS, playingStep, type PlayingStep } from './battleFxView';
import type { MotionBeat, ReactionCue, ReactionKind } from './battleMotion';
import { aura, charge, fromAbove, heal, impact, koPuff, lookOf, magicCircle, projectile, shield, slam, statusArrows, stunStars, swish, teleportIn, tears } from './fx/elementFx';
import { busy, clamp01, draw, easeIn, easeInOut, easeOut, lerp, newWorld, seeded, shakeOffset, step, type FxWorld, type Pt } from './fx/fxEngine';
import { BODY, SKILL_MOTION, bodyOf } from './motionProfiles';

/** The sounds of a battle (manifest audio ids; a missing file is silence). */
export type BattleSound = 'adv_battle_start' | 'adv_cast' | 'adv_hit' | 'adv_crit' | 'adv_miss' | 'adv_heal' | 'adv_ko';

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

/** How long each reaction plays (ms). */
const REACT_MS: Readonly<Record<ReactionKind, number>> = { hit: 520, 'hit-heavy': 700, heal: 620, buff: 560, debuff: 620, miss: 480, ko: 640 };

interface Anchor {
  side: 'ally' | 'enemy';
  /** Feet, chest, eyes in canvas px; the body's layout height. */
  feet: Pt;
  chest: Pt;
  eyes: Pt;
  height: number;
  width: number;
  body: HTMLElement;
  img: HTMLImageElement | null;
  down: boolean;
}

interface Cue {
  at: number;
  fire: () => void;
  done: boolean;
}

/** A bump that rises fast and settles (0 → 1 → 0 over t ∈ [0, 1]). */
const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.18 ? easeOut(t / 0.18) : 1 - easeInOut((t - 0.18) / 0.82));

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

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

  const play = (s: BattleSound) => d.sound?.(s);

  /** The cues of a step: circles, chants, wind-ups, travels, impacts and reactions, each at its time on the step's clock. */
  function cuesOf(p: Readonly<PlayingStep>): Cue[] {
    const out: Cue[] = [];
    const at = (t: number, fire: () => void) => out.push({ at: t, fire, done: false });
    const reduce = d.reduceMotion();
    if (p.enter) {
      at(-ENTER_MS, () => play('adv_battle_start'));
      if (!reduce) {
        at(-ENTER_MS, () => {
          let i = 0;
          for (const [, a] of anchors) {
            teleportIn(world, a.feet, a.height, a.side === 'ally' ? '#9ae6ff' : '#d9b8ff', (a.side === 'ally' ? 0 : 0.25) + (i++ % 4) * 0.08);
          }
        });
      }
    }
    for (const b of p.motion.beats) {
      if (!b.actor) continue;
      const actor = b.actor;
      const look = lookOf(b.element);
      const ult = b.pose === 'ultimate';
      if (b.circle) {
        at(b.start, () => play('adv_cast'));
        if (!reduce)
          at(b.start, () => {
            const a = anchors.get(actor);
            if (a) magicCircle(world, a.feet, a.height, look, (b.cast - b.start) / 1000 + 0.25, ult);
            if (ult) world.dimTo = 0.45;
          });
      }
      if (reduce) continue;
      if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate')
        at(b.cast, () => {
          const a = anchors.get(actor);
          if (a) charge(world, a.chest, look, Math.max(0.12, (b.release - b.cast) / 1000), ult);
        });
      if (b.pose === 'guard')
        at(b.start, () => {
          const a = anchors.get(actor);
          if (a) shield(world, a.chest, a.height, a.side === 'ally' ? 1 : -1, Math.max(0.4, (b.end - b.start) / 1000 + 0.3));
        });
      if (b.pose === 'stunned')
        at(b.start, () => {
          const a = anchors.get(actor);
          if (a) stunStars(world, { x: a.feet.x, y: a.feet.y - a.height * 0.95 }, Math.max(0.5, (b.end - b.start) / 1000));
        });
      if (b.delivery === 'projectile')
        at(b.release, () => {
          const a = anchors.get(actor);
          for (const t of b.targets) {
            const to = anchors.get(t);
            if (a && to) projectile(world, a.chest, to.chest, Math.max(0.12, (b.impact - b.release) / 1000), b.element, b.skillId ? (SKILL_MOTION[b.skillId]?.shape ?? null) : null);
          }
        });
      at(b.impact, () => land(b));
      if (ult) at(b.end, () => (world.dimTo = 0));
    }
    for (const r of p.motion.reactions) at(r.at, () => react(r));
    // One sound per kind and moment: a blow that reaches three units hits once.
    const heard = new Set<string>();
    for (const r of p.motion.reactions) {
      const s: BattleSound | null = r.kind === 'hit' ? 'adv_hit' : r.kind === 'hit-heavy' ? 'adv_crit' : r.kind === 'miss' ? 'adv_miss' : r.kind === 'heal' ? 'adv_heal' : r.kind === 'ko' ? 'adv_ko' : null;
      const k = `${s}:${Math.round(r.at / 40)}`;
      if (!s || heard.has(k)) continue;
      heard.add(k);
      at(r.at, () => play(s));
    }
    return out.sort((x, y) => x.at - y.at);
  }

  /** What the beat's effect does where it lands. */
  function land(b: MotionBeat) {
    const big = b.pose === 'ultimate';
    const own = b.skillId ? (SKILL_MOTION[b.skillId]?.shape ?? null) : null;
    const reactions = playingStep().motion.reactions;
    b.targets.forEach((t, i) => {
      const a = anchors.get(t);
      if (!a) return;
      const heavy = reactions.some((r) => r.unit === t && r.kind === 'hit-heavy' && Math.abs(r.at - b.impact) < 5);
      const missed = reactions.some((r) => r.unit === t && r.kind === 'miss' && Math.abs(r.at - b.impact) < 5);
      const friend = anchors.get(b.actor ?? '')?.side === a.side;
      if (friend || b.pose === 'support') {
        const healed = reactions.some((r) => r.unit === t && r.kind === 'heal' && Math.abs(r.at - b.impact) < 5);
        if (healed) heal(world, a.feet, a.height);
        else aura(world, a.feet, a.height, b.element ? lookOf(b.element) : lookOf(null));
        return;
      }
      if (missed) return;
      if (b.delivery === 'slam') slam(world, a.feet, b.element);
      if (b.delivery === 'burst' && b.targets.length > 1) fromAbove(world, a.feet, a.height, b.element, i * 0.05);
      impact(world, a.chest, a.feet, b.element, heavy, big, own);
    });
  }

  function react(r: ReactionCue) {
    const a = anchors.get(r.unit);
    if (!a || d.reduceMotion()) return;
    const facing = a.side === 'ally' ? 1 : -1;
    switch (r.kind) {
      case 'hit':
      case 'hit-heavy':
        tears(world, a.eyes, facing, r.kind === 'hit-heavy');
        break;
      case 'miss':
        swish(world, a.chest, facing);
        afterimage(a);
        break;
      case 'buff':
      case 'debuff':
        statusArrows(world, a.feet, a.height, r.kind === 'buff');
        break;
      case 'ko':
        koPuff(world, a.feet, a.height);
        break;
      default:
        break;
    }
  }

  /** A pale copy of the picture left where a unit stood when it dodged. */
  function afterimage(a: Anchor) {
    const img = a.img;
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const w = a.width;
    const h = a.height;
    const x = a.feet.x - w / 2;
    const y = a.feet.y - h;
    const flip = a.side === 'ally';
    world.shapes.push({
      wait: 0,
      dur: 0.38,
      age: 0,
      add: false,
      draw(c, t) {
        c.globalAlpha = 0.45 * (1 - t);
        c.translate(x + w / 2, y);
        if (flip) c.scale(-1, 1);
        c.filter = 'brightness(1.8) saturate(0.4)';
        try {
          c.drawImage(img, -w / 2, 0, w, h);
        } catch {
          // A picture that cannot be drawn leaves no afterimage.
        }
        c.filter = 'none';
      },
    });
  }

  /** The body of a unit at `t` ms into the step: where it is pushed, turned, squashed and how bright it is. */
  function poseOf(id: string, a: Anchor, p: Readonly<PlayingStep>, t: number, now: number): { tf: string; filter: string; opacity: number } {
    const plan = bodyOf(id);
    const profile = BODY[plan];
    const dir = a.side === 'ally' ? 1 : -1;
    // The idle loop: breathing, or bobbing for the ones that fly or float.
    const phase = ((hash(id) >>> 0) % profile.idleMs) / profile.idleMs;
    const cyc = Math.sin(((now / profile.idleMs + phase) % 1) * Math.PI * 2);
    let dx = 0;
    let dy = plan === 'flyer' ? cyc * 7 : plan === 'floater' ? cyc * 5 : plan === 'aquatic' ? cyc * 3 : 0;
    let rot = plan === 'aquatic' ? cyc * 1.5 : 0;
    let sx = 1 - cyc * 0.012;
    let sy = 1 + cyc * (plan === 'heavy' ? 0.018 : 0.028);
    let bright = 1;
    let gray = 0;
    let opacity = 1;
    let glow = '';
    for (const b of p.motion.beats) {
      if (b.actor !== id || !b.pose || t < b.start || t > b.end + 40) continue;
      const target = anchors.get(b.targets[0] ?? '');
      if (b.circle && t < b.cast) {
        const k = clamp01((t - b.start) / Math.max(1, b.cast - b.start));
        dy -= (b.pose === 'ultimate' ? 26 : 8) * easeOut(k);
        bright = Math.max(bright, 1 + 0.25 * Math.sin(k * Math.PI * 3) ** 2);
        glow = lookOf(b.element).glow;
      }
      const wind = clamp01((t - b.cast) / Math.max(1, b.release - b.cast));
      const go = clamp01((t - b.release) / Math.max(1, b.impact - b.release));
      const back = clamp01((t - b.impact - 60) / Math.max(1, b.end - b.impact - 60));
      if ((b.pose === 'attack' && b.delivery === 'melee') || (b.pose === 'ultimate' && b.delivery === 'melee')) {
        // Pull back, dash to the target, hit, come home.
        const reach = target ? target.feet.x - a.feet.x - dir * (a.width * 0.32 + target.width * 0.32) : dir * profile.lunge * 16;
        const lift = target ? (target.feet.y - a.feet.y) * 0.9 : 0;
        if (t < b.release) {
          dx += -dir * 22 * easeOut(wind);
          sx *= 1 + 0.06 * wind;
          sy *= 1 - 0.06 * wind;
          rot += -dir * 4 * wind;
        } else if (t < b.impact) {
          const e = easeIn(go);
          dx += lerp(-dir * 22, reach, e);
          dy += lift * e - Math.sin(go * Math.PI) * 26;
          sx *= 1.12 - 0.06 * go;
          sy *= 0.92 + 0.04 * go;
          rot += dir * 10 * go;
        } else {
          const e = easeInOut(back);
          dx += lerp(reach, 0, e);
          dy += lerp(lift, 0, e) - Math.sin(back * Math.PI) * 18;
          rot += dir * 10 * (1 - e);
        }
      } else if (b.delivery === 'slam') {
        // Jump up in place and come down on the impact.
        if (t < b.release) {
          sy *= 1 - 0.1 * wind;
          sx *= 1 + 0.08 * wind;
        } else if (t < b.impact) {
          dy += -Math.sin(go * Math.PI * 0.5) * 90 + go * go * 90;
          sy *= 1.08;
          sx *= 0.94;
        } else {
          const k = 1 - back;
          sy *= 1 - 0.12 * k * k;
          sx *= 1 + 0.1 * k * k;
        }
      } else if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate') {
        // Lean back while the power gathers, thrust forward as it leaves, settle.
        if (t >= b.cast && t < b.release) {
          rot += -dir * 5 * easeOut(wind);
          dx += -dir * 8 * wind;
          bright = Math.max(bright, 1 + 0.35 * wind);
          glow = lookOf(b.element).glow;
          if (b.pose === 'ultimate') {
            sx *= 1 + 0.08 * wind;
            sy *= 1 + 0.08 * wind;
          }
        } else if (t >= b.release) {
          const k = 1 - easeOut(clamp01((t - b.release) / Math.max(1, b.end - b.release)));
          rot += dir * 7 * k;
          dx += dir * 14 * k;
          dy -= 6 * k;
        }
        if (b.pose === 'ultimate' && t < b.cast) {
          sx *= 1.1;
          sy *= 1.1;
        }
      } else if (b.pose === 'guard') {
        const k = Math.sin(clamp01((t - b.start) / Math.max(1, b.end - b.start)) * Math.PI);
        sy *= 1 - 0.08 * k;
        sx *= 1 + 0.06 * k;
        dx += -dir * 6 * k;
      } else if (b.pose === 'stunned') {
        rot += Math.sin((t - b.start) / 45) * 8;
      }
    }
    for (const r of p.motion.reactions) {
      if (r.unit !== id) continue;
      const len = REACT_MS[r.kind];
      const k = (t - r.at) / len;
      if (r.kind === 'ko') {
        if (k < 0) continue;
        const e = easeOut(clamp01(k));
        rot += -dir * 14 * e;
        sy *= 1 - 0.14 * e;
        dy += 10 * e;
        gray = Math.max(gray, e);
        opacity = Math.min(opacity, 1 - 0.6 * e);
        if (k < 0.15) bright = Math.max(bright, 2.2 - k * 8);
        continue;
      }
      if (k < 0 || k > 1) continue;
      const u = bump(k);
      switch (r.kind) {
        case 'hit':
        case 'hit-heavy': {
          const heavy = r.kind === 'hit-heavy';
          dx += -dir * (heavy ? 42 : 24) * u;
          rot += -dir * (heavy ? 17 : 10) * u;
          sx *= 1 + 0.05 * u;
          sy *= 1 - 0.07 * u;
          dx += Math.sin(k * 60) * 3 * (1 - k);
          if (k < 0.16) bright = Math.max(bright, 2.4 - k * 8);
          break;
        }
        case 'miss':
          dx += -dir * 40 * u;
          rot += -dir * 9 * u;
          dy -= 6 * u;
          opacity = Math.min(opacity, 1 - 0.25 * u);
          break;
        case 'heal':
          dy -= 10 * u;
          bright = Math.max(bright, 1 + 0.3 * u);
          glow = '#9ef0c8';
          break;
        case 'buff':
          dy -= 14 * Math.sin(Math.min(1, k * 2) * Math.PI);
          bright = Math.max(bright, 1 + 0.25 * u);
          glow = '#bfe8ff';
          break;
        case 'debuff':
          dx += Math.sin(k * 50) * 4 * (1 - k);
          glow = '#9a6ad6';
          break;
      }
    }
    // Coming in at the start of a battle: the picture flickers in after its light.
    if (p.enter && t < 0) {
      const into = (t + ENTER_MS) / ENTER_MS - (a.side === 'ally' ? 0.1 : 0.32);
      if (into < 0) opacity = 0;
      else if (into < 0.45) opacity = Math.min(opacity, Math.sin(into * 70) > 0 ? 0.25 + into : 0.05);
      bright = Math.max(bright, into < 0.6 ? 1.8 - into : 1);
    }
    const filter = `${bright > 1.01 ? `brightness(${bright.toFixed(2)}) ` : ''}${gray > 0.01 ? `grayscale(${gray.toFixed(2)}) ` : ''}${glow ? `drop-shadow(0 0 10px ${glow})` : ''}`.trim();
    return { tf: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`, filter, opacity };
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
        cues = cuesOf(p);
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
        const pose = poseOf(id, a, p, t, now);
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

