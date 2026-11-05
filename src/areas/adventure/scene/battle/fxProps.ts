// The big objects of the battle scripts (decision 044 prop_actor): an `fxp_…` picture falling from the sky with its shadow growing,
// rising from the ground, sweeping across the screen, orbiting a unit, popping up, growing, thrown in an arc, flying straight,
// stretching from the actor to its target, hovering. A glow in the look's colour while its file is missing.
import * as Phaser from 'phaser';
import type { Act, Spot } from '../../../../../content/schemas/adventure/battleScript';
import type { ActHost } from './fxActs';
import { AIR_DEPTH, GROUND_DEPTH } from './fxBursts';
import type { FxAnchor } from './fxPlayer';
import { SHADOW_KEY, shapeKey } from './fxTextures';
import { modsOf, propFrame, type PropFrame } from '../../ui/propMotion';
import { canRipple, RippleProp, type PropPicture } from './fxRipple';

type SpotOf = (a: FxAnchor | null, spot: Spot | undefined, fallback: Spot) => { x: number; y: number };
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const fadeIO = (t: number, inn = 0.12, out = 0.25) => (t < inn ? t / inn : t > 1 - out ? (1 - t) / out : 1);

/** A big object `fxp_…` on its path (prop_actor). */
export function playProp(h: ActHost, spotOf: SpotOf, act: Extract<Act, { do: 'prop' }>, a: FxAnchor | null, from: FxAnchor | null, glow: number) {
  const W = h.scene.scale.width;
  const H = h.scene.scale.height;
  const unitH = a ? a.height : H;
  const size = unitH * act.size;
  const have = h.scene.textures.exists(act.img);
  const mods = modsOf(act.path, act);
  // prop_displace: a picture that bends along a wave (a Rope) when asked for and drawable; a plain Image otherwise.
  const ripple = have && mods.ripple && act.path !== 'stretch' && canRipple(h.scene) ? new RippleProp(h.scene, act.img, mods.ripple) : null;
  const img: PropPicture = ripple ?? h.scene.add.image(0, 0, have ? act.img : shapeKey('glow'));
  img.setDepth(act.under ? GROUND_DEPTH + 2 : AIR_DEPTH - 2);
  if (!have) img.setBlendMode(Phaser.BlendModes.ADD).setTint(glow);
  else if (act.tint !== undefined) img.setTint(act.tint as number);
  const ratio = have ? img.height / Math.max(1, img.width) : 1;
  const baseW = ratio > 1 ? size / ratio : size;
  let m: PropFrame = { prog: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
  const set = (x: number, y: number, scale: number, alpha: number) => img.setPosition(x, y + m.dy).setDisplaySize(baseW * scale * m.sx, baseW * ratio * scale * m.sy).setAlpha(alpha * (act.alpha ?? 1));
  const flipped = ((from ?? a)?.side === 'enemy') !== !!act.flip;
  img.setFlipX(flipped);
  const dir = flipped ? -1 : 1;
  const target = spotOf(a, act.spot, act.path === 'rise' || act.path === 'sweep' ? 'feet' : 'chest');
  const start = from ? from.chest : { x: dir > 0 ? -size : W + size, y: target.y };
  const spin = (act.spin ?? 0) * Math.PI * 2;
  if (act.shadow) {
    const sh = h.scene.add.image(target.x, a ? a.feet.y : H * 0.84, SHADOW_KEY).setDepth(GROUND_DEPTH).setTint(0x1a1020);
    h.add(act.dur, (t) => sh.setDisplaySize(size * (0.3 + 0.7 * Math.min(1, t * 1.6)), size * 0.3 * (0.3 + 0.7 * Math.min(1, t * 1.6))).setAlpha(0.5 * fadeIO(t, 0.1, 0.3)), () => sh.destroy());
  }
  const body = (t: number) => {
    switch (act.path) {
      case 'fall': {
        const e = m.prog;
        set(target.x, -size + (target.y + size) * e, 1, t > 0.85 ? (1 - t) / 0.15 : 1);
        img.setRotation(spin * t);
        return;
      }
      case 'rise': {
        img.setOrigin(0.5, 1);
        const up = t < 0.35 ? easeOut(t / 0.35) : t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
        set(target.x, target.y + size * ratio * (1 - up), 1, Math.min(1, up * 1.5));
        return;
      }
      case 'sweep': {
        img.setOrigin(0.5, act.spot === 'feet' || !act.spot ? 1 : 0.5);
        const x0 = dir > 0 ? -size : W + size;
        const x1 = dir > 0 ? W + size : -size;
        set(x0 + (x1 - x0) * m.prog, target.y, 1, fadeIO(t, 0.05, 0.1));
        return;
      }
      case 'orbit': {
        const r = (a?.width ?? 120) * 0.75;
        const ang = spin === 0 ? t * Math.PI * 2 : spin * t;
        set(target.x + Math.cos(ang) * r, target.y + Math.sin(ang) * r * 0.45, 1, fadeIO(t));
        return;
      }
      case 'pop': {
        const sc = t < 0.3 ? 1.2 * easeOut(t / 0.3) : t < 0.45 ? 1.2 - 0.2 * ((t - 0.3) / 0.15) : 1;
        set(target.x, target.y, sc, t > 0.75 ? (1 - t) / 0.25 : 1);
        img.setRotation(spin * t);
        return;
      }
      case 'grow':
        set(target.x, target.y, 0.2 + 0.8 * easeOut(Math.min(1, t / 0.6)), t > 0.8 ? (1 - t) / 0.2 : Math.min(1, t * 5));
        img.setRotation(spin * t);
        return;
      case 'throw':
      case 'fly': {
        const e = m.prog;
        const arc = act.path === 'throw' ? (act.arc ?? 90) : (act.arc ?? 0);
        set(start.x + (target.x - start.x) * e, start.y + (target.y - start.y) * e - Math.sin(Math.PI * t) * arc, 1, t > 0.92 ? (1 - t) / 0.08 : 1);
        img.setRotation(spin * t);
        return;
      }
      case 'stretch': {
        img.setOrigin(0, 0.5);
        const o = from ? { x: from.chest.x + (from.side === 'ally' ? 1 : -1) * from.width * 0.3, y: from.chest.y } : start;
        const dist = Math.hypot(target.x - o.x, target.y - o.y);
        const reach = t < 0.4 ? easeOut(t / 0.4) : t > 0.7 ? 1 - easeIn((t - 0.7) / 0.3) : 1;
        img.setFlipX(false).setPosition(o.x, o.y).setRotation(Math.atan2(target.y - o.y, target.x - o.x));
        img.setDisplaySize(Math.max(1, dist * reach), baseW * ratio).setAlpha(act.alpha ?? 1);
        return;
      }
      case 'hover':
        set(target.x, target.y + Math.sin(t * Math.PI * 4) * 6, 1, fadeIO(t));
        return;
    }
  };
  // The secondary motion (ui/propMotion.ts) is computed once a frame; the path draws with it.
  const raw = (t: number) => (act.path === 'fall' ? t / 0.7 : t);
  const hitAt = act.path === 'fall' ? 0.7 : 0.92;
  let lastTrail = 0;
  const step = (t: number) => {
    m = propFrame(mods, t, raw(t), hitAt);
    img.setRotation(0);
    body(t);
    if (act.path !== 'stretch') img.setRotation(img.rotation + m.rot);
    ripple?.bend((t * act.dur) / 1000);
    if (mods.trail && t * act.dur - lastTrail >= mods.trail.every) {
      lastTrail = t * act.dur;
      h.bursts.play(mods.trail.ref, { x: img.x, y: img.y }, { mirror: flipped, tint: null, more: 1 });
    }
  };
  step(0);
  h.add(act.dur, (t) => step(t), () => img.destroy());
}
