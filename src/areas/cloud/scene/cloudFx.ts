// The Cloud scene's motion and small drawings (decision 023), kept apart from CloudScene so the scene stays about what is
// drawn where. Presentation only: every function here is skipped or instant when motion is reduced, and none of it changes
// what a click does.
import * as Phaser from 'phaser';
import type { WorldRect } from '../../../systems/layout/camera';
import { PLOTS_PER_TIER } from '../logic/config/content';
import { CLOUD_DESIGN, CLOUD_VIEW, plotCentre } from './cloudView';

type Img = Phaser.GameObjects.Image;

/** A small cloud drifting across the sky behind the island. */
export interface Drift {
  img: Img;
  def: (typeof CLOUD_VIEW.drift)[number];
}

export const makeDrifts = (make: (x: number, y: number, art: string) => Img): Drift[] =>
  CLOUD_VIEW.drift.map((def) => ({ def, img: make(0, def.y, def.art).setScale(def.scale).setAlpha(def.alpha).setDepth(CLOUD_VIEW.depth.drift) }));

/** Each drifting cloud crosses the visible sky at its own speed and comes back on the other side. */
export function moveDrifts(drifts: Drift[], view: WorldRect, time: number) {
  for (const { img, def } of drifts) {
    const span = view.width + img.displayWidth;
    const f = (time / 1000 / def.seconds + def.start) % 1;
    img.setX(view.x - img.displayWidth / 2 + f * span);
  }
}

/** Period and phase of the n-th idle motion: spread so no two objects move in step. */
function idleTiming(n: number): { duration: number; delay: number } {
  const [lo, hi] = CLOUD_VIEW.idle.bobMs;
  const f = (n * 0.618) % 1;
  return { duration: Math.round(lo + (hi - lo) * f), delay: Math.round(f * hi) };
}

/** A brightness control (WebGL only; null on the canvas renderer), neutral until hovered. */
export function brightOf(img: Img): Phaser.FX.ColorMatrix | null {
  return img.preFX?.addColorMatrix() ?? null;
}

/** Hover brightening of a plot: a touch lighter, never coloured. */
export function setBright(fx: Phaser.FX.ColorMatrix | null, on: boolean) {
  if (!fx) return;
  if (on) fx.brightness(CLOUD_VIEW.hover.brighten);
  else fx.reset();
}

/** Hover on a plank or an arrow: it presses up (a small swell from its current scale); no glow. */
export function pressable(scene: Phaser.Scene, img: Img, opts: { paused: () => boolean; reduceMotion: () => boolean }) {
  const h = CLOUD_VIEW.hover;
  const base = { x: img.scaleX, y: img.scaleY };
  const to = (k: number) => {
    if (opts.reduceMotion()) return void img.setScale(base.x * k, base.y * k);
    scene.tweens.add({ targets: img, scaleX: base.x * k, scaleY: base.y * k, duration: h.ms, ease: 'Sine.easeOut' });
  };
  img.on(Phaser.Input.Events.POINTER_OVER, () => !opts.paused() && to(h.swell));
  img.on(Phaser.Input.Events.POINTER_OUT, () => to(1));
}

/** Code-drawn textures of the scene's small effects: a water drop, a bubble, a caterpillar (K backend, no files). */
export const FX_KEYS = { drop: 'cloud_fx_drop', bubble: 'cloud_fx_bubble', pest: 'cloud_fx_pest' } as const;

export function ensureFxTextures(scene: Phaser.Scene) {
  const make = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make(FX_KEYS.drop, 12, 14, (g) => {
    g.fillStyle(0x8fd3f4, 1).fillCircle(6, 8, 5).fillTriangle(2, 7, 10, 7, 6, 0);
    g.fillStyle(0xffffff, 0.9).fillCircle(4.5, 7, 1.6);
  });
  make(FX_KEYS.bubble, 14, 14, (g) => {
    g.fillStyle(0xd9c4ff, 0.55).fillCircle(7, 7, 6);
    g.lineStyle(1.5, 0xb08ce8, 0.9).strokeCircle(7, 7, 6);
    g.fillStyle(0xffffff, 0.9).fillCircle(5, 5, 1.6);
  });
  const p = CLOUD_VIEW.pest;
  make(FX_KEYS.pest, p.width, p.height, (g) => {
    // A small green caterpillar facing right: four round segments, a darker outline, a head with an eye.
    for (let k = 0; k < 4; k += 1) {
      const x = 5 + k * 6;
      g.fillStyle(0x5c8a3a, 1).fillCircle(x, 9, 5);
      g.fillStyle(k === 3 ? 0x9bd36a : 0x86c95a, 1).fillCircle(x, 9, 4);
    }
    g.fillStyle(0x2f3a24, 1).fillCircle(25, 7.5, 1.2);
    g.lineStyle(1, 0x5c8a3a, 1).lineBetween(24, 4, 26, 1);
  });
}

/** Water drops jump out of the spring and fall back (hover answer of the spring). */
export function splash(scene: Phaser.Scene, x: number, y: number) {
  const n = CLOUD_VIEW.buildingFx.drops;
  for (let k = 0; k < n; k += 1) {
    const dx = (k - (n - 1) / 2) * 10 + Phaser.Math.Between(-4, 4);
    const top = y - Phaser.Math.Between(40, 80);
    const d = scene.add.image(x, y, FX_KEYS.drop).setDepth(CLOUD_VIEW.depth.building + 20).setScale(CLOUD_VIEW.buildingFx.dropScale);
    scene.tweens.add({ targets: d, x: x + dx * 1.6, duration: 620, ease: 'Linear' });
    scene.tweens.add({
      targets: d,
      y: top,
      duration: 260,
      delay: k * 25,
      ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({ targets: d, y: y + 10, alpha: 0, duration: 360, ease: 'Quad.easeIn', onComplete: () => d.destroy() }),
    });
  }
}

/** Bubbles rise out of the cauldron, wobbling, and pop (hover answer of the cauldron). */
export function bubbles(scene: Phaser.Scene, x: number, y: number) {
  const n = CLOUD_VIEW.buildingFx.bubbles;
  for (let k = 0; k < n; k += 1) {
    const [lo, hi] = CLOUD_VIEW.buildingFx.bubbleScale;
    const b = scene.add.image(x + Phaser.Math.Between(-30, 30), y, FX_KEYS.bubble).setDepth(CLOUD_VIEW.depth.building + 20).setScale(Phaser.Math.FloatBetween(lo, hi));
    scene.tweens.add({ targets: b, y: y - Phaser.Math.Between(60, 110), alpha: 0, duration: Phaser.Math.Between(700, 1100), delay: k * 90, ease: 'Sine.easeOut', onComplete: () => b.destroy() });
    scene.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-8, 8), duration: 260, yoyo: true, repeat: 2, delay: k * 90, ease: 'Sine.easeInOut' });
  }
}

/**
 * Flowers sway around their base in a light breeze: a small angle by stage, each plant its own period and phase, all of
 * them stirred together by a slow gust; a ripe flower also breathes (a small scale swing).
 */
export function swayFlowers(plots: readonly { flower: Img; stage: string | null; ripe: boolean }[], time: number) {
  const s = CLOUD_VIEW.sway;
  const r = CLOUD_VIEW.ripePulse;
  const gust = 1 + Math.sin((time / s.gustMs) * Math.PI * 2) * s.gust;
  plots.forEach((p, k) => {
    if (!p.stage) return;
    const amp = (s as unknown as Record<string, number>)[p.stage] ?? 0;
    const period = s.periodMs[0] + ((k * 0.618) % 1) * (s.periodMs[1] - s.periodMs[0]);
    p.flower.setAngle(Math.sin((time / period) * Math.PI * 2 + k * 1.7) * amp * gust);
    if (p.ripe) p.flower.setScale(CLOUD_VIEW.flowerScale * (1 + Math.sin((time / r.periodMs) * Math.PI * 2 + k) * r.scale));
  });
}

/** A slow up-and-down float; `n` picks its own period and phase. */
export function floatIdle(scene: Phaser.Scene, targets: Phaser.GameObjects.GameObject[], px: number, n: number) {
  const { duration, delay } = idleTiming(n);
  scene.tweens.add({ targets, y: `-=${px}`, duration, delay, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** A round counter over a building: a white-rimmed pill and its text. */
export interface Badge {
  box: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
}

/** Shows `text` in the pill (hidden when empty); `ready` paints it in the "come and take it" colour. */
export function drawBadge(b: Badge, text: string, ready: boolean) {
  const s = CLOUD_VIEW.badge;
  b.text.setText(text).setVisible(text !== '');
  b.box.clear().setVisible(text !== '');
  if (!text) return;
  const w = Math.max(s.minWidth, b.text.width + 22);
  b.box.fillStyle(s.border, 1).fillRoundedRect(-w / 2 - 3, -s.height / 2 - 3, w + 6, s.height + 6, (s.height + 6) / 2);
  b.box.fillStyle(ready ? s.readyBackground : s.background, 1).fillRoundedRect(-w / 2, -s.height / 2, w, s.height, s.height / 2);
}

/** A band of soft clouds that sweeps over the field while the tier changes (hidden otherwise). */
export function makeVeil(make: (x: number, y: number, art: string) => Img): Img[] {
  const v = CLOUD_VIEW;
  const m = v.tierMove;
  const centre = plotCentre(Math.floor(PLOTS_PER_TIER / 2));
  const arts = ['env_cloud_a', 'env_cloud_c', 'env_cloud_b', 'env_cloud_e', 'env_cloud_a', 'env_cloud_d'];
  return arts.map((art, k) => {
    const col = k % 3;
    const row = Math.floor(k / 3);
    const img = make(centre.x + (col - 1) * 300 + row * 120 - 60, centre.y + (row - 0.5) * 150, art).setScale(m.veilScale + (k % 2) * 0.2);
    img.preFX?.addBlur(0, m.veilBlur, m.veilBlur, 1);
    return img.setDepth(v.depth.veil).setAlpha(0).setVisible(false);
  });
}

export interface TierMove {
  field: Phaser.GameObjects.Container;
  backdrop: Img;
  veil: Img[];
  title: Phaser.GameObjects.Text;
  /** +1 going up, −1 going down. */
  dir: number;
  /** Puts the new tier on screen (called while the clouds cover the field); returns the title's resting scale. */
  swap: () => number;
  done: () => void;
}

/**
 * The pass through the clouds: the field sinks (going up) or rises (going down) and fades while a band of clouds closes in
 * from the side we travel to and the sky shifts a little (parallax); the new tier comes from the other side as they part.
 */
export function playTierMove(scene: Phaser.Scene, t: TierMove) {
  const m = CLOUD_VIEW.tierMove;
  const { dir } = t;
  scene.tweens.add({ targets: t.field, y: dir * m.shift, alpha: 0, duration: m.outMs, ease: 'Sine.easeIn' });
  scene.tweens.add({ targets: t.backdrop, y: t.backdrop.y + dir * m.sky, duration: m.outMs + m.inMs, ease: 'Sine.easeInOut', yoyo: true, hold: 40 });
  const centreY = plotCentre(Math.floor(PLOTS_PER_TIER / 2)).y;
  t.veil.forEach((img, k) => {
    const home = centreY + (Math.floor(k / 3) - 0.5) * 150;
    img.setVisible(true).setAlpha(0).setY(home - dir * m.travel);
    scene.tweens.add({ targets: img, y: home, alpha: m.veilAlpha, duration: m.outMs, delay: (k % 3) * 30, ease: 'Sine.easeOut' });
  });
  scene.time.delayedCall(m.outMs, () => {
    const fit = t.swap();
    t.field.setY(-dir * m.shift);
    scene.tweens.add({ targets: t.field, y: 0, alpha: 1, duration: m.inMs, ease: 'Sine.easeOut', onComplete: t.done });
    t.veil.forEach((img) =>
      scene.tweens.add({ targets: img, y: img.y + dir * m.travel, alpha: 0, duration: m.inMs, ease: 'Sine.easeIn', onComplete: () => img.setVisible(false) }),
    );
    scene.tweens.add({ targets: t.title, scale: { from: fit * 0.85, to: fit }, duration: m.inMs, ease: 'Back.easeOut' });
  });
}

/** The backdrop covers the whole visible view (wider or taller than the design frame), keeping its proportions. */
export function coverBackdrop(backdrop: Img, view: WorldRect) {
  const { width, height } = CLOUD_VIEW.backdrop;
  const s = Math.max(view.width / width, view.height / height, CLOUD_DESIGN.height / height);
  // A little taller than the view so the sky can shift during a tier change without showing an edge.
  const pad = 1 + (CLOUD_VIEW.tierMove.sky * 2) / (height * s);
  backdrop.setDisplaySize(width * s * pad, height * s * pad).setPosition(view.x + view.width / 2, view.y + view.height / 2);
}

/** The flat sky behind the backdrop (seen only where the image does not reach). */
export function paintSky(sky: Phaser.GameObjects.Graphics, night: boolean) {
  const { width, height } = CLOUD_DESIGN;
  const v = CLOUD_VIEW;
  const bleed = width * 2;
  sky.clear();
  sky.fillStyle(night ? v.sky.nightTop : v.sky.dayTop, 1).fillRect(-bleed, -bleed, width + bleed * 2, height + bleed * 2);
  sky.fillStyle(night ? v.sky.nightBottom : v.sky.dayBottom, 1).fillRect(-bleed, height * 0.55, width + bleed * 2, height + bleed);
}
