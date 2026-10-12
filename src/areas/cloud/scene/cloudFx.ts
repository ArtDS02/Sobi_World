// The Cloud scene's motion and small drawings (decision 023), kept apart from CloudScene so the scene stays about what is
// drawn where. Presentation only: every function here is skipped or instant when motion is reduced, and none of it changes
// what a click does.
import * as Phaser from 'phaser';
import { PLOTS_PER_TIER } from '../logic/config/content';
import { CLOUD_VIEW, plotCentre } from './cloudView';

type Img = Phaser.GameObjects.Image;
import type { WorldRect } from '../../../systems/layout/camera';

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

/** A soft glow (WebGL only; null on the canvas renderer), off until hovered. */
export function glowOf(img: Img): Phaser.FX.Glow | null {
  const h = CLOUD_VIEW.hover;
  const glow = img.preFX?.addGlow(h.glow, h.strength, 0, false, 0.1, 12) ?? null;
  if (glow) glow.active = false;
  return glow;
}

/** Hover feedback on a clickable image: glow + a small swell from its current scale. */
export function hoverable(scene: Phaser.Scene, img: Img, opts: { paused: () => boolean; reduceMotion: () => boolean }) {
  const glow = glowOf(img);
  const h = CLOUD_VIEW.hover;
  const base = { x: img.scaleX, y: img.scaleY };
  const to = (k: number) => {
    if (opts.reduceMotion()) return void img.setScale(base.x * k, base.y * k);
    scene.tweens.add({ targets: img, scaleX: base.x * k, scaleY: base.y * k, duration: h.ms, ease: 'Sine.easeOut' });
  };
  img.on(Phaser.Input.Events.POINTER_OVER, () => {
    if (opts.paused()) return;
    if (glow) glow.active = true;
    to(h.swell);
  });
  img.on(Phaser.Input.Events.POINTER_OUT, () => {
    if (glow) glow.active = false;
    to(1);
  });
}

/** A slow up-and-down float; `n` picks its own period and phase. */
export function floatIdle(scene: Phaser.Scene, targets: Phaser.GameObjects.GameObject[], px: number, n: number) {
  const { duration, delay } = idleTiming(n);
  scene.tweens.add({ targets, y: `-=${px}`, duration, delay, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** The cloud bird floats, sways and beats its wings now and then. */
export function animateBird(scene: Phaser.Scene, bird: Img, home: { x: number; y: number }) {
  const i = CLOUD_VIEW.idle;
  const sy = bird.scaleY;
  scene.tweens.add({ targets: bird, y: home.y - 14, x: home.x - 10, duration: 3100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.tweens.add({ targets: bird, angle: { from: -i.swayDeg, to: i.swayDeg }, duration: 2300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.tweens.add({ targets: bird, scaleY: sy * 0.9, duration: 120, yoyo: true, repeat: -1, repeatDelay: i.flapMs, ease: 'Quad.easeOut' });
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
